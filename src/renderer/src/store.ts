import { create } from 'zustand';
import {
  TRIGGER_STYLES,
  findScript,
  findTranscript,
  findTriggerSet,
  paragraphsOf,
  type MajorTopic,
  type MinorTopic,
  type Paragraph,
  type Script,
  type ScriptSet,
  type Transcript,
  type TriggerStyle,
} from '@shared/domain';

/**
 * THE ZONE MODEL — requirements §1 and §2.
 *
 * The talent chooses which zones are on screen. The app has no fixed layout and
 * no default it defends, because "adding a mode the talent has to learn fails
 * the test; adding an arrangement they can choose does not."
 *
 * Two rules the zones must ALWAYS obey, and both are structural here rather
 * than something a component remembers to do:
 *
 *   1. **Zones stay aligned.** Everything on screen derives from ONE number —
 *      `step`, the index into the active trigger set. The paragraph, the minor
 *      topic and the major topic are all looked up from that trigger's authored
 *      paragraph id. There is no second cursor that could drift out of step. A
 *      zone that drifts is worse than a zone that is absent, because it is
 *      believed.
 *
 *   2. **One strong marker, ever.** The driven zone carries it; every follower
 *      gets the quiet one. Two equally-loud markers read as two competing
 *      claims about where you are (prior-art §5).
 */

/**
 * ⚠️ **TRIGGERS AS A ZONE — a stated assumption, not a ruling.**
 *
 * requirements §1 lists four zones: major topic · minor topic · paragraph ·
 * full transcript. **Triggers are not in that list** — yet the North Star says
 * "column 2 is the product" and §5 makes the three trigger styles the whole
 * experiment. Those two passages came from different conversations and were
 * never reconciled.
 *
 * Read literally, the zone model deletes the product. So triggers are modelled
 * here as a fifth zone and a member of the recording set. If that is wrong, the
 * fix is one line in `RECORDING_SET` — nothing else in this file assumes it.
 */
export const ZONES = ['major', 'minor', 'triggers', 'paragraph', 'transcript'] as const;
export type Zone = (typeof ZONES)[number];

/**
 * What you DRIVE while talking. The full transcript is deliberately not here:
 * it is a skim surface for finding your place, not something you read from
 * mid-take, so it arrives as a slide-out instead of a column.
 */
export const RECORDING_SET = ['major', 'minor', 'triggers', 'paragraph'] as const;
export type RecordingZone = (typeof RECORDING_SET)[number];

export const ZONE_LABEL: Record<Zone, string> = {
  major: 'Major',
  minor: 'Minor',
  triggers: 'Triggers',
  paragraph: 'Paragraph',
  transcript: 'Transcript',
};

/** Which edge the lens is on. Everything about layout bends to this (§2). */
export const CAMERA_SIDES = ['left', 'right'] as const;
export type CameraSide = (typeof CAMERA_SIDES)[number];

/** Three named presets — one decision before the take, never a ±stepper. */
export const TEXT_PRESETS = ['standard', 'large', 'stage'] as const;
export type TextPreset = (typeof TEXT_PRESETS)[number];

export interface CueCard {
  label: string;
  title: string;
  /** Changes on every cue so the component can restart its dismiss timer. */
  token: number;
}

interface PrompterState {
  /** Null until the control API answers. The UI shows a waiting state, not an error. */
  set: ScriptSet | null;
  scriptId: string | null;
  transcriptId: string | null;
  style: TriggerStyle | null;

  /** Index into the ACTIVE trigger set. THE position — everything derives from it. */
  step: number;

  visible: RecordingZone[];
  driven: RecordingZone;
  /**
   * Flex weight per zone, adjusted by dragging a divider. Relative, not pixels,
   * so the arrangement survives the window being resized or moved to the other
   * side of the lens.
   */
  weights: Record<RecordingZone, number>;
  camera: CameraSide;
  /** The full-transcript skim surface. Overlays; never displaces (see below). */
  transcriptOpen: boolean;
  transcriptEdge: CameraSide;

  mirror: boolean;
  focus: boolean;
  text: TextPreset;
  cue: CueCard | null;
  /** Increments each time a step was refused at the boundary, to replay the nudge. */
  nudge: number;

