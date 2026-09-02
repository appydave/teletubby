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
import {
  CAMERA_SIDES,
  DEFAULT_LAYOUT,
  RECORDING_SET,
  TEXT_PRESETS,
  canonicalZones,
  cloneLayout,
  findRig,
  sameLayout,
  validateRigLayout,
  type CameraSide,
  type Rig,
  type RigLayout,
  type RecordingZone,
  type TextPreset,
  type Workspace,
  type WorkspacePosition,
} from '@shared/rig';

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
 * The recording set, the camera sides and the text presets are DOMAIN
 * vocabulary now, not the store's — a rig is data the main process validates,
 * and a vocabulary the core has to enforce cannot be defined in the window.
 * Re-exported here so every existing caller keeps its single import.
 */
export {
  CAMERA_SIDES,
  RECORDING_SET,
  TEXT_PRESETS,
  type CameraSide,
  type RecordingZone,
  type TextPreset,
};

export const ZONE_LABEL: Record<Zone, string> = {
  major: 'Major',
  minor: 'Minor',
  triggers: 'Triggers',
  paragraph: 'Paragraph',
  transcript: 'Transcript',
};

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

  /**
   * The setup panel — everything that BUILDS an arrangement, in one slide-out.
   *
   * It is NOT part of a rig and it is NOT remembered. A rig is what the stage
   * looks like; whether a config drawer happened to be open when you quit is
   * not, and reopening on it would put a panel between the talent and their
   * first take.
   *
   * It also DISPLACES rather than overlays — the opposite of the transcript
   * drawer, and deliberately. The transcript is a skim surface you glance at
   * mid-take, so it must not shove the driven zone away from the lens. The
   * setup panel is used BETWEEN takes, and the whole point of it is watching
   * the stage respond as you change values — which you cannot do through a
   * panel sitting on top of the stage.
   */
  setupOpen: boolean;

  mirror: boolean;
  focus: boolean;
  text: TextPreset;

  /**
   * Named arrangements, and the one currently applied.
   *
   * `rigId` survives the talent tweaking the layout afterwards — the chip reads
   * as *modified* rather than deselecting itself, because a chip that goes dark
   * the moment you nudge a divider tells you you have left your rig when you
   * have not.
   */
  rigs: Rig[];
  rigId: string | null;
  /**
   * Whether the stored workspace has actually been read.
   *
   * Load-bearing: the app writes the live layout back on every change, so if a
   * failed `list_rigs` let it start writing anyway, one transient error would
   * overwrite the talent's saved arrangement with the built-in default. Nothing
   * is remembered until something has been recalled.
   */
  rigsLoaded: boolean;
  /**
   * Whether a stored arrangement was actually applied — as opposed to the app
   * falling back to the opening one. Drives whether the tuning controls start
   * open: on a machine that has never run this, the talent has a layout to set
   * up; on every launch after that, they have one already.
   */
  restoredLayout: boolean;
  /**
   * The saved position, held between `loadRigs` (which recalls it) and `load`
   * (which resolves it against the data once the set arrives). Ids are resolved
   * at restore time because the data may have changed since they were written —
   * a paragraph that vanished lands the talent at the END, visibly, never
   * silently at the top (docs/kdd: absence must not render as something else).
   */
  pendingPosition: WorkspacePosition | null;
  /**
   * Transcripts that arrived or changed since the talent last looked at them —
   * scriptId → transcriptIds. David sat on TOM-ORIGINAL for the best part of
   * an hour believing v07-rewrite had not arrived while it sat one click away
   * as a grey chip identical to every other grey chip ("I can't record because
   * you can't get the damn transcripts where I need them", 2026-08-31). The
   * data reached the window; the FACT OF ARRIVAL never reached the talent.
   * Absence and arrival must not look alike — third instance of the family.
   * Marks clear when the transcript is selected. Session state, not persisted.
   */
  freshTranscripts: Record<string, string[]>;

  cue: CueCard | null;
  /** Increments each time a step was refused at the boundary, to replay the nudge. */
  nudge: number;

  load: (set: ScriptSet) => void;
  refresh: (set: ScriptSet) => void;
  stepNext: () => void;
  stepPrev: () => void;
  selectScript: (scriptId: string) => void;
  goToNextScript: () => void;
  goToPrevScript: () => void;
  selectTranscript: (transcriptId: string) => void;
  selectStyle: (style: TriggerStyle) => void;
  toggleZone: (zone: RecordingZone) => void;
  setDriven: (zone: RecordingZone) => void;
  setCamera: (side: CameraSide) => void;
  resizeZones: (left: RecordingZone, right: RecordingZone, deltaPx: number) => void;
  toggleTranscript: () => void;
  toggleSetup: () => void;
  closeSetup: () => void;
  toggleMirror: () => void;
  toggleFocus: () => void;
  setText: (preset: TextPreset) => void;
  loadRigs: (rigs: Rig[], workspace: Workspace) => void;
  setRigs: (rigs: Rig[]) => void;
  /**
   * Every set (project) in the store, as summaries — for the setup panel's
   * PROJECT section. Switching is UI-ONLY, like set_active_context: an agent
   * must never move the talent. The panel asks by setting `requestedSetId`;
   * App owns the fetch and answers with `load`.
   */
  sets: SetSummary[];
  setSets: (sets: SetSummary[]) => void;
  requestedSetId: string | null;
  requestSet: (setId: string) => void;
  clearRequestedSet: () => void;
  applyRig: (rigId: string) => void;
  adoptRig: (rig: Rig) => void;
  forgetRig: (rigId: string) => void;
  dismissCue: () => void;
}

