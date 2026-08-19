import { create } from 'zustand';
import { SCRIPTS, type PrompterScript } from '@shared/scripts';

/**
 * The lane track. `←` and `→` walk these three positions in the order they sit
 * on screen, clamped at both ends with no wrapping.
 *
 *     ←──────────────────────────────────────→
 *   BULLETS            BOTH              SCRIPT
 *   (col 2)      (col 2 | col 3)         (col 3)
 *
 * Column 1 (topic headings) is a persistent rail — it is not on the track,
 * because it is orientation rather than something you read from.
 */
export const LANES = ['bullets', 'both', 'script'] as const;
export type Lane = (typeof LANES)[number];

/** Three named presets — one decision before the take, never a ±stepper. */
export const TEXT_PRESETS = ['standard', 'large', 'stage'] as const;
export type TextPreset = (typeof TEXT_PRESETS)[number];

export interface CueCard {
  n: number;
  title: string;
  /** Changes on every cue so the component can restart its dismiss timer. */
  token: number;
}

interface PrompterState {
  scriptIndex: number;
  /** Index into the current script's `bullets`. THE position — everything derives from it. */
  step: number;
  laneIndex: number;
  mirror: boolean;
  focus: boolean;
  text: TextPreset;
  cue: CueCard | null;
  /** Increments each time a step was refused at the boundary, to replay the nudge. */
  nudge: number;

  stepNext: () => void;
  stepPrev: () => void;
  laneLeft: () => void;
  laneRight: () => void;
  selectScript: (index: number) => void;
  goToNextScript: () => void;
  toggleMirror: () => void;
  toggleFocus: () => void;
  setText: (preset: TextPreset) => void;
  dismissCue: () => void;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const useProm = create<PrompterState>((set, get) => ({
  scriptIndex: 0,
  step: 0,
  laneIndex: 1, // start in BOTH — you read the transcript before you drive the bullets
  mirror: false,
  focus: false,
  text: 'standard',
  cue: null,
  nudge: 0,

  /**
   * Stepping is clamped INSIDE the script, always. Pressing past the last beat
   * nudges the end card — it can never silently roll into the next script.
   *
   * This is the single most important rule in the app. In the original prompter
   * `↓` past the last beat advanced to the next script, and David hit it live:
   * "there was no clear distinction that I was moving out of transcript 1 into
   * transcript 2. I got really confused." One key means one scale of movement.
   * See docs/prior-art-kybernesis-prompter.md §3.
   */
  stepNext: () => {
    const { step, scriptIndex, nudge } = get();
    const last = SCRIPTS[scriptIndex].bullets.length - 1;
    if (step >= last) {
      set({ nudge: nudge + 1 });
      return;
    }
    set({ step: step + 1 });
  },

  stepPrev: () => {
    const { step } = get();
    set({ step: Math.max(0, step - 1) });
  },

  laneLeft: () => set((s) => ({ laneIndex: clamp(s.laneIndex - 1, 0, LANES.length - 1) })),
  laneRight: () => set((s) => ({ laneIndex: clamp(s.laneIndex + 1, 0, LANES.length - 1) })),

  /**
   * Every script change announces itself with a cue card — whatever triggered
   * it. Changing script also resets the step; there is no "resume where I was",
   * because a half-remembered position is worse than a known one.
   */
  selectScript: (index: number) => {
    const next = clamp(index, 0, SCRIPTS.length - 1);
    const script = SCRIPTS[next];
    set((s) => ({
      scriptIndex: next,
      step: 0,
      cue: { n: script.n, title: script.title, token: (s.cue?.token ?? 0) + 1 },
    }));
  },

  goToNextScript: () => {
    const { scriptIndex, selectScript } = get();
    if (scriptIndex < SCRIPTS.length - 1) selectScript(scriptIndex + 1);
  },

  toggleMirror: () => set((s) => ({ mirror: !s.mirror })),
  toggleFocus: () => set((s) => ({ focus: !s.focus })),
  setText: (preset) => set({ text: preset }),
  dismissCue: () => set({ cue: null }),
}));

/* ---------- derived selectors ---------- */

export const currentScript = (s: PrompterState): PrompterScript => SCRIPTS[s.scriptIndex];

/**
 * The one directional lookup: trigger → paragraph is exact, and it is read from
 * the authored map. It is never computed from position.
 */
export const currentSectionIndex = (s: PrompterState): number =>
  currentScript(s).map[s.step] - 1;

export const currentLane = (s: PrompterState): Lane => LANES[s.laneIndex];

export const isLastStep = (s: PrompterState): boolean =>
  s.step >= currentScript(s).bullets.length - 1;