  load: (set: ScriptSet) => void;
  refresh: (set: ScriptSet) => void;
  stepNext: () => void;
  stepPrev: () => void;
  selectScript: (scriptId: string) => void;
  goToNextScript: () => void;
  selectTranscript: (transcriptId: string) => void;
  selectStyle: (style: TriggerStyle) => void;
  toggleZone: (zone: RecordingZone) => void;
  setDriven: (zone: RecordingZone) => void;
  setCamera: (side: CameraSide) => void;
  resizeZones: (left: RecordingZone, right: RecordingZone, deltaPx: number) => void;
  toggleTranscript: () => void;
  toggleMirror: () => void;
  toggleFocus: () => void;
  setText: (preset: TextPreset) => void;
  dismissCue: () => void;
}

/* ------------------------------------------------------------------ *
 * Selection helpers — pure, so the rules stay testable without a DOM
 * ------------------------------------------------------------------ */

/** A transcript with no authored trigger set cannot be stepped at all. */
const drivable = (t: Transcript): boolean => t.triggerSets.length > 0;

/**
 * Which transcript a script opens on.
 *
 * A cadence transcript is shaped for how this person actually speaks, so it is
 * the better choice — **but only if it can be driven.** The app never invents a
 * trigger, so a transcript nobody has authored triggers for opens as an empty
 * column 2, which is the product missing. Prefer cadence, then anything
 * drivable, and fall back to provenance rather than to a dead screen.
 *
 * ⚠️ Today that means the app opens on Tom's originals even for scripts 1–3,
 * because the re-cadenced versions ship with no trigger set. Authoring those is
 * session 3's job, not something this function should paper over.
 */
const defaultTranscript = (script: Script): Transcript | undefined =>
  script.transcripts.find((t) => t.kind === 'cadence' && drivable(t)) ??
  script.transcripts.find(drivable) ??
  script.transcripts.find((t) => t.kind === 'provenance') ??
  script.transcripts[0];

/** The first style this transcript actually has. The app never invents one. */
const defaultStyle = (transcript: Transcript | undefined): TriggerStyle | null => {
  if (!transcript) return null;
  for (const style of TRIGGER_STYLES) {
    if (findTriggerSet(transcript, style)) return style;
  }
  return null;
};

