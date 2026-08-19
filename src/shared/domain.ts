/**
 * THE DOMAIN — the shapes Teletubby actually deals in.
 *
 * This file is a contract, not an artifact of a generator. `scripts.ts` carries
 * types too, but those were whatever one build script happened to emit; three
 * things were wrong with them and each one blocks a later session:
 *
 *   1. There was ONE heading level. Requirements §1 needs a major topic AND a
 *      minor topic, because the zone model selects between them.
 *   2. The trigger→paragraph map sat on the SCRIPT. With three trigger styles
 *      per transcript, each style has its own step count and therefore its own
 *      map. The map belongs to the trigger set (requirements §5).
 *   3. Corpus was not modelled at all. Tom's originals and the re-cadenced
 *      rewrites are different corpora of the same script and both must be
 *      loadable and switchable (requirements open item 9).
 *
 * Talent is first-class for the reason requirements §7 and §9 give: the cadence
 * envelope is a MEASUREMENT OF ONE PERSON and must never be ported between
 * talents. Modelling it as a global constant is how that rule gets broken.
 *
 * Nothing here imports Electron, node:fs, or a transport. The core, the tests,
 * the build script and every adapter share these shapes.
 */

import { z } from '@appydave/core';

/* ------------------------------------------------------------------ *
 * Identity
 * ------------------------------------------------------------------ */

/**
 * Ids are strings, stable, and human-legible (`kybernesis-phase-1/01`).
 *
 * They are stable because the map is id-based. An index-based map is silently
 * wrong the moment an agent inserts a paragraph — and `write_transcript` is a
 * published verb, so that is not a hypothetical.
 */
export type SetId = string;
export type ScriptId = string;
export type TranscriptId = string;
export type TopicId = string;
export type ParagraphId = string;
export type TriggerId = string;
export type TalentId = string;

const id = (label: string): z.ZodString =>
  z
    .string()
    .min(1, `${label} must not be empty`)
    .regex(/^[a-z0-9][a-z0-9\-/.]*$/i, `${label} must be a slug (a-z 0-9 - / .)`);

/* ------------------------------------------------------------------ *
 * Transcripts — provenance vs cadence
 * ------------------------------------------------------------------ */

/**
 * The North Star rule, as a type: **meaning belongs to provenance, voice
 * belongs to the talent.**
 *
 * - `provenance` — the original, as written by whoever originated it. Never
 *   edited. It is the approval baseline.
 * - `cadence`    — the same meaning re-voiced into how a specific talent
 *   actually speaks. Always carries a `talentId`; a cadence transcript with no
 *   talent is meaningless, because cadence is measured per person.
 */
export const TRANSCRIPT_KINDS = ['provenance', 'cadence'] as const;
export type TranscriptKind = (typeof TRANSCRIPT_KINDS)[number];

/* ------------------------------------------------------------------ *
 * Trigger styles — A / B / C
 * ------------------------------------------------------------------ */

/**
 * Requirements §5. All three are valid, all three get authored, and which one
 * is on screen is the talent's choice per scenario.
 *
 * The app NEVER derives these. It exposes the surface and switches between what
 * it has been given — the authoring is done by an agent through
 * `write_trigger_set`. That is the whole reason the control API exists.
 */
export const TRIGGER_STYLES = ['near-verbatim', 'compressed-concept', 'loose-keywords'] as const;
export type TriggerStyle = (typeof TRIGGER_STYLES)[number];

/** The A/B/C shorthand the requirements table uses, kept out of the data. */
export const TRIGGER_STYLE_LETTER: Record<TriggerStyle, 'A' | 'B' | 'C'> = {
  'near-verbatim': 'A',
  'compressed-concept': 'B',
  'loose-keywords': 'C',
};

/** Who put these words there. `hand` is the only honest answer today. */
export const AUTHORSHIPS = ['hand', 'agent'] as const;
export type Authorship = (typeof AUTHORSHIPS)[number];

/* ------------------------------------------------------------------ *
 * The tree
 * ------------------------------------------------------------------ */

export interface Paragraph {
  id: ParagraphId;
  /** Verbatim. For a provenance transcript this is never rewritten. */
  text: string;
}

/** Zone 2 in requirements §1 — the sub-point under the heading. */
export interface MinorTopic {
  id: TopicId;
  heading: string;
  paragraphs: Paragraph[];
}

/** Zone 1 in requirements §1 — where you are in the script. */
export interface MajorTopic {
  id: TopicId;
  heading: string;
  minors: MinorTopic[];
}

