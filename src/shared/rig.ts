/**
 * THE RIG — a named layout the talent can pick before a take.
 *
 * The problem it solves is small and real: every launch reset the arrangement,
 * so David re-set four controls (zones · driving zone · camera · text) before
 * every single session. A prompter that makes you configure it before you can
 * talk fails the North Star test on its own terms — that is time spent on the
 * screen, not on the lens.
 *
 * Two things live here, and they are deliberately different:
 *
 *   · **A Rig** — a NAMED arrangement, chosen deliberately. "stage-left".
 *   · **The workspace** — the layout you were LAST looking at, restored on
 *     launch whether or not you ever named anything. Most people never need
 *     a second rig; nobody should have to name one to stop re-configuring.
 *
 * ⚠️ **A rig carries layout ONLY — never script, corpus or trigger style.**
 * Those are the axes of the A/B/C experiment and the talent flips them *during*
 * a session. Baking them into a rig would mean picking a rig silently moves the
 * person on camera to a different corpus, which is the exact failure the
 * refresh rule exists to prevent ("a refresh must never move the talent") and
 * which prior-art rule 2 already ruled out for corpus switching. A rig changes
 * how the words are arranged; it never changes which words they are.
 *
 * This file is imported by the renderer, so — like `domain.ts` — it stays
 * dependency-free. The Zod schemas live in `domain-schema.ts`, next to the
 * writes they guard.
 */

import type { DomainViolation, TriggerStyle } from './domain.js';

export type RigId = string;

/* ------------------------------------------------------------------ *
 * The vocabulary of an arrangement
 * ------------------------------------------------------------------ */

/**
 * What you can DRIVE while talking. The full transcript is deliberately absent:
 * it is a skim surface for finding your place, not something you read from
 * mid-take, so it arrives as a slide-out rather than a column.
 *
 * These three lists used to live in the renderer store. They moved here the
 * moment a rig became data the core validates — a vocabulary the main process
 * has to enforce cannot be defined in the window.
 */
export const RECORDING_SET = ['major', 'minor', 'triggers', 'paragraph'] as const;
export type RecordingZone = (typeof RECORDING_SET)[number];

/** Which edge the lens is on. Everything about layout bends to this (§2). */
export const CAMERA_SIDES = ['left', 'right'] as const;
export type CameraSide = (typeof CAMERA_SIDES)[number];

/** Three named presets — one decision before the take, never a ±stepper (§6). */
export const TEXT_PRESETS = ['standard', 'large', 'stage'] as const;
export type TextPreset = (typeof TEXT_PRESETS)[number];

/**
 * A zone dragged below this share is a zone the talent hid by accident
 * mid-take. Hiding is what the zone toggles are for, so the divider clamps
 * here and a rig may not encode anything the divider would have refused.
 */
export const MIN_ZONE_WEIGHT = 0.35;

/* ------------------------------------------------------------------ *
 * The shapes
 * ------------------------------------------------------------------ */

export interface RigLayout {
  /** Which zones are on screen, in canonical order. Never empty. */
  visible: RecordingZone[];
  /** Which one the arrow keys move, and which one carries the strong marker. */
  driven: RecordingZone;
  /** Relative flex weight per zone — proportions, so they survive a resize. */
  weights: Record<RecordingZone, number>;
  camera: CameraSide;
  text: TextPreset;
  /** Prompter glass. A property of the physical rig, which is why it is here. */
  mirror: boolean;
  focus: boolean;
}

export interface Rig {
  id: RigId;
  /**
   * The human name, and the ONE field that changes on its own. David: "whatever
   * I come up with first off won't necessarily be what I want later on." The id
   * is the stable handle so a rename never orphans the workspace pointer.
   */
  label: string;
  layout: RigLayout;
}

/**
 * What the talent had on screen when they last touched it.
 *
 * `rigId` is the rig the layout was applied FROM, kept even after the talent
 * tweaks it — the UI compares the live layout against that rig to decide
 * whether the chip reads as clean or modified. Storing a "dirty" flag instead
 * would be a second source of truth for something derivable in one comparison.
 */
/**
 * Where the talent WAS — script, corpus, style, and the paragraph in front of
 * them — so a reload puts the same words back in front of them.
 *
 * This deliberately reverses the original ruling that the workspace restores
 * the layout and never the beat ("a prompter that reopens mid-script has
 * decided where you are"). That ruling was written for reopening the app the
 * next day. On 2026-08-31 David was recording seven videos while the app was
 * being fixed under him, and every dev reload threw away his place: "you keep
 * making changes and breaking my flow… it'd be even nicer if it could come to
 * the paragraph you were looking at." Coming back where you left it IS the rig
 * philosophy — the beat is only a faster-moving part of "how you left it".
 *
 * The paragraph is stored by ID, not step index: step counts differ per
 * trigger style, and the paragraph is the unit the talent thinks in.
 */
