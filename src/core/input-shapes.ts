/**
 * INPUT SHAPES — one schema per verb, THE schema: the object the gate parses
 * with is the object describe_capabilities publishes. Field names, types,
 * required/optional and notes are derived from it live (describeInput), so
 * the published surface cannot drift from the validator — the drift a
 * hand-transcribed table in SKILL.md had already begun (2026-09-02).
 */

import { z } from '@appydave/core';
import {
  PROJECT_NAME_MAX,
  PROJECT_NAME_PATTERN,
  TRANSCRIPT_KINDS,
  TRIGGER_STYLES,
} from '@shared/domain';
import { CAMERA_SIDES, RECORDING_SET, TEXT_PRESETS } from '@shared/rig';

/** Fields every command accepts, stripped before the handler sees the rest. */
const commandEnvelope = {
  dryRun: z.boolean().optional(),
  confirmationId: z.string().optional(),
  idempotencyKey: z.string().optional(),
};

const slug = z.string().min(1);

/** A FliHub folder name, verbatim — FliHub's own kebab rule, mirrored not reinvented. */
const projectName = z
  .string()
  .trim()
  .regex(PROJECT_NAME_PATTERN, 'not a FliHub folder name (kebab-case, e.g. d01-kybernesis-12-videos)')
  .max(PROJECT_NAME_MAX, `a FliHub folder name is at most ${PROJECT_NAME_MAX} characters`);

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

const triggerInput = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
  paragraphId: slug,
});

