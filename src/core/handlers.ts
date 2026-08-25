/**
 * THE CAPABILITY IMPLEMENTATIONS — the only place business logic lives.
 *
 * Adapters (IPC, HTTP, CLI) hold none of this. They parse a transport envelope,
 * name a principal, and call `core.invoke`. If a rule is here, all three
 * surfaces obey it; if it were in an adapter, they would each obey a different
 * one and users would discover the divergence.
 *
 * Two conventions run through every handler:
 *
 *   · **Return the previous value on a mutation.** `previous` in the output is
 *     not decoration — it is what makes the operation auditable and usually
 *     undoable, without a second round trip.
 *   · **Never make the caller guess an id.** A `not_found` carries the ids that
 *     do exist. Exact-identifier dependence is a named failure mode.
 */

import { z } from '@appydave/core';
import {
  TRANSCRIPT_KINDS,
  TRIGGER_STYLES,
  findScript,
  findTranscript,
  findTriggerSet,
  paragraphsOf,
  transcriptText,
  validateScriptSet,
  validateTranscript,
  validateTriggerSet,
  type MajorTopic,
  type Script,
  type ScriptSet,
  type Talent,
  type Transcript,
  type TriggerSet,
} from '@shared/domain';
import { rigSchema, scriptSetSchema, talentSchema } from '@shared/domain-schema';
import {
  CAMERA_SIDES,
  RECORDING_SET,
  TEXT_PRESETS,
  canonicalZones,
  validateRig,
  validateRigLayout,
  type Rig,
  type RigLayout,
} from '@shared/rig';
import { CAPABILITIES, type CapabilityMeta, type Principal } from '@shared/capabilities';
import type { ActiveContextHolder } from './active-context.js';
import { scoreAgainst } from './cadence.js';
import type { Repository, RepositoryDocument } from './repository.js';
import { ConfirmationLedger, fail, fingerprint } from './safety.js';

export interface HandlerContext {
  repository: Repository;
  active: ActiveContextHolder;
  confirmations: ConfirmationLedger;
  principal: Principal;
  capability: CapabilityMeta;
  /** True when the caller asked for a preview rather than an act. */
  dryRun: boolean;
  confirmationId?: string;
  /** Hand the prior state to the audit log. Call it before you overwrite. */
  recordPrior: (prior: unknown) => void;
}

export type Handler = (input: unknown, context: HandlerContext) => Promise<unknown>;

/* ------------------------------------------------------------------ *
 * Shared input plumbing
 * ------------------------------------------------------------------ */