export const useProm = create<PrompterState>((set, get) => ({
  set: null,
  scriptId: null,
  transcriptId: null,
  style: null,
  step: 0,

  // An opening arrangement, not a default the app defends: the triggers plus
  // the paragraph they belong to. The talent changes it and it stays changed.
  visible: ['triggers', 'paragraph'],
  driven: 'triggers',
  weights: { major: 1, minor: 1, triggers: 2, paragraph: 2 },
  camera: 'right',
  transcriptOpen: false,
  transcriptEdge: 'left',

  mirror: false,
  focus: false,
  text: 'standard',
  cue: null,
  nudge: 0,

  load: (scriptSet) => {
    const script = scriptSet.scripts[0];
    const transcript = script ? defaultTranscript(script) : undefined;
    set({
      set: scriptSet,
      scriptId: script?.id ?? null,
      transcriptId: transcript?.id ?? null,
      style: defaultStyle(transcript),
      step: 0,
    });
  },

  /**
   * Swap in new data WITHOUT moving the talent.
   *
   * This fires when an agent writes through the control API — which is the
   * whole point of the app being drivable, and also the moment it could ruin a
   * take. Someone rewriting a trigger word must never yank the person on camera
   * to a different script, a different corpus, or a different beat.
   *
   * So every part of the selection is kept if it still exists, and only what
   * genuinely vanished falls back. The step is clamped rather than reset,
   * because a shortened trigger set is not a reason to send them back to the
   * top of the script.
   *
   * A cue card fires ONLY if the refresh actually moved them. A cue announces a
   * boundary the talent crossed; data changing underneath is not a crossing,
   * and a card flashing on every keystroke of an agent's edit would be noise.
   */
  refresh: (scriptSet) => {
    const state = get();
    if (!state.scriptId) {
      get().load(scriptSet);
      return;
    }

    const script = findScript(scriptSet, state.scriptId) ?? scriptSet.scripts[0];
    if (!script) {
      set({ set: scriptSet, scriptId: null, transcriptId: null, style: null, step: 0 });
      return;
    }

    const moved = script.id !== state.scriptId;
    const transcript =
      (state.transcriptId ? findTranscript(script, state.transcriptId) : undefined) ??
      defaultTranscript(script);
    const style =
      state.style && transcript && findTriggerSet(transcript, state.style)
        ? state.style
        : defaultStyle(transcript);

    const triggers = transcript && style ? (findTriggerSet(transcript, style)?.triggers ?? []) : [];
    const step = Math.min(state.step, Math.max(0, triggers.length - 1));

    set({
      set: scriptSet,
      scriptId: script.id,
      transcriptId: transcript?.id ?? null,
      style,
      step,
      cue: moved
        ? {
            label: String(script.n).padStart(2, '0'),
            title: script.title,
            token: (state.cue?.token ?? 0) + 1,
          }
        : state.cue,
    });
  },

  /**
   * ONE KEY MEANS ONE SCALE OF MOVEMENT — and **the driven zone sets the
   * scale.**
   *
   * Driving Paragraph, `↓` moves to the next paragraph. Driving Major, to the
   * next major topic. Driving Triggers, to the next trigger. It always lands on
   * the FIRST beat of the next unit, so stepping back into a paragraph puts you
   * at its start rather than its end.
   *
   * This is a bug David hit on the first real take (Captain's Log B437): he was
   * driving Paragraph and `↓` walked the trigger set, so it took five presses
   * to advance one paragraph. "The up and down arrow should work on whatever
   * the driver is." It also turned out to be the cleanest reading of the
   * prior-art rule rather than an exception to it.
   *
   * Stepping stays clamped INSIDE the script. Pressing past the last unit
   * nudges the end card; it can never silently roll into the next script. In
   * the original prompter it did, and David got lost mid-take —
   * docs/prior-art-kybernesis-prompter.md §3.
   */
  stepNext: () => {
    const state = get();
    const target = adjacentUnitStep(state, 1);
    if (target === null) {
      if (activeTriggers(state).length > 0) set({ nudge: state.nudge + 1 });
      return;
    }
    set({ step: target });
  },

  stepPrev: () => {
    const target = adjacentUnitStep(get(), -1);
    if (target !== null) set({ step: target });
  },

  /**
   * Every script change announces itself with a cue card — whatever triggered
   * it. Changing script also resets the step; there is no "resume where I was",
   * because a half-remembered position is worse than a known one.
   */
  selectScript: (scriptId) => {
    const state = get();
    if (!state.set) return;
    const script = findScript(state.set, scriptId);
    if (!script) return;
    const transcript = defaultTranscript(script);
    set({
      scriptId: script.id,
      transcriptId: transcript?.id ?? null,
      style: defaultStyle(transcript),
      step: 0,
      cue: {
        label: String(script.n).padStart(2, '0'),
        title: script.title,
        token: (state.cue?.token ?? 0) + 1,
      },
    });
  },

  goToNextScript: () => {
    const next = nextScript(get());
    if (next) get().selectScript(next.id);
  },

  /**
   * Switching corpus — provenance ↔ cadence — RESETS the beat, and says nothing.
   *
   * It carried a cue card until David used it: "the overlay kicking in just
   * means I can't see a visual change in the text, so that's a feature you've
   * added that doesn't help" (B437). He is right, and the rule was
   * over-applied. A cue announces a boundary the talent CROSSED; switching
   * corpus is an A/B comparison of the same content, and the card hides the
   * exact difference you flipped over to see. Style switching never had one and
   * he liked it: "very quick, nothing coming through."
   *
   * The beat still resets. A cadence transcript is a different document, not a
   * translation — v02 re-cadences four of Tom's paragraphs into three, so no
   * honest correspondence exists, and a wrong sync is worse than none.
   */
  selectTranscript: (transcriptId) => {
    const state = get();
    const script = currentScript(state);
    if (!script) return;
    const transcript = findTranscript(script, transcriptId);
    if (!transcript) return;
    set({
      transcriptId: transcript.id,
      style: defaultStyle(transcript),
      step: 0,
    });
  },

  /**
   * Switching trigger style KEEPS YOUR PLACE — and your place is the PARAGRAPH,
   * not the step index.
   *
   * requirements open item 3 asks whether switching mid-take keeps the beat. It
   * has one coherent answer: each style has its own step count over the same
   * paragraphs, so holding the index would drop you somewhere else in the
   * script — exactly the "losing your place" the question warns about. Holding
   * the paragraph is the only mapping that means anything.
   */
  selectStyle: (style) => {
    const state = get();
    const transcript = currentTranscript(state);
    if (!transcript) return;
    const target = findTriggerSet(transcript, style);
    if (!target) return;

    const paragraphId = currentParagraphId(state);
    const landing = target.triggers.findIndex((t) => t.paragraphId === paragraphId);
    set({ style, step: landing >= 0 ? landing : 0 });
  },

  /**
   * A zone the talent can see is a zone they can drive, and vice versa. Two
   * rules fall out, and both are enforced here rather than trusted to the UI:
   *
   *   · You cannot hide the last visible zone. An empty stage is not an
   *     arrangement, it is a broken app mid-take.
   *   · Hiding the DRIVEN zone moves the strong marker to a visible one.
   *     Driving something you cannot see is rule 1's alignment bug wearing a
   *     different hat.
   */
  toggleZone: (zone) => {
    const state = get();

    if (state.visible.includes(zone)) {
      if (state.visible.length === 1) return;
      const visible = state.visible.filter((z) => z !== zone);
      set({ visible, driven: state.driven === zone ? visible[0] : state.driven });
      return;
    }

    // Stored in canonical order so the arrangement is stable as zones come and
    // go. The camera rule reorders it for DISPLAY, never in storage.
    set({ visible: RECORDING_SET.filter((z) => z === zone || state.visible.includes(z)) });
  },

  /** You may only drive what is on screen. */
  setDriven: (zone) => {
    if (!get().visible.includes(zone)) return;
    set({ driven: zone });
  },

  setCamera: (side) =>
    set({
      camera: side,
      // The skim surface follows the lens: it opens from the FAR edge, so it
      // can never slide across the zone the talent is looking at.
      transcriptEdge: side === 'left' ? 'right' : 'left',
    }),

  /**
   * Move the seam between two adjacent zones. Weight moves from one to the
   * other so the total stays constant — the stage never grows or shrinks, only
   * the split between them.
   *
   * Clamped so neither side can be squeezed to nothing: a zone dragged to zero
   * width is a zone the talent has hidden by accident mid-take, and hiding is
   * what the zone toggles are for.
   */
  resizeZones: (left, right, deltaPx) => {
    const state = get();
    const step = deltaPx / 600;
    const a = state.weights[left] + step;
    const b = state.weights[right] - step;
    if (a < 0.35 || b < 0.35) return;
    set({ weights: { ...state.weights, [left]: a, [right]: b } });
  },

  toggleTranscript: () => set((s) => ({ transcriptOpen: !s.transcriptOpen })),
  toggleMirror: () => set((s) => ({ mirror: !s.mirror })),
  toggleFocus: () => set((s) => ({ focus: !s.focus })),
  setText: (preset) => set({ text: preset }),
  dismissCue: () => set({ cue: null }),
}));