/**
 * One trigger — a single step in column 2, bound to the paragraph it belongs to.
 *
 * `paragraphId` IS the map. It is authored data and is never derived
 * positionally (prior-art §5: proportional mapping was considered and rejected;
 * a wrong sync is worse than none). Holding it per-trigger rather than as a
 * parallel `number[]` removes the whole class of length-mismatch bug the old
 * shape needed three build-time assertions to catch.
 */
export interface Trigger {
  id: TriggerId;
  text: string;
  paragraphId: ParagraphId;
}

export interface TriggerSet {
  style: TriggerStyle;
  authoredBy: Authorship;
  /** Free text — where these came from, so a bad set can be traced and dropped. */
  note?: string;
  triggers: Trigger[];
}

export interface Transcript {
  id: TranscriptId;
  kind: TranscriptKind;
  /**
   * Which body of text this is a member of — `tom-original`, `v0N-rewrite`.
   * Two corpora of the same script are different experiments (requirements
   * open item 9); carrying both is what makes the trigger-style experiment
   * one two-axis experiment instead of two sequential ones.
   */
  corpus: string;
  /** Required on `cadence`, forbidden on `provenance`. Enforced below. */
  talentId: TalentId | null;
  /** Where the text physically came from, for provenance auditing. */
  source: string;
  topics: MajorTopic[];
  triggerSets: TriggerSet[];
}

export interface Script {
  id: ScriptId;
  /** Position in the set, 1-based. Display only — `id` is the identity. */
  n: number;
  title: string;
  /** The originator's approved takeaway. The landing line is held to this. */
  takeaway: string;
  /** Requirements §6 — a set of twelve has to be scannable in one sitting. */
  summary: string;
  transcripts: Transcript[];
}

/**
 * The unit the talent is handed (requirements §6: "the set is the unit, not the
 * individual script").
 */
export interface ScriptSet {
  id: SetId;
  title: string;
  description: string;
  scripts: Script[];
}

/* ------------------------------------------------------------------ *
 * Talent and the cadence envelope
 * ------------------------------------------------------------------ */

/**
 * The eight deterministic threshold rules from
 * `~/dev/ad/brains/kybernesis/phase-1-scripts/score.py`.
 *
 * ⚠️ These numbers belong to ONE PERSON. David's envelope came from 318
 * punctuated transcripts / ~229k words of his own published video. Applying it
 * to Alex makes the gate meaningless (requirements §9, brief §3). That is why
 * the thresholds live on `Talent` and not in a constants file.
 */
export interface CadenceEnvelope {
  wordsMin: number;
  wordsMax: number;
  /** Mean words per breath group. David ≈ 11.5; Tom writes ≈ 7. */
  breathGroupMeanMin: number;
  /** Internal punctuation breaks per 100 words. */
  breaksPer100Max: number;
  /** Sentence-length standard deviation — flat rhythm reads as written. */
  sentenceSdMin: number;
  /** Em-dash appositives. Zero, for this talent. */
  emDashMax: number;
  /** Words that do not belong in this talent's voice, as regex-safe literals. */
  antiVoice: string[];
  /** Channel bookends that must not appear inside a script body. */
  bookends: string[];
  /** Where these numbers were measured. Never guess this field. */
  source: string;
}

export interface Talent {
  id: TalentId;
  name: string;
  envelope: CadenceEnvelope;
}

/* ------------------------------------------------------------------ *
 * Zod schemas — the same shapes, enforced at every write
 * ------------------------------------------------------------------ */

export const paragraphSchema: z.ZodType<Paragraph> = z.object({
  id: id('paragraph id'),
  text: z.string().trim().min(1, 'paragraph text must not be empty'),
});

export const minorTopicSchema: z.ZodType<MinorTopic> = z.object({
  id: id('minor topic id'),
  heading: z.string().trim().min(1, 'minor topic heading must not be empty'),
  paragraphs: z.array(paragraphSchema).min(1, 'a minor topic needs at least one paragraph'),
});

export const majorTopicSchema: z.ZodType<MajorTopic> = z.object({
  id: id('major topic id'),
  heading: z.string().trim().min(1, 'major topic heading must not be empty'),
  minors: z.array(minorTopicSchema).min(1, 'a major topic needs at least one minor topic'),
});

export const triggerSchema: z.ZodType<Trigger> = z.object({
  id: id('trigger id'),
  text: z.string().trim().min(1, 'trigger text must not be empty'),
  paragraphId: id('paragraph id'),
});

export const triggerSetSchema: z.ZodType<TriggerSet> = z.object({
  style: z.enum(TRIGGER_STYLES),
  authoredBy: z.enum(AUTHORSHIPS),
  note: z.string().optional(),
  triggers: z.array(triggerSchema).min(2, 'a trigger set needs at least two steps'),
});