const parse = <T>(schema: z.ZodType<T>, input: unknown): T => {
  const parsed = schema.safeParse(input ?? {});
  if (!parsed.success) {
    fail('invalid_input', 'the input does not match this capability’s schema', {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
  return (parsed as { data: T }).data;
};

/** Fields every command accepts, stripped before the handler sees the rest. */
const commandEnvelope = {
  dryRun: z.boolean().optional(),
  confirmationId: z.string().optional(),
  idempotencyKey: z.string().optional(),
};

const slug = z.string().min(1);

/* ------------------------------------------------------------------ *
 * Resolution — with ambient context as the default argument
 * ------------------------------------------------------------------ */

interface Resolved {
  document: RepositoryDocument;
  set: ScriptSet;
  script: Script;
  transcript: Transcript;
}

const resolveSet = (
  document: RepositoryDocument,
  setId: string | undefined,
  active: ActiveContextHolder,
): ScriptSet => {
  const id = setId ?? active.defaulted('setId') ?? undefined;
  if (!id) {
    // Degrade with a hint, the way `get_active_context` does. An agent told
    // "which set?" can ask the human; an agent told "TypeError" cannot.
    fail('not_found', 'no set specified and nothing is open in Teletubby', {
      hint: 'Pass setId, or ask the talent to open a set.',
      available: document.sets.map((s) => s.id),
    });
  }
  const set = document.sets.find((candidate) => candidate.id === id);
  if (!set)
    fail('not_found', `no script set "${id}"`, {
      available: document.sets.map((s) => s.id),
    });
  return set;
};

const resolveScript = (
  set: ScriptSet,
  scriptId: string | undefined,
  active: ActiveContextHolder,
): Script => {
  const id = scriptId ?? active.defaulted('scriptId') ?? undefined;
  if (!id)
    fail('not_found', 'no script specified and nothing is open in Teletubby', {
      hint: 'Pass scriptId, or ask the talent to open a script.',
      available: set.scripts.map((s) => s.id),
    });
  const script = findScript(set, id);
  if (!script)
    fail('not_found', `no script "${id}" in set "${set.id}"`, {
      available: set.scripts.map((s) => s.id),
    });
  return script;
};

const resolveTranscript = (
  script: Script,
  transcriptId: string | undefined,
  active: ActiveContextHolder,
): Transcript => {
  const id = transcriptId ?? active.defaulted('transcriptId') ?? undefined;
  if (!id)
    fail('not_found', 'no transcript specified and nothing is open in Teletubby', {
      hint: 'Pass transcriptId, or ask the talent to open one.',
      available: script.transcripts.map((t) => t.id),
    });
  const transcript = findTranscript(script, id);
  if (!transcript)
    fail('not_found', `no transcript "${id}" on script "${script.id}"`, {
      available: script.transcripts.map((t) => ({
        id: t.id,
        kind: t.kind,
        corpus: t.corpus,
      })),
    });
  return transcript;
};

const resolveAll = async (
  context: HandlerContext,
  ids: { setId?: string; scriptId?: string; transcriptId?: string },
): Promise<Resolved> => {
  const document = await context.repository.read();
  const set = resolveSet(document, ids.setId, context.active);
  const script = resolveScript(set, ids.scriptId, context.active);
  const transcript = resolveTranscript(script, ids.transcriptId, context.active);
  return { document, set, script, transcript };
};

/* ------------------------------------------------------------------ *
 * Projections — what a caller gets back
 * ------------------------------------------------------------------ */

/**
 * The set view (requirements §6). A summary per script so twelve are scannable
 * in one sitting, and enough shape to choose — never the full transcripts,
 * which is what makes it scannable.
 */
const setSummary = (set: ScriptSet): unknown => ({
  id: set.id,
  title: set.title,
  description: set.description,
  scriptCount: set.scripts.length,
  scripts: set.scripts.map((script) => ({
    id: script.id,
    n: script.n,
    title: script.title,
    summary: script.summary,
    takeaway: script.takeaway,
    transcripts: script.transcripts.map((transcript) => ({
      id: transcript.id,
      kind: transcript.kind,
      corpus: transcript.corpus,
      talentId: transcript.talentId,
      styles: transcript.triggerSets.map((triggerSet) => triggerSet.style),
    })),
  })),
});

/* ------------------------------------------------------------------ *
 * Id minting — stable, in-document, and never positional at read time
 * ------------------------------------------------------------------ */

const mintTopicIds = (topics: MajorTopic[]): MajorTopic[] => {
  let paragraph = 0;
  return topics.map((major, m) => ({
    ...major,
    id: major.id || `t${m + 1}`,
    minors: major.minors.map((minor, n) => ({
      ...minor,
      id: minor.id || `t${m + 1}.${n + 1}`,
      paragraphs: minor.paragraphs.map((p) => ({
        ...p,
        id: p.id || `p${++paragraph}`,
      })),
    })),
  }));
};

const mintTriggerIds = (set: TriggerSet): TriggerSet => ({
  ...set,
  triggers: set.triggers.map((trigger, index) => ({
    ...trigger,
    id: trigger.id || `g${index + 1}`,
  })),
});

/* ------------------------------------------------------------------ *
 * Input schemas
 * ------------------------------------------------------------------ */

const paragraphInput = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
});
const minorInput = z.object({
  id: z.string().optional(),
  heading: z.string().min(1),
  paragraphs: z.array(paragraphInput).min(1),
});
const majorInput = z.object({
  id: z.string().optional(),
  heading: z.string().min(1),
  minors: z.array(minorInput).min(1),
});
/**
 * A layout as a caller supplies it. `visible` is canonicalised on the way in
 * rather than rejected out of order — the order a human toggled zones in is not
 * information, and refusing it would make a hand-written rig fiddly for no gain.
 */
const layoutInput = z.object({
  visible: z.array(z.enum(RECORDING_SET)).min(1),
  driven: z.enum(RECORDING_SET),
  weights: z.object({
    major: z.number().finite(),
    minor: z.number().finite(),
    triggers: z.number().finite(),
    paragraph: z.number().finite(),
  }),
  camera: z.enum(CAMERA_SIDES),
  text: z.enum(TEXT_PRESETS),
  mirror: z.boolean(),
  focus: z.boolean(),
});

const normalizeLayout = (layout: RigLayout): RigLayout => ({
  ...layout,
  visible: canonicalZones(layout.visible),
  weights: { ...layout.weights },
});

const triggerInput = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
  paragraphId: slug,
});