export interface WorkspacePosition {
  setId: string | null;
  scriptId: string | null;
  transcriptId: string | null;
  style: TriggerStyle | null;
  paragraphId: string | null;
}

export interface Workspace {
  layout: RigLayout | null;
  rigId: RigId | null;
  /** Absent in stores written before 2026-08-31; treat as null. */
  position?: WorkspacePosition | null;
}

export const EMPTY_WORKSPACE: Workspace = { layout: null, rigId: null, position: null };

/**
 * The opening arrangement — the triggers plus the paragraph they belong to.
 *
 * Not a default the app defends: it is what you get the first time and nothing
 * else. From the second launch onwards the workspace supplies it, which is the
 * entire point of this file.
 */
export const DEFAULT_LAYOUT: RigLayout = {
  visible: ['triggers', 'paragraph'],
  driven: 'triggers',
  weights: { major: 1, minor: 1, triggers: 2, paragraph: 2 },
  camera: 'right',
  text: 'standard',
  mirror: false,
  focus: false,
};

/* ------------------------------------------------------------------ *
 * Rules
 * ------------------------------------------------------------------ */

/** Structured clone — a caller must not be handed a layout it can mutate. */
export const cloneLayout = (layout: RigLayout): RigLayout => ({
  ...layout,
  visible: [...layout.visible],
  weights: { ...layout.weights },
});

/** Canonical order, so an arrangement is stable as zones come and go. */
export const canonicalZones = (zones: readonly RecordingZone[]): RecordingZone[] =>
  RECORDING_SET.filter((zone) => zones.includes(zone));

export function validateRigLayout(layout: RigLayout, at = 'layout'): DomainViolation[] {
  const violations: DomainViolation[] = [];
  const push = (path: string, message: string): void => void violations.push({ path, message });

  if (layout.visible.length === 0)
    // An empty stage is not an arrangement, it is a broken app mid-take.
    push(`${at}.visible`, 'a rig must show at least one zone');

  const seen = new Set<RecordingZone>();
  for (const zone of layout.visible) {
    if (seen.has(zone)) push(`${at}.visible`, `duplicate zone "${zone}"`);
    seen.add(zone);
  }

  // THE load-bearing rule. Driving a zone you cannot see puts the strong marker
  // off screen and leaves the arrow keys moving something invisible — the
  // alignment bug of rule 1 wearing a different hat. The UI already refuses it
  // interactively; a rig is a way to arrive at the same state without clicking,
  // so the rule has to live where the rig is written, not only in the store.
  if (!layout.visible.includes(layout.driven))
    push(`${at}.driven`, `cannot drive "${layout.driven}" — it is not among the visible zones`);

  for (const zone of RECORDING_SET) {
    const weight = layout.weights[zone];
    if (typeof weight !== 'number' || !Number.isFinite(weight))
      push(`${at}.weights.${zone}`, 'every zone needs a finite weight');
    else if (weight < MIN_ZONE_WEIGHT)
      push(
        `${at}.weights.${zone}`,
        `weight ${weight} is below the ${MIN_ZONE_WEIGHT} the divider clamps at`,
      );
  }

  return violations;
}

export function validateRig(rig: Rig, at = 'rig'): DomainViolation[] {
  const violations: DomainViolation[] = [];
  if (rig.label.trim().length === 0)
    // An unnamed rig is unpickable — the chip is the whole interface.
    violations.push({ path: `${at}.label`, message: 'a rig needs a name to be pickable' });
  violations.push(...validateRigLayout(rig.layout, `${at}.layout`));
  return violations;
}

/**
 * Whether two layouts arrange the screen the same way.
 *
 * Weights are floats produced by pixel drags, so they compare with a tolerance;
 * an exact `===` would report every rig as modified the moment a divider moved
 * by a sub-pixel and never reported clean again.
 */
export function sameLayout(a: RigLayout, b: RigLayout): boolean {
  if (a.driven !== b.driven) return false;
  if (a.camera !== b.camera) return false;
  if (a.text !== b.text) return false;
  if (a.mirror !== b.mirror) return false;
  if (a.focus !== b.focus) return false;

  const left = canonicalZones(a.visible);
  const right = canonicalZones(b.visible);
  if (left.length !== right.length) return false;
  if (left.some((zone, i) => zone !== right[i])) return false;

  return RECORDING_SET.every((zone) => Math.abs(a.weights[zone] - b.weights[zone]) < 1e-6);
}

export const findRig = (rigs: readonly Rig[], rigId: RigId): Rig | undefined =>
  rigs.find((rig) => rig.id === rigId);