/** Every verb that takes input. A verb absent here takes {} — published as []. */
export const INPUT: Record<string, z.ZodObject<z.ZodRawShape>> = {
  set_active_context: z.object({
        setId: slug.nullish(),
        scriptId: slug.nullish(),
        transcriptId: slug.nullish(),
        style: z.enum(TRIGGER_STYLES).nullish(),
        step: z.number().int().nonnegative().nullish(),
      }),

  get_set: z.object({ setId: slug.optional(), full: z.boolean().optional() }),

  get_script: z.object({ setId: slug.optional(), scriptId: slug.optional() }),

  get_transcript: z.object({
        setId: slug.optional(),
        scriptId: slug.optional(),
        transcriptId: slug.optional(),
      }),

  get_trigger_set: z.object({
        setId: slug.optional(),
        scriptId: slug.optional(),
        transcriptId: slug.optional(),
        style: z.enum(TRIGGER_STYLES),
      }),

  get_talent: z.object({ talentId: slug }),

  score_transcript: z.object({
        setId: slug.optional(),
        scriptId: slug.optional(),
        transcriptId: slug.optional(),
        /** Score arbitrary text instead of a stored transcript. */
        text: z.string().min(1).optional(),
        talentId: slug,
        /** Content terms the provenance owner requires to survive re-cadencing. */
        mustTerms: z.array(z.string().min(1)).optional(),
      }),

  create_set: z.object({
        id: slug,
        title: z.string().min(1),
        description: z.string().default(''),
        /**
         * The FliHub folder name, VERBATIM and FULL — `d01-kybernesis-12-videos`,
         * never a short code. On FliHub's side `d01` resolves by prefix to the
         * first alphabetical match: a lookup convenience, not an identifier.
         * Existence over there is NOT checked here — FliHub may be down, and its
         * projects root holds non-project folders too. A caller wanting the
         * courtesy check resolves via FliHub's API (GET :5101/api/query/projects)
         * before calling. David names projects; the app never invents one.
         */
        project: projectName
          .nullish()
          .describe(
            'the FliHub project folder name, VERBATIM and FULL (d01-kybernesis-12-videos) — never a short code; codes are not unique and prefix-resolution picks alphabetically on the FliHub side',
          ),
        ...commandEnvelope,
      }),

  rename_set: z.object({
        setId: slug.optional(),
        title: z.string().trim().min(1).optional(),
        project: projectName
          .nullish()
          .describe(
            'ATTACH only — null→value backfills an unattached set (full folder name, verbatim); changing an attached project is refused: that is a move, not a rename, and moves are not built',
          ),
        ...commandEnvelope,
      }),

  create_script: z.object({
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

  update_script: z.object({
        setId: slug.optional(),
        scriptId: slug.optional(),
        title: z.string().min(1).optional(),
        takeaway: z.string().min(1).optional(),
        summary: z.string().min(1).optional(),
        ...commandEnvelope,
      }),

  write_transcript: z.object({
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

  write_trigger_set: z.object({
        setId: slug.optional(),
        scriptId: slug.optional(),
        transcriptId: slug.optional(),
        style: z.enum(TRIGGER_STYLES),
        authoredBy: z.enum(['hand', 'agent']).default('agent'),
        note: z.string().optional(),
        triggers: z.array(triggerInput).min(2),
        ...commandEnvelope,
      }),

  upsert_talent: z.object({
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

  save_rig: z.object({
        id: slug,
        label: z.string().min(1),
        layout: layoutInput,
        ...commandEnvelope,
      }),

  rename_rig: z.object({ id: slug, label: z.string().min(1), ...commandEnvelope }),

  remember_layout: z.object({
        layout: layoutInput,
        rigId: slug.nullish(),
        // The talent's place — script, corpus, style, paragraph — so a reload
        // puts the same words back in front of them (2026-08-31, recording day:
        // every dev reload was throwing away where David was mid-take). Stored
        // as given: ids that stop existing are resolved at RESTORE time, where
        // the current data is, not at write time.
        position: z
          .object({
            setId: slug.nullable(),
            scriptId: slug.nullable(),
            transcriptId: slug.nullable(),
            style: z.enum(TRIGGER_STYLES).nullable(),
            paragraphId: slug.nullable(),
          })
          .nullish(),
      }),

  delete_trigger_set: z.object({
        setId: slug.optional(),
        scriptId: slug.optional(),
        transcriptId: slug.optional(),
        style: z.enum(TRIGGER_STYLES),
        ...commandEnvelope,
      }),

  delete_script: z.object({
        setId: slug.optional(),
        scriptId: slug.optional(),
        ...commandEnvelope,
      }),

  approve_pending: z.object({ pendingId: z.string().min(1) }),

  delete_rig: z.object({ id: slug, ...commandEnvelope }),
};

export interface InputField {
  name: string;
  type: string;
  required: boolean;
  note?: string;
}

const typeOf = (schema: z.ZodTypeAny, depth = 0): string => {
  const def = (schema as z.ZodTypeAny & { _def: Record<string, unknown> })._def as {
    typeName: string;
    innerType?: z.ZodTypeAny;
    schema?: z.ZodTypeAny;
    type?: z.ZodTypeAny;
    values?: string[];
    shape?: () => Record<string, z.ZodTypeAny>;
  };
  switch (def.typeName) {
    case 'ZodOptional':
    case 'ZodNullable':
    case 'ZodDefault':
      return typeOf(def.innerType!, depth);
    case 'ZodEffects':
      return typeOf(def.schema!, depth);
    case 'ZodString':
      return 'string';
    case 'ZodNumber':
      return 'number';
    case 'ZodBoolean':
      return 'boolean';
    case 'ZodEnum':
      return `enum(${(def.values ?? []).join('|')})`;
    case 'ZodArray':
      return `array<${typeOf(def.type!, depth + 1)}>`;
    case 'ZodObject': {
      // One level of keys, then just "object" — a summary, not a JSON Schema.
      if (depth >= 2) return 'object';
      const shape = def.shape!();
      const keys = Object.keys(shape).map((k) => (shape[k].isOptional() ? `${k}?` : k));
      return `object{${keys.join(', ')}}`;
    }
    default:
      return 'unknown';
  }
};

/** The outermost .describe() wins; without one, walk in for an inner note. */
const noteOf = (schema: z.ZodTypeAny): string | undefined => {
  let current: z.ZodTypeAny | undefined = schema;
  while (current) {
    if (current.description) return current.description;
    const def: { innerType?: z.ZodTypeAny; schema?: z.ZodTypeAny } = (
      current as z.ZodTypeAny & { _def: { innerType?: z.ZodTypeAny; schema?: z.ZodTypeAny } }
    )._def;
    current = def.innerType ?? def.schema;
  }
  return undefined;
};

export const describeInput = (schema: z.ZodObject<z.ZodRawShape>): InputField[] =>
  Object.entries(schema.shape).map(([name, field]) => {
    const note = noteOf(field);
    return {
      name,
      type: typeOf(field),
      required: !field.isOptional(),
      ...(note ? { note } : {}),
    };
  });