/* ------------------------------------------------------------------ *
 * The handlers
 * ------------------------------------------------------------------ */

export function createHandlers(): Record<string, Handler> {
  const handlers: Record<string, Handler> = {};

  /* --- self-description ------------------------------------------- */

  handlers.describe_capabilities = async (_input, context) => ({
    // Only what THIS principal can reach. Advertising a verb the caller may
    // not call is how an agent burns a turn discovering a permission error.
    capabilities: CAPABILITIES.filter((capability) =>
      capability.principals.includes(context.principal),
    ),
    principal: context.principal,
  });

  /* --- ambient context -------------------------------------------- */

  handlers.get_active_context = async (_input, context) => context.active.get();

  handlers.set_active_context = async (input, context) => {
    const parsed = parse(
      z.object({
        setId: slug.nullish(),
        scriptId: slug.nullish(),
        transcriptId: slug.nullish(),
        style: z.enum(TRIGGER_STYLES).nullish(),
        step: z.number().int().nonnegative().nullish(),
      }),
      input,
    );
    return context.active.set(parsed as never);
  };

  /* --- reading ----------------------------------------------------- */

  handlers.list_sets = async (_input, context) => {
    const document = await context.repository.read();
    return {
      sets: document.sets.map((set) => ({
        id: set.id,
        title: set.title,
        description: set.description,
        scriptCount: set.scripts.length,
      })),
    };
  };

  handlers.get_set = async (input, context) => {
    const { setId, full } = parse(
      z.object({ setId: slug.optional(), full: z.boolean().optional() }),
      input,
    );
    const document = await context.repository.read();
    const set = resolveSet(document, setId, context.active);
    // Summary by default — that is what makes twelve scripts scannable in one
    // sitting (§6). A caller that has to RENDER the set asks for `full`; making
    // it the default would push the whole corpus through every list view.
    return full ? set : setSummary(set);
  };

  handlers.get_script = async (input, context) => {
    const { setId, scriptId } = parse(
      z.object({ setId: slug.optional(), scriptId: slug.optional() }),
      input,
    );
    const document = await context.repository.read();
    const set = resolveSet(document, setId, context.active);
    return {
      setId: set.id,
      script: resolveScript(set, scriptId, context.active),
    };
  };

  handlers.get_transcript = async (input, context) => {
    const ids = parse(
      z.object({
        setId: slug.optional(),
        scriptId: slug.optional(),
        transcriptId: slug.optional(),
      }),
      input,
    );
    const { set, script, transcript } = await resolveAll(context, ids);
    return {
      setId: set.id,
      scriptId: script.id,
      transcript,
      paragraphCount: paragraphsOf(transcript).length,
    };
  };

  handlers.get_trigger_set = async (input, context) => {
    const ids = parse(
      z.object({
        setId: slug.optional(),
        scriptId: slug.optional(),
        transcriptId: slug.optional(),
        style: z.enum(TRIGGER_STYLES),
      }),
      input,
    );
    const { script, transcript } = await resolveAll(context, ids);
    const triggerSet = findTriggerSet(transcript, ids.style);
    if (!triggerSet)
      fail('not_found', `transcript "${transcript.id}" has no "${ids.style}" trigger set`, {
        available: transcript.triggerSets.map((t) => t.style),
      });
    return { scriptId: script.id, transcriptId: transcript.id, triggerSet };
  };

  handlers.list_talents = async (_input, context) => {
    const document = await context.repository.read();
    return { talents: document.talents };
  };

  handlers.get_talent = async (input, context) => {
    const { talentId } = parse(z.object({ talentId: slug }), input);
    const document = await context.repository.read();
    const talent = document.talents.find((candidate) => candidate.id === talentId);
    if (!talent)
      fail('not_found', `no talent "${talentId}"`, {
        available: document.talents.map((t) => t.id),
      });
    return { talent };
  };

  handlers.score_transcript = async (input, context) => {
    const parsed = parse(
      z.object({
        setId: slug.optional(),
        scriptId: slug.optional(),
        transcriptId: slug.optional(),
        /** Score arbitrary text instead of a stored transcript. */
        text: z.string().min(1).optional(),
        talentId: slug,
        /** Content terms the provenance owner requires to survive re-cadencing. */
        mustTerms: z.array(z.string().min(1)).optional(),
      }),
      input,
    );

    const document = await context.repository.read();
    const talent = document.talents.find((candidate) => candidate.id === parsed.talentId);
    if (!talent)
      fail('not_found', `no talent "${parsed.talentId}" — an envelope belongs to one person`, {
        available: document.talents.map((t) => t.id),
      });

    let text = parsed.text;
    let scored: { scriptId?: string; transcriptId?: string } = {};
    if (!text) {
      const { script, transcript } = await resolveAll(context, parsed);
      text = transcriptText(transcript);
      scored = { scriptId: script.id, transcriptId: transcript.id };
    }

    return {
      ...scored,
      talentId: talent.id,
      score: scoreAgainst(text, talent.envelope, parsed.mustTerms ?? []),
    };
  };

  /* --- writing ----------------------------------------------------- */

  handlers.create_set = async (input, context) => {
    const parsed = parse(
      z.object({
        id: slug,
        title: z.string().min(1),
        description: z.string().default(''),
        ...commandEnvelope,
      }),
      input,
    );
    const set: ScriptSet = {
      id: parsed.id,
      title: parsed.title,
      description: parsed.description ?? '',
      scripts: [],
    };
    assertShape(scriptSetSchema, set, 'set');

    return context.repository.update<unknown>((document) => {
      if (document.sets.some((existing) => existing.id === set.id))
        fail('conflict', `a set "${set.id}" already exists`);
      if (context.dryRun) return { document, result: { applied: false, preview: { set } } };
      document.sets.push(set);
      return { document, result: { applied: true, set } };
    });
  };

  handlers.create_script = async (input, context) => {
    const parsed = parse(
      z.object({
        setId: slug.optional(),
        id: slug,
        n: z.number().int().positive().optional(),
        title: z.string().min(1),
        takeaway: z.string().min(1),
        summary: z.string().min(1),
        /** Optional provenance transcript, so one call can land a whole script. */
        provenance: z
          .object({
            id: slug.optional(),
            corpus: slug,
            source: z.string().min(1),
            topics: z.array(majorInput).min(1),
          })
          .optional(),
        ...commandEnvelope,
      }),
      input,
    );

    return context.repository.update<unknown>((document) => {
      const set = resolveSet(document, parsed.setId, context.active);
      if (findScript(set, parsed.id))
        fail('conflict', `set "${set.id}" already has a script "${parsed.id}"`);

      const script: Script = {
        id: parsed.id,
        n: parsed.n ?? set.scripts.length + 1,
        title: parsed.title,
        takeaway: parsed.takeaway,
        summary: parsed.summary,
        transcripts: parsed.provenance
          ? [
              {
                id: parsed.provenance.id ?? 'provenance',
                kind: 'provenance',
                corpus: parsed.provenance.corpus,
                talentId: null,
                source: parsed.provenance.source,
                topics: mintTopicIds(parsed.provenance.topics as MajorTopic[]),
                triggerSets: [],
              },
            ]
          : [],
      };

      const candidate: ScriptSet = {
        ...set,
        scripts: [...set.scripts, script],
      };
      assertDomain(validateScriptSet(candidate));

      if (context.dryRun) return { document, result: { applied: false, preview: { script } } };
      set.scripts.push(script);
      return { document, result: { applied: true, setId: set.id, script } };
    });
  };

  handlers.update_script = async (input, context) => {
    const parsed = parse(
      z.object({
        setId: slug.optional(),
        scriptId: slug.optional(),
        title: z.string().min(1).optional(),
        takeaway: z.string().min(1).optional(),
        summary: z.string().min(1).optional(),
        ...commandEnvelope,
      }),
      input,
    );

    return context.repository.update<unknown>((document) => {
      const set = resolveSet(document, parsed.setId, context.active);
      const script = resolveScript(set, parsed.scriptId, context.active);
      const previous = {
        title: script.title,
        takeaway: script.takeaway,
        summary: script.summary,
      };
      const next = {
        title: parsed.title ?? script.title,
        takeaway: parsed.takeaway ?? script.takeaway,
        summary: parsed.summary ?? script.summary,
      };
      context.recordPrior(previous);

      if (context.dryRun)
        return {
          document,
          result: { applied: false, preview: { previous, next } },
        };

      Object.assign(script, next);
      // Returning `previous` is what makes this auditable and undoable without
      // a second round trip.
      return {
        document,
        result: { applied: true, scriptId: script.id, previous, current: next },
      };
    });
  };

  handlers.write_transcript = async (input, context) => {
    const parsed = parse(
      z.object({
        setId: slug.optional(),
        scriptId: slug.optional(),
        id: slug,
        kind: z.enum(TRANSCRIPT_KINDS),
        corpus: slug,
        talentId: slug.nullish(),
        source: z.string().min(1),
        topics: z.array(majorInput).min(1),
        /** Trigger sets are written separately; an existing set is preserved. */
        ...commandEnvelope,
      }),
      input,
    );

    return context.repository.update<unknown>((document) => {
      const set = resolveSet(document, parsed.setId, context.active);
      const script = resolveScript(set, parsed.scriptId, context.active);
      const existing = findTranscript(script, parsed.id);

      const transcript: Transcript = {
        id: parsed.id,
        kind: parsed.kind,
        corpus: parsed.corpus,
        talentId: parsed.talentId ?? null,
        source: parsed.source,
        topics: mintTopicIds(parsed.topics as MajorTopic[]),
        // Replacing the text does NOT silently drop the trigger sets — but it
        // can invalidate their map, so they are re-validated below and the
        // write is refused if a trigger now points at a paragraph that is gone.
        triggerSets: existing?.triggerSets ?? [],
      };

      assertDomain(validateTranscript(transcript, `transcript[${transcript.id}]`));

      const candidate: Script = {
        ...script,
        transcripts: existing
          ? script.transcripts.map((t) => (t.id === transcript.id ? transcript : t))
          : [...script.transcripts, transcript],
      };
      assertDomain(validateScriptSet({ ...set, scripts: [candidate] }));

      context.recordPrior(existing ?? null);
      if (context.dryRun)
        return {
          document,
          result: {
            applied: false,
            preview: { previous: existing ?? null, next: transcript },
          },
        };

      script.transcripts = candidate.transcripts;
      return {
        document,
        result: {
          applied: true,
          scriptId: script.id,
          previous: existing ?? null,
          transcript,
        },
      };
    });
  };

  handlers.write_trigger_set = async (input, context) => {
    const parsed = parse(
      z.object({
        setId: slug.optional(),
        scriptId: slug.optional(),
        transcriptId: slug.optional(),
        style: z.enum(TRIGGER_STYLES),
        authoredBy: z.enum(['hand', 'agent']).default('agent'),
        note: z.string().optional(),
        triggers: z.array(triggerInput).min(2),
        ...commandEnvelope,
      }),
      input,
    );

    return context.repository.update<unknown>((document) => {
      const set = resolveSet(document, parsed.setId, context.active);
      const script = resolveScript(set, parsed.scriptId, context.active);
      const transcript = resolveTranscript(script, parsed.transcriptId, context.active);
      const previous = findTriggerSet(transcript, parsed.style) ?? null;

      const triggerSet = mintTriggerIds({
        style: parsed.style,
        authoredBy: parsed.authoredBy ?? 'agent',
        note: parsed.note,
        triggers: parsed.triggers as TriggerSet['triggers'],
      });

      // The map is authored data and it is validated on write, not on read.
      // A wrong sync is worse than none (prior-art §5), so a bad map is
      // refused at the door rather than discovered mid-take.
      assertDomain(validateTriggerSet(triggerSet, transcript, `triggerSet[${parsed.style}]`));

      context.recordPrior(previous);
      if (context.dryRun)
        return {
          document,
          result: { applied: false, preview: { previous, next: triggerSet } },
        };

      transcript.triggerSets = [
        ...transcript.triggerSets.filter((existing) => existing.style !== parsed.style),
        triggerSet,
      ];
      return {
        document,
        result: {
          applied: true,
          scriptId: script.id,
          transcriptId: transcript.id,
          previous,
          triggerSet,
        },
      };
    });
  };

  handlers.upsert_talent = async (input, context) => {
    const parsed = parse(
      z.object({
        id: slug,
        name: z.string().min(1),
        envelope: z.object({
          wordsMin: z.number().int().nonnegative(),
          wordsMax: z.number().int().positive(),
          breathGroupMeanMin: z.number().nonnegative(),
          breaksPer100Max: z.number().nonnegative(),
          sentenceSdMin: z.number().nonnegative(),
          emDashMax: z.number().int().nonnegative(),
          antiVoice: z.array(z.string().min(1)).default([]),
          bookends: z.array(z.string().min(1)).default([]),
          // Never guessable. An envelope with no provenance is a number
          // someone will later port to another talent because nothing said
          // whose it was.
          source: z.string().min(1),
        }),
        ...commandEnvelope,
      }),
      input,
    );

    const talent: Talent = {
      id: parsed.id,
      name: parsed.name,
      envelope: {
        ...parsed.envelope,
        antiVoice: parsed.envelope.antiVoice ?? [],
        bookends: parsed.envelope.bookends ?? [],
      },
    };
    assertShape(talentSchema, talent, 'talent');

    return context.repository.update<unknown>((document) => {
      const index = document.talents.findIndex((candidate) => candidate.id === talent.id);
      const previous = index >= 0 ? document.talents[index] : null;
      context.recordPrior(previous);

      if (context.dryRun)
        return {
          document,
          result: { applied: false, preview: { previous, next: talent } },
        };

      if (index >= 0) document.talents[index] = talent;
      else document.talents.push(talent);
      return { document, result: { applied: true, previous, talent } };
    });
  };

  /* --- rigs: the arrangement in front of the talent ----------------- */

  /**
   * Rigs and the workspace come back together because the UI needs both in the
   * same breath — which arrangements exist, and which one to open on. Two
   * queries would mean a window that can render the chips before it knows
   * which is lit.
   */
  handlers.list_rigs = async (_input, context) => {
    const document = await context.repository.read();
    return { rigs: document.rigs, workspace: document.workspace };
  };

  handlers.save_rig = async (input, context) => {
    const parsed = parse(
      z.object({
        id: slug,
        label: z.string().min(1),
        layout: layoutInput,
        ...commandEnvelope,
      }),
      input,
    );

    const rig: Rig = {
      id: parsed.id,
      label: parsed.label,
      layout: normalizeLayout(parsed.layout),
    };
    assertShape(rigSchema, rig, 'rig');
    // The shape gate says the fields are the right types; this says the
    // arrangement is one the app would let a human build. A rig that drives a
    // hidden zone passes the first and must never pass the second.
    assertDomain(validateRig(rig));

    return context.repository.update<unknown>((document) => {
      const index = document.rigs.findIndex((candidate) => candidate.id === rig.id);
      const previous = index >= 0 ? document.rigs[index] : null;
      context.recordPrior(previous);

      if (context.dryRun)
        return { document, result: { applied: false, preview: { previous, next: rig } } };

      if (index >= 0) document.rigs[index] = rig;
      else document.rigs.push(rig);
      return { document, result: { applied: true, previous, rig } };
    });
  };

  handlers.rename_rig = async (input, context) => {
    const parsed = parse(
      z.object({ id: slug, label: z.string().min(1), ...commandEnvelope }),
      input,
    );

    return context.repository.update<unknown>((document) => {
      const rig = document.rigs.find((candidate) => candidate.id === parsed.id);
      if (!rig)
        fail('not_found', `no rig "${parsed.id}"`, {
          available: document.rigs.map((r) => r.id),
        });

      const previous = rig.label;
      context.recordPrior(previous);
      // Renaming touches the label and NOTHING else — the id is the stable
      // handle the workspace points at, so a rename can never orphan it.
      const next: Rig = { ...rig, label: parsed.label };
      assertShape(rigSchema, next, 'rig');

      if (context.dryRun)
        return { document, result: { applied: false, preview: { previous, label: parsed.label } } };

      rig.label = parsed.label;
      return { document, result: { applied: true, previous, rig } };
    });
  };

  /**
   * The sticky layout: what the talent had on screen when they last touched it.
   *
   * UI-only, like `set_active_context`. It is not a fact about the data, it is
   * the human's own working state — and an agent writing it would decide what
   * appears in front of a person at the moment a take starts, which is exactly
   * when nobody is looking at the screen to catch it.
   */
  handlers.remember_layout = async (input, context) => {
    const parsed = parse(z.object({ layout: layoutInput, rigId: slug.nullish() }), input);

    const layout = normalizeLayout(parsed.layout);
    assertDomain(validateRigLayout(layout));

    return context.repository.update<unknown>((document) => {
      // A pointer to a rig that has since been deleted is dropped rather than
      // stored: the layout is still the talent's, the attribution is not.
      const rigId =
        parsed.rigId && document.rigs.some((rig) => rig.id === parsed.rigId) ? parsed.rigId : null;
      context.recordPrior(document.workspace);
      document.workspace = { layout, rigId };
      return { document, result: { applied: true, workspace: document.workspace } };
    });
  };

  /* --- removal: preview → confirm → execute ------------------------ */

  handlers.delete_trigger_set = async (input, context) => {
    const parsed = parse(
      z.object({
        setId: slug.optional(),
        scriptId: slug.optional(),
        transcriptId: slug.optional(),
        style: z.enum(TRIGGER_STYLES),
        ...commandEnvelope,
      }),
      input,
    );
    const { transcript } = await resolveAll(context, parsed);
    const target = findTriggerSet(transcript, parsed.style);
    if (!target)
      fail('not_found', `transcript "${transcript.id}" has no "${parsed.style}" trigger set`, {
        available: transcript.triggerSets.map((t) => t.style),
      });

    const preview = {
      wouldRemove: `${parsed.style} trigger set`,
      transcriptId: transcript.id,
      triggerCount: target.triggers.length,
      authoredBy: target.authoredBy,
    };

    return guardedDelete(context, input, preview, async () =>
      context.repository.update((document) => {
        const set = resolveSet(document, parsed.setId, context.active);
        const script = resolveScript(set, parsed.scriptId, context.active);
        const live = resolveTranscript(script, parsed.transcriptId, context.active);
        const removed = findTriggerSet(live, parsed.style) ?? null;
        context.recordPrior(removed);
        live.triggerSets = live.triggerSets.filter((existing) => existing.style !== parsed.style);
        return { document, result: { applied: true, removed } };
      }),
    );
  };

  handlers.delete_script = async (input, context) => {
    const parsed = parse(
      z.object({
        setId: slug.optional(),
        scriptId: slug.optional(),
        ...commandEnvelope,
      }),
      input,
    );
    const document = await context.repository.read();
    const set = resolveSet(document, parsed.setId, context.active);
    const script = resolveScript(set, parsed.scriptId, context.active);

    // Consequences, not intent. This is the whole value of the preview step —
    // a human sees what disappears, not what was asked for.
    const preview = {
      wouldRemove: script.title,
      scriptId: script.id,
      transcripts: script.transcripts.map((transcript) => ({
        id: transcript.id,
        kind: transcript.kind,
        corpus: transcript.corpus,
        paragraphs: paragraphsOf(transcript).length,
        triggerSets: transcript.triggerSets.map((t) => t.style),
      })),
    };

    return guardedDelete(context, input, preview, async () =>
      context.repository.update((live) => {
        const liveSet = resolveSet(live, parsed.setId, context.active);
        const removed = findScript(liveSet, script.id) ?? null;
        context.recordPrior(removed);
        liveSet.scripts = liveSet.scripts.filter((candidate) => candidate.id !== script.id);
        return { document: live, result: { applied: true, removed } };
      }),
    );
  };

  /* --- the confirmation channel (UI only) -------------------------- */

  handlers.list_pending = async (_input, context) => ({
    pending: context.confirmations.list(),
  });

  handlers.approve_pending = async (input, context) => {
    const { pendingId } = parse(z.object({ pendingId: z.string().min(1) }), input);
    const approved = context.confirmations.approve(pendingId);
    return { approved: true, pending: approved };
  };

  handlers.delete_rig = async (input, context) => {
    const parsed = parse(z.object({ id: slug, ...commandEnvelope }), input);
    const document = await context.repository.read();
    const rig = document.rigs.find((candidate) => candidate.id === parsed.id);
    if (!rig)
      fail('not_found', `no rig "${parsed.id}"`, {
        available: document.rigs.map((r) => r.id),
      });

    // Consequences, not intent: the name being lost and the arrangement it
    // stood for, so the human approving it recognises what they are dropping.
    const preview = {
      wouldRemove: rig.label,
      rigId: rig.id,
      layout: rig.layout,
      inUse: document.workspace.rigId === rig.id,
    };

    return guardedDelete(context, input, preview, async () =>
      context.repository.update((live) => {
        const removed = live.rigs.find((candidate) => candidate.id === parsed.id) ?? null;
        context.recordPrior(removed);
        live.rigs = live.rigs.filter((candidate) => candidate.id !== parsed.id);
        // Deleting a rig must NOT rearrange a screen someone is talking to. The
        // layout stays exactly as it is; only the attribution to a rig that no
        // longer exists is dropped.
        if (live.workspace.rigId === parsed.id) live.workspace = { ...live.workspace, rigId: null };
        return { document: live, result: { applied: true, removed } };
      }),
    );
  };

  return handlers;
}