export const transcriptSchema: z.ZodType<Transcript> = z.object({
  id: id('transcript id'),
  kind: z.enum(TRANSCRIPT_KINDS),
  corpus: id('corpus'),
  talentId: id('talent id').nullable(),
  source: z.string().trim().min(1, 'transcript source must not be empty'),
  topics: z.array(majorTopicSchema).min(1, 'a transcript needs at least one major topic'),
  triggerSets: z.array(triggerSetSchema),
});

export const scriptSchema: z.ZodType<Script> = z.object({
  id: id('script id'),
  n: z.number().int().positive(),
  title: z.string().trim().min(1, 'script title must not be empty'),
  takeaway: z.string().trim().min(1, 'script takeaway must not be empty'),
  summary: z.string().trim().min(1, 'script summary must not be empty'),
  transcripts: z.array(transcriptSchema),
});

export const scriptSetSchema: z.ZodType<ScriptSet> = z.object({
  id: id('set id'),
  title: z.string().trim().min(1, 'set title must not be empty'),
  description: z.string().trim(),
  scripts: z.array(scriptSchema),
});

export const cadenceEnvelopeSchema: z.ZodType<CadenceEnvelope> = z.object({
  wordsMin: z.number().int().nonnegative(),
  wordsMax: z.number().int().positive(),
  breathGroupMeanMin: z.number().nonnegative(),
  breaksPer100Max: z.number().nonnegative(),
  sentenceSdMin: z.number().nonnegative(),
  emDashMax: z.number().int().nonnegative(),
  antiVoice: z.array(z.string().min(1)),
  bookends: z.array(z.string().min(1)),
  source: z.string().trim().min(1, 'an envelope must record where it was measured'),
});

export const talentSchema: z.ZodType<Talent> = z.object({
  id: id('talent id'),
  name: z.string().trim().min(1, 'talent name must not be empty'),
  envelope: cadenceEnvelopeSchema,
});

/* ------------------------------------------------------------------ *
 * Structural rules a schema cannot express
 * ------------------------------------------------------------------ */

/** A validation problem, phrased so an agent can act on it. */
export interface DomainViolation {
  path: string;
  message: string;
}

/** Every paragraph in a transcript, in document order. */
export function paragraphsOf(transcript: Transcript): Paragraph[] {
  return transcript.topics.flatMap((major) => major.minors.flatMap((minor) => minor.paragraphs));
}

/** Paragraph id → its position in document order, 0-based. */
export function paragraphOrder(transcript: Transcript): Map<ParagraphId, number> {
  const order = new Map<ParagraphId, number>();
  paragraphsOf(transcript).forEach((paragraph, index) => order.set(paragraph.id, index));
  return order;
}

/**
 * The invariants the old build script asserted, restated against the new shape
 * — plus the two the old shape could not express (unique ids, and a map that
 * belongs to its own trigger set).
 *
 * Every rule here is a bug that already happened once. See
 * `docs/prior-art-kybernesis-prompter.md` §5 and `test/scripts-data.test.ts`.
 */
export function validateTranscript(transcript: Transcript, at = 'transcript'): DomainViolation[] {
  const violations: DomainViolation[] = [];
  const push = (path: string, message: string): void => void violations.push({ path, message });

  if (transcript.kind === 'cadence' && !transcript.talentId)
    push(`${at}.talentId`, 'a cadence transcript must name the talent it was voiced for');
  if (transcript.kind === 'provenance' && transcript.talentId)
    push(`${at}.talentId`, 'a provenance transcript belongs to no talent — meaning is not voiced');

  const paragraphs = paragraphsOf(transcript);
  if (paragraphs.length === 0) push(`${at}.topics`, 'a transcript needs at least one paragraph');

  const seen = new Set<string>();
  for (const paragraph of paragraphs) {
    if (seen.has(paragraph.id))
      push(`${at}.paragraphs`, `duplicate paragraph id "${paragraph.id}"`);
    seen.add(paragraph.id);
  }

  const topicIds = new Set<string>();
  for (const major of transcript.topics) {
    if (topicIds.has(major.id)) push(`${at}.topics`, `duplicate topic id "${major.id}"`);
    topicIds.add(major.id);
    for (const minor of major.minors) {
      if (topicIds.has(minor.id)) push(`${at}.topics`, `duplicate topic id "${minor.id}"`);
      topicIds.add(minor.id);
    }
  }

  const styles = new Set<TriggerStyle>();
  for (const set of transcript.triggerSets) {
    if (styles.has(set.style))
      push(`${at}.triggerSets`, `two trigger sets share the style "${set.style}"`);
    styles.add(set.style);
    violations.push(...validateTriggerSet(set, transcript, `${at}.triggerSets[${set.style}]`));
  }

  return violations;
}

