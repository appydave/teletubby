/**
 * THE DOMAIN SCHEMAS — the same shapes, enforced at every write.
 *
 * Split out of `domain.ts` because the renderer imports the domain and must not
 * pull in a validation library: `@appydave/core` reaches `node:fs`, which has no
 * browser equivalent and breaks the renderer bundle outright.
 *
 * That split is also the honest one. Validation belongs where writes happen —
 * the capability core in the main process — and the renderer only ever READS
 * the model. If the renderer ever needs to validate, that is a sign a capability
 * is missing, not that this file should move.
 */

import { z } from '@appydave/core';
import type {
  CadenceEnvelope,
  MajorTopic,
  MinorTopic,
  Paragraph,
  Script,
  ScriptSet,
  Talent,
  Transcript,
  Trigger,
  TriggerSet,
} from './domain.js';
import {
  AUTHORSHIPS,
  PROJECT_NAME_MAX,
  PROJECT_NAME_PATTERN,
  TRANSCRIPT_KINDS,
  TRIGGER_STYLES,
} from './domain.js';
import type { Rig, RigLayout, Workspace } from './rig.js';
import { CAMERA_SIDES, RECORDING_SET, TEXT_PRESETS } from './rig.js';

const id = (label: string): z.ZodString =>
  z
    .string()
    .min(1, `${label} must not be empty`)
    .regex(/^[a-z0-9][a-z0-9\-/.]*$/i, `${label} must be a slug (a-z 0-9 - / .)`);

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
  // The FliHub folder name, verbatim — kebab only, per FliHub's own rule.
  // `.nullish()` because stored documents predate the field.
  project: z
    .string()
    .regex(PROJECT_NAME_PATTERN, 'project must be a FliHub folder name (kebab-case)')
    .max(PROJECT_NAME_MAX, `project must be at most ${PROJECT_NAME_MAX} characters`)
    .nullish(),
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
 * Rigs — the arrangement, validated where it is written
 * ------------------------------------------------------------------ */

export const rigLayoutSchema: z.ZodType<RigLayout> = z.object({
  visible: z.array(z.enum(RECORDING_SET)).min(1, 'a rig must show at least one zone'),
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

export const rigSchema: z.ZodType<Rig> = z.object({
  id: id('rig id'),
  label: z.string().trim().min(1, 'a rig needs a name to be pickable'),
  layout: rigLayoutSchema,
});

export const workspaceSchema: z.ZodType<Workspace> = z.object({
  layout: rigLayoutSchema.nullable(),
  rigId: id('rig id').nullable(),
  // Optional, not nullable-only: stores written before 2026-08-31 lack the key.
  position: z
    .object({
      setId: z.string().nullable(),
      scriptId: z.string().nullable(),
      transcriptId: z.string().nullable(),
      style: z.enum(TRIGGER_STYLES).nullable(),
      paragraphId: z.string().nullable(),
    })
    .nullish(),
});