/* ------------------------------------------------------------------ *
 * Derived selectors — every one reads from `step` alone
 * ------------------------------------------------------------------ */

export const currentScript = (s: PrompterState): Script | undefined =>
  s.set && s.scriptId ? findScript(s.set, s.scriptId) : undefined;

export const currentTranscript = (s: PrompterState): Transcript | undefined => {
  const script = currentScript(s);
  return script && s.transcriptId ? findTranscript(script, s.transcriptId) : undefined;
};

/**
 * ⚠️ Returns a STABLE reference when empty. A selector that builds a fresh `[]`
 * each call is never `Object.is`-equal to the last one, so a component
 * subscribing to it re-renders forever and React tears the tree down — a blank
 * window with nothing in the console to explain it.
 */
const NO_TRIGGERS: { text: string; paragraphId: string }[] = [];

export const activeTriggers = (s: PrompterState): { text: string; paragraphId: string }[] => {
  const transcript = currentTranscript(s);
  if (!transcript || !s.style) return NO_TRIGGERS;
  return findTriggerSet(transcript, s.style)?.triggers ?? NO_TRIGGERS;
};

/**
 * The one directional lookup: trigger → paragraph is exact, and it is read from
 * the authored map. It is never computed from position.
 */
export const currentParagraphId = (s: PrompterState): string | null =>
  activeTriggers(s)[s.step]?.paragraphId ?? null;

export const currentParagraph = (s: PrompterState): Paragraph | undefined => {
  const transcript = currentTranscript(s);
  const id = currentParagraphId(s);
  if (!transcript || !id) return undefined;
  return paragraphsOf(transcript).find((p) => p.id === id);
};

/**
 * The paragraph after the current one, for the peek beneath it. Undefined on
 * the last paragraph, so the zone shows nothing rather than an empty card.
 */
export const nextParagraph = (s: PrompterState): Paragraph | undefined => {
  const transcript = currentTranscript(s);
  const id = currentParagraphId(s);
  if (!transcript || !id) return undefined;
  const all = paragraphsOf(transcript);
  const index = all.findIndex((p) => p.id === id);
  return index < 0 ? undefined : all[index + 1];
};

/** The minor topic owning the current paragraph — derived, never tracked. */
export const currentMinor = (s: PrompterState): MinorTopic | undefined => {
  const transcript = currentTranscript(s);
  const id = currentParagraphId(s);
  if (!transcript || !id) return undefined;
  for (const major of transcript.topics)
    for (const minor of major.minors) if (minor.paragraphs.some((p) => p.id === id)) return minor;
  return undefined;
};