/* ------------------------------------------------------------------ *
 * Selection helpers — pure, so the rules stay testable without a DOM
 * ------------------------------------------------------------------ */

/** What `list_sets` answers with — a project row for the setup panel. */
export interface SetSummary {
  id: string;
  title: string;
  description: string;
  /** The FliHub folder name, verbatim, or null for an unattached set. */
  project: string | null;
  scriptCount: number;
}

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

  // The opening arrangement — and only on a machine that has never run the app.
  // From the second launch the workspace supplies it (`loadRigs`), which is the
  // whole reason rigs exist: the talent stopped re-setting four controls before
  // every take.
  ...cloneLayout(DEFAULT_LAYOUT),
  transcriptOpen: false,
  transcriptEdge: edgeFor(DEFAULT_LAYOUT.camera),
  setupOpen: false,

  rigs: [],
  rigId: null,
  rigsLoaded: false,
  restoredLayout: false,
  pendingPosition: null,
  freshTranscripts: {},
  sets: [],
  requestedSetId: null,

  cue: null,
  nudge: 0,

  load: (scriptSet) => {
    /**
     * Restore WHERE THE TALENT WAS, if the workspace recalled a position —
     * David, mid-recording-day, on every dev reload: "you keep making changes
     * and breaking my flow… it'd be even nicer if it could come to the
     * paragraph you were looking at" (2026-08-31).
     *
     * Every id is resolved against the data that just arrived; what no longer
     * exists falls back the same way `refresh` falls back. One rule is
     * stricter: a REMEMBERED paragraph that has vanished from its transcript
     * lands at the END — the end card lights, a visible statement — never
     * silently at the top, which is the corpus-switch bug in restore clothes.
     */
    const pending = get().pendingPosition;
    const wanted = pending && (!pending.setId || pending.setId === scriptSet.id) ? pending : null;
    const script =
      (wanted?.scriptId ? findScript(scriptSet, wanted.scriptId) : undefined) ??
      scriptSet.scripts[0];
    const transcript = script
      ? ((wanted?.transcriptId ? findTranscript(script, wanted.transcriptId) : undefined) ??
        defaultTranscript(script))
      : undefined;
    const style =
      wanted?.style && transcript && findTriggerSet(transcript, wanted.style)
        ? wanted.style
        : defaultStyle(transcript);
    const triggers = transcript && style ? (findTriggerSet(transcript, style)?.triggers ?? []) : [];

    let step = 0;
    if (wanted?.paragraphId && transcript) {
      const known = paragraphsOf(transcript).some((p) => p.id === wanted.paragraphId);
      step = known
        ? stepAtParagraph(transcript, triggers, wanted.paragraphId)
        : Math.max(0, triggers.length - 1);
    }

    set({
      set: scriptSet,
      scriptId: script?.id ?? null,
      transcriptId: transcript?.id ?? null,
      style,
      step,
      pendingPosition: null,
      freshTranscripts: {},
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

    /**
     * Re-seat by PARAGRAPH, never by step index. An agent rewriting the
     * transcript being driven used to leave the INDEX in place — a trigger
     * inserted before the current one moved the talent to a different beat,
     * silently, with no cue (2026-08-31, the live-edit hole). Unlike the
     * restore path, refresh still HOLDS the old structure, so a paragraph
     * that vanished can be topic-mapped through the authored grouping
     * (correspondingParagraphId) — and only when even that fails does it land
     * at the END, card lit, visible. The index clamp survives solely as the
     * fallback for "there was no paragraph to keep".
     */
    /**
     * Mark what ARRIVED. The data swap is silent by design; the fact that
     * something new landed must not be. A transcript that is new, or whose
     * content changed while the talent was NOT looking at it, gets a mark the
     * chip renders until it is selected. The one being displayed is exempt —
     * its changes are already in front of them, and selecting is what clears
     * a mark, so marking the selected one could never clear.
     */
    const freshTranscripts: Record<string, string[]> = { ...state.freshTranscripts };
    for (const nextScript of scriptSet.scripts) {
      const prior = state.set?.scripts.find((sc) => sc.id === nextScript.id);
      const marks = new Set(freshTranscripts[nextScript.id] ?? []);
      for (const candidate of nextScript.transcripts) {
        const displayed =
          nextScript.id === state.scriptId && candidate.id === state.transcriptId;
        const old = prior?.transcripts.find((o) => o.id === candidate.id);
        if (!displayed && (!old || JSON.stringify(old) !== JSON.stringify(candidate)))
          marks.add(candidate.id);
      }
      // A transcript that vanished sheds its mark with it.
      const kept = [...marks].filter((id) => nextScript.transcripts.some((t) => t.id === id));
      if (kept.length > 0) freshTranscripts[nextScript.id] = kept;
      else delete freshTranscripts[nextScript.id];
    }

    const from = currentTranscript(state);
    const fromParagraph = currentParagraphId(state);
    let step: number;
    if (transcript && from && fromParagraph) {
      if (transcript.id === from.id && triggers[state.step]?.paragraphId === fromParagraph) {
        // The same index still points at the same paragraph — the common case
        // (a reworded trigger, a new set elsewhere). Hold the exact beat;
        // re-seating to the paragraph's FIRST trigger would itself be a move.
        step = state.step;
      } else {
        const landing =
          transcript.id === from.id && paragraphsOf(transcript).some((p) => p.id === fromParagraph)
            ? fromParagraph
            : correspondingParagraphId(from, fromParagraph, transcript);
        step = landing
          ? stepAtParagraph(transcript, triggers, landing)
          : Math.max(0, triggers.length - 1);
      }
    } else {
      step = Math.min(state.step, Math.max(0, triggers.length - 1));
    }

    set({
      set: scriptSet,
      scriptId: script.id,
      transcriptId: transcript?.id ?? null,
      style,
      step,
      freshTranscripts,
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
   * The strip's stepper walks scripts; the arrows still walk BEATS.
   *
   * Two different scales on two different controls, which is the prior-art rule
   * rather than an exception to it — the thing that must never happen is one
   * key meaning a beat sometimes and a whole script other times.
   */
  goToPrevScript: () => {
    const previous = prevScript(get());
    if (previous) get().selectScript(previous.id);
  },

  /**
   * Switching corpus — provenance ↔ cadence — KEEPS YOUR PLACE, and says nothing.
   *
   * It carried a cue card until David used it: "the overlay kicking in just
   * means I can't see a visual change in the text, so that's a feature you've
   * added that doesn't help" (B437). A cue announces a boundary the talent
   * CROSSED; switching corpus is an A/B comparison of the same content, and the
   * card hides the exact difference you flipped over to see. Still no card.
   *
   * It used to RESET the beat as well, on the argument that a cadence
   * transcript is a different document and "a wrong sync is worse than none".
   * Then David A/B'd script 04 paragraph by paragraph and every flip dropped
   * him to paragraph 1: "I can't just switch backwards and forwards and see
   * them visually at the right location" (2026-08-30). The A/B toggle is the
   * ONLY way he can judge a rewrite by eye, so a reset costs the exact
   * comparison he flipped to make.
   *
   * The correspondence is by TOPIC, never by paragraph index — see
   * `correspondingParagraphId` for the ragged-edge rules.
   */
  selectTranscript: (transcriptId) => {
    const state = get();
    const script = currentScript(state);
    if (!script) return;
    const transcript = findTranscript(script, transcriptId);
    if (!transcript) return;

    // Keep the style if the target has it, so the only variable that changes
    // is the one the talent flipped.
    const style =
      state.style && findTriggerSet(transcript, state.style)
        ? state.style
        : defaultStyle(transcript);
    const landing = correspondingParagraphId(
      currentTranscript(state),
      currentParagraphId(state),
      transcript,
    );
    const triggers = style ? (findTriggerSet(transcript, style)?.triggers ?? []) : [];

    // Looking at it is what clears the mark.
    const freshTranscripts = { ...get().freshTranscripts };
    const marks = (freshTranscripts[script.id] ?? []).filter((id) => id !== transcript.id);
    if (marks.length > 0) freshTranscripts[script.id] = marks;
    else delete freshTranscripts[script.id];

    set({
      transcriptId: transcript.id,
      style,
      step: stepAtParagraph(transcript, triggers, landing),
      freshTranscripts,
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

  setCamera: (side) => set({ camera: side, transcriptEdge: edgeFor(side) }),

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
  toggleSetup: () => set((s) => ({ setupOpen: !s.setupOpen })),
  closeSetup: () => set({ setupOpen: false }),
  toggleMirror: () => set((s) => ({ mirror: !s.mirror })),
  /**
   * Focus is the RECLAIMED state — the chrome above the first word collapses,
   * not just the neighbouring rows dimming. Entering it therefore shuts the
   * setup panel: reclaiming the top band while a 23rem panel still holds the
   * driven lane away from the lens would be half a move.
   *
   * Leaving it does NOT reopen the panel. `setupOpen` is not remembered and
   * never has been (a rig is what the stage looks like, not which drawer
   * happened to be out), so there is nothing to restore it to.
   */
  toggleFocus: () =>
    set((s) => (s.focus ? { focus: false } : { focus: true, setupOpen: false })),
  setText: (preset) => set({ text: preset }),

  /**
   * First load: adopt the rigs, and restore the arrangement the talent quit
   * with. `workspace.layout` is null only on a machine that has never run the
   * app — every other launch comes back exactly as it was left.
   *
   * It restores the LAYOUT and nothing else. Which script, which corpus, which
   * style and which beat are deliberately not remembered: a prompter that
   * reopens mid-script is a prompter that has decided where you are, and the
   * cue-card rules exist precisely because being moved without being told is
   * the thing that ruins a take.
   */
  loadRigs: (rigs, workspace) => {
    const layout = workspace.layout;
    // The position is recalled whether or not the layout validates — they are
    // independent facts about how the talent left the app. `load` consumes it
    // once the set arrives.
    const pendingPosition = workspace.position ?? null;
    if (!layout || validateRigLayout(layout).length > 0) {
      set({ rigs, rigId: workspace.rigId, rigsLoaded: true, restoredLayout: false, pendingPosition });
      return;
    }
    set({
      rigs,
      rigId: workspace.rigId,
      rigsLoaded: true,
      restoredLayout: true,
      pendingPosition,
      ...cloneLayout(layout),
      visible: canonicalZones(layout.visible),
      transcriptEdge: edgeFor(layout.camera),
    });
  },

  /**
   * New rig data with no arrangement change — the refresh path. An agent that
   * saved a rig must not repaint the stage of someone mid-take; the chips gain
   * a name, and that is all that may happen.
   */
  setRigs: (rigs) => set({ rigs }),

  setSets: (sets) => set({ sets }),
  requestSet: (setId) => set({ requestedSetId: setId }),
  clearRequestedSet: () => set({ requestedSetId: null }),

  applyRig: (rigId) => {
    const rig = findRig(get().rigs, rigId);
    // A rig is validated before it is stored, so an invalid one here means the
    // store is ahead of this window. Ignoring it beats rearranging the stage
    // into something the domain already refused.
    if (!rig || validateRigLayout(rig.layout).length > 0) return;
    set({
      ...cloneLayout(rig.layout),
      visible: canonicalZones(rig.layout.visible),
      transcriptEdge: edgeFor(rig.layout.camera),
      rigId: rig.id,
    });
  },

  /**
   * A rig this window just saved or renamed: insert-or-replace it and treat it
   * as the applied one. The broadcast will bring the same rig back a moment
   * later; doing it here as well means the chip lights up on the click rather
   * than on the round trip.
   */
  adoptRig: (rig) => {
    const rigs = get().rigs;
    const index = rigs.findIndex((candidate) => candidate.id === rig.id);
    set({
      rigs:
        index >= 0 ? rigs.map((candidate, i) => (i === index ? rig : candidate)) : [...rigs, rig],
      rigId: rig.id,
    });
  },

  /**
   * Drop a rig from the list WITHOUT touching the arrangement on screen.
   * Deleting a name must never repaint a stage someone is talking to — the
   * core makes the same distinction, and both have to, because either one
   * alone would leave the other free to move the talent.
   */
  forgetRig: (rigId) =>
    set((s) => ({
      rigs: s.rigs.filter((rig) => rig.id !== rigId),
      rigId: s.rigId === rigId ? null : s.rigId,
    })),

  dismissCue: () => set({ cue: null }),
}));

/**
 * The skim surface follows the lens: it opens from the FAR edge, so it can
 * never slide across the zone the talent is looking at.
 */
function edgeFor(camera: CameraSide): CameraSide {
  return camera === 'left' ? 'right' : 'left';
}

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
 * Where paragraph `paragraphId` of `from` lands in `to` — the A/B switch.
 *
 * Paragraph ids are POSITIONAL (`p1`…`pN`) and mean nothing across corpora:
 * v02 re-cadences four of Tom's paragraphs into three, so Tom's `p3` is the
 * rewrite's `p2`. Topic ids are positional too, but over the AUTHORED grouping
 * in `scripts/authored-domain.mjs` — and that grouping is the author's own
 * claim about which of Tom's beats became which ("four become three" is
 * written there, beside the text). So the honest correspondence is by topic:
 * authored data in the sense rule 3 wants, never a proportion.
 *
 * The ragged edge, in order:
 *   1. same MINOR topic exists in `to`  → its first paragraph
 *   2. else same MAJOR topic exists     → its first paragraph (the minor was
 *      folded into its neighbour — v02's t1.2 lands on t1.1, which is right)
 *   3. else                             → the LAST paragraph of `to`
 *
 * Never paragraph 1 by default: a silent reset to the top is the bug this
 * replaces, and it read as "the rewrite is missing" to the talent. Case 3
 * lands at the END on purpose — the end card lights, which is a visible
 * statement that the target has nowhere for this beat to go.
 */
export const correspondingParagraphId = (
  from: Transcript | undefined,
  paragraphId: string | null,
  to: Transcript,
): string | null => {
  const all = paragraphsOf(to);
  if (all.length === 0) return null;
  const owner = from && paragraphId ? ownership(from).get(paragraphId) : undefined;
  if (!owner) return all[0]?.id ?? null;

  for (const major of to.topics)
    for (const minor of major.minors)
      if (minor.id === owner.minor && minor.paragraphs[0]) return minor.paragraphs[0].id;

  const major = to.topics.find((m) => m.id === owner.major);
  const first = major?.minors[0]?.paragraphs[0];
  if (first) return first.id;
  return all[all.length - 1]?.id ?? null;
};

/**
 * The step in `triggers` that shows `paragraphId`: the first trigger mapped to
 * it, else the last trigger mapped to a paragraph BEFORE it (a set need not
 * cover every paragraph), else 0.
 */
const stepAtParagraph = (
  transcript: Transcript,
  triggers: { text: string; paragraphId: string }[],
  paragraphId: string | null,
): number => {
  if (!paragraphId || triggers.length === 0) return 0;
  const exact = triggers.findIndex((t) => t.paragraphId === paragraphId);
  if (exact >= 0) return exact;
  const order = paragraphsOf(transcript).map((p) => p.id);
  const target = order.indexOf(paragraphId);
  let best = 0;
  triggers.forEach((t, i) => {
    if (order.indexOf(t.paragraphId) <= target) best = i;
  });
  return best;
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

export const prevScript = (s: PrompterState): Script | undefined => {
  if (!s.set || !s.scriptId) return undefined;
  const index = s.set.scripts.findIndex((script) => script.id === s.scriptId);
  return index <= 0 ? undefined : s.set.scripts[index - 1];
};

/**
 * Which edge the setup panel enters from: the one FURTHEST from the lens.
 *
 * Same rule the transcript drawer follows, and for the same reason — a panel
 * between the talent and the driven zone is the failure mode, whichever panel
 * it is.
 */
export const setupEdge = (s: PrompterState): CameraSide => edgeFor(s.camera);

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

/* ------------------------------------------------------------------ *
 * Rigs
 * ------------------------------------------------------------------ */

/**
 * The live arrangement, as a rig would store it.
 *
 * ⚠️ **Never call this as a component selector.** It builds a fresh object with
 * a fresh `visible` array and `weights` record every call, so `useProm(layoutOf)`
 * re-renders forever — the same blank-window bug documented in `docs/kdd/`, and
 * `useShallow` does not save you because the nested `weights` is a new reference
 * too. Read it from `useProm.getState()` inside an effect or a handler.
 */
export const layoutOf = (s: PrompterState): RigLayout => ({
  visible: canonicalZones(s.visible),
  driven: s.driven,
  weights: { ...s.weights },
  camera: s.camera,
  text: s.text,
  mirror: s.mirror,
  focus: s.focus,
});

/** The rig currently applied, if it still exists. */
export const activeRig = (s: PrompterState): Rig | undefined =>
  s.rigId ? findRig(s.rigs, s.rigId) : undefined;

/**
 * Whether the talent has moved away from the rig they picked. Returns a
 * BOOLEAN on purpose — it is safe as a component selector, unlike `layoutOf`.
 */
export const rigModified = (s: PrompterState): boolean => {
  const rig = activeRig(s);
  return rig ? !sameLayout(rig.layout, layoutOf(s)) : false;
};