/**
 * The map rules, now scoped to one trigger set — which is the correction gap 1
 * asked for. Style A may take fourteen steps over the same four paragraphs that
 * style C crosses in three; neither is wrong, and the old script-level `map`
 * could not represent it.
 */
export function validateTriggerSet(
  set: TriggerSet,
  transcript: Transcript,
  at = 'triggerSet',
): DomainViolation[] {
  const violations: DomainViolation[] = [];
  const push = (path: string, message: string): void => void violations.push({ path, message });

  const order = paragraphOrder(transcript);
  const last = order.size - 1;

  const triggerIds = new Set<string>();
  let previous = -1;

  set.triggers.forEach((trigger, index) => {
    if (triggerIds.has(trigger.id)) push(`${at}.triggers`, `duplicate trigger id "${trigger.id}"`);
    triggerIds.add(trigger.id);

    const position = order.get(trigger.paragraphId);
    if (position === undefined) {
      push(
        `${at}.triggers[${index}]`,
        `maps to paragraph "${trigger.paragraphId}", which is not in this transcript`,
      );
      return;
    }
    // The transcript may dwell on a paragraph; it may never rewind. A backwards
    // map means the follower column jumps upward while the talent moves down.
    if (position < previous)
      push(`${at}.triggers[${index}]`, 'the map goes backwards — it must be non-decreasing');
    previous = Math.max(previous, position);
  });

  if (set.triggers.length > 0) {
    const first = order.get(set.triggers[0].paragraphId);
    const final = order.get(set.triggers[set.triggers.length - 1].paragraphId);
    // The map has to span the script: the first beat opens it, the last closes
    // it. Otherwise a paragraph is unreachable by stepping and the talent finds
    // that out mid-take.
    if (first !== undefined && first !== 0)
      push(`${at}.triggers[0]`, 'the first trigger must open on the first paragraph');
    if (final !== undefined && final !== last)
      push(
        `${at}.triggers[${set.triggers.length - 1}]`,
        'the last trigger must land on the last paragraph',
      );
  }

  return violations;
}

export function validateScript(script: Script, at = 'script'): DomainViolation[] {
  const violations: DomainViolation[] = [];
  const ids = new Set<string>();
  const provenance = script.transcripts.filter((t) => t.kind === 'provenance');

  if (provenance.length > 1)
    violations.push({
      path: `${at}.transcripts`,
      // Provenance is the approval baseline. Two of them means nobody can say
      // which one the originator approved.
      message: 'a script has at most one provenance transcript',
    });

  for (const transcript of script.transcripts) {
    if (ids.has(transcript.id))
      violations.push({
        path: `${at}.transcripts`,
        message: `duplicate transcript id "${transcript.id}"`,
      });
    ids.add(transcript.id);
    violations.push(...validateTranscript(transcript, `${at}.transcripts[${transcript.id}]`));
  }
  return violations;
}

export function validateScriptSet(set: ScriptSet): DomainViolation[] {
  const violations: DomainViolation[] = [];
  const ids = new Set<string>();
  for (const script of set.scripts) {
    if (ids.has(script.id))
      violations.push({
        path: `${set.id}.scripts`,
        message: `duplicate script id "${script.id}"`,
      });
    ids.add(script.id);
    violations.push(...validateScript(script, `${set.id}.scripts[${script.id}]`));
  }
  return violations;
}

/* ------------------------------------------------------------------ *
 * Lookups — small, shared, and used by every adapter
 * ------------------------------------------------------------------ */

export function findScript(set: ScriptSet, scriptId: ScriptId): Script | undefined {
  return set.scripts.find((script) => script.id === scriptId);
}

export function findTranscript(script: Script, transcriptId: TranscriptId): Transcript | undefined {
  return script.transcripts.find((transcript) => transcript.id === transcriptId);
}

export function findTriggerSet(
  transcript: Transcript,
  style: TriggerStyle,
): TriggerSet | undefined {
  return transcript.triggerSets.find((set) => set.style === style);
}

/** The provenance transcript, which is the approval baseline for the script. */
export function provenanceOf(script: Script): Transcript | undefined {
  return script.transcripts.find((transcript) => transcript.kind === 'provenance');
}

/** Every cadence transcript voiced for one talent. */
export function cadenceFor(script: Script, talentId: TalentId): Transcript[] {
  return script.transcripts.filter((t) => t.kind === 'cadence' && t.talentId === talentId);
}

/** The whole transcript as plain text — what the cadence gate scores. */
export function transcriptText(transcript: Transcript): string {
  return paragraphsOf(transcript)
    .map((paragraph) => paragraph.text)
    .join('\n');
}