/** The major topic owning it. Same derivation, one level up. */
export const currentMajor = (s: PrompterState): MajorTopic | undefined => {
  const transcript = currentTranscript(s);
  const id = currentParagraphId(s);
  if (!transcript || !id) return undefined;
  return transcript.topics.find((major) =>
    major.minors.some((minor) => minor.paragraphs.some((p) => p.id === id)),
  );
};

/**
 * Paragraph id → the minor and major topic that own it. Built once per lookup
 * rather than tracked, so it cannot fall out of step with the transcript.
 */
const ownership = (transcript: Transcript): Map<string, { minor: string; major: string }> => {
  const map = new Map<string, { minor: string; major: string }>();
  for (const major of transcript.topics)
    for (const minor of major.minors)
      for (const paragraph of minor.paragraphs)
        map.set(paragraph.id, { minor: minor.id, major: major.id });
  return map;
};

/**
 * What counts as "the same place" at the scale the talent is driving.
 *
 * Driving Triggers, every beat is its own unit — so the index IS the key.
 * Driving anything coarser, several beats share a key and `↓` skips past all
 * of them at once.
 */
export const unitKeyAt = (s: PrompterState, index: number): string | null => {
  const triggers = activeTriggers(s);
  const trigger = triggers[index];
  if (!trigger) return null;
  if (s.driven === 'triggers') return `t:${index}`;

  const transcript = currentTranscript(s);
  if (!transcript) return null;
  const owner = ownership(transcript).get(trigger.paragraphId);
  if (s.driven === 'paragraph') return `p:${trigger.paragraphId}`;
  if (s.driven === 'minor') return owner ? `n:${owner.minor}` : `p:${trigger.paragraphId}`;
  return owner ? `m:${owner.major}` : `p:${trigger.paragraphId}`;
};

/**
 * The first beat of the next (or previous) unit, or null if there is none.
 * Returning the FIRST beat matters going backwards: stepping back into a
 * paragraph should put the talent at its start, not wherever they left it.
 */
const adjacentUnitStep = (s: PrompterState, direction: 1 | -1): number | null => {
  const triggers = activeTriggers(s);
  if (triggers.length === 0) return null;

  const here = unitKeyAt(s, s.step);
  for (let i = s.step + direction; i >= 0 && i < triggers.length; i += direction) {
    if (unitKeyAt(s, i) === here) continue;
    if (direction === 1) return i;
    // Walk back to where this unit began.
    const key = unitKeyAt(s, i);
    let first = i;
    while (first > 0 && unitKeyAt(s, first - 1) === key) first -= 1;
    return first;
  }
  return null;
};

/**
 * The end card goes live when there is nowhere further to step AT THE CURRENT
 * SCALE — being on the last paragraph is the end of the script even if the
 * trigger set has beats left inside it.
 */
export const isLastStep = (s: PrompterState): boolean => {
  const triggers = activeTriggers(s);
  if (triggers.length === 0) return true;
  return adjacentUnitStep(s, 1) === null;
};

export const nextScript = (s: PrompterState): Script | undefined => {
  if (!s.set || !s.scriptId) return undefined;
  const index = s.set.scripts.findIndex((script) => script.id === s.scriptId);
  return index < 0 ? undefined : s.set.scripts[index + 1];
};

/**
 * **Layout is subordinate to camera position** (requirements §2) — the one
 * constraint everything else in the UI bends to.
 *
 * The zone the talent is focused on must sit nearest the lens, because that is
 * what keeps their eyes on it. If the camera is on the left and the driven zone
 * renders on the right, the eyeline is wrong and the take looks wrong; no
 * amount of good typography fixes that.
 *
 * So the driven zone goes first when the lens is on the left and last when it
 * is on the right, and the followers keep their canonical order either way.
 */
export const zoneOrder = (s: PrompterState): RecordingZone[] => {
  const followers = RECORDING_SET.filter((z) => s.visible.includes(z) && z !== s.driven);
  if (!s.visible.includes(s.driven)) return [...followers];
  return s.camera === 'left' ? [s.driven, ...followers] : [...followers, s.driven];
};

export type Rank = 'driven' | 'follower';

/**
 * Exactly one zone is ever `driven`. This is the only place that decides it, so
 * "two competing claims about where you are" cannot be reintroduced by a
 * component making its own judgement.
 */
export const rankOf = (driven: RecordingZone, zone: Zone): Rank =>
  zone === driven ? 'driven' : 'follower';