/* ------------------------------------------------------------------ *
 * Assertion helpers
 * ------------------------------------------------------------------ */

function assertShape<T>(schema: z.ZodType<T>, value: T, label: string): void {
  const parsed = schema.safeParse(value);
  if (!parsed.success)
    fail('domain_invalid', `the ${label} is not a valid domain object`, {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
}

function assertDomain(violations: { path: string; message: string }[]): void {
  if (violations.length > 0)
    fail('domain_invalid', 'the write would break a domain rule', {
      violations,
    });
}

/**
 * The destructive path. Kept as one function so that adding a destructive verb
 * cannot accidentally omit the gate — there is only one way through.
 */
async function guardedDelete<T>(
  context: HandlerContext,
  input: unknown,
  preview: unknown,
  execute: () => Promise<T>,
): Promise<unknown> {
  const print = fingerprint(input);

  if (context.dryRun || !context.confirmationId) {
    const pending = context.confirmations.open(
      context.capability.name,
      context.principal,
      preview,
      print,
    );
    return {
      applied: false,
      preview,
      pendingId: pending.id,
      expiresAt: pending.expiresAt,
      hint: 'A human must approve this in Teletubby, then call again with the same input plus confirmationId.',
    };
  }

  context.confirmations.consume(context.confirmationId, context.capability.name, print);
  return execute();
}
