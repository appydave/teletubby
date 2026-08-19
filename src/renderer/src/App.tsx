import { useEffect } from 'react';
import { SCRIPTS } from '@shared/scripts';
import {
  useProm,
  currentScript,
  currentSectionIndex,
  currentLane,
  LANES,
  TEXT_PRESETS,
  type TextPreset,
} from './store';
import { TopicRail, BulletLane, ScriptLane, type Rank } from './components/Lanes';
import CueOverlay from './components/CueOverlay';

const PRESET_LABEL: Record<TextPreset, string> = {
  standard: 'Standard',
  large: 'Large',
  stage: 'Stage',
};

export default function App(): JSX.Element {
  const script = useProm(currentScript);
  const sectionIndex = useProm(currentSectionIndex);
  const lane = useProm(currentLane);
  const step = useProm((s) => s.step);
  const scriptIndex = useProm((s) => s.scriptIndex);
  const mirror = useProm((s) => s.mirror);
  const focus = useProm((s) => s.focus);
  const text = useProm((s) => s.text);

  const stepNext = useProm((s) => s.stepNext);
  const stepPrev = useProm((s) => s.stepPrev);
  const laneLeft = useProm((s) => s.laneLeft);
  const laneRight = useProm((s) => s.laneRight);
  const selectScript = useProm((s) => s.selectScript);
  const toggleMirror = useProm((s) => s.toggleMirror);
  const toggleFocus = useProm((s) => s.toggleFocus);
  const setText = useProm((s) => s.setText);

  // The text preset is a root-level data attribute so a single CSS variable
  // rescales every lane at once.
  useEffect(() => {
    document.documentElement.dataset.text = text;
  }, [text]);

  /**
   * One key means one scale of movement:
   *   ↑ ↓ Space  step the TRIGGERS (always — even in the side-by-side view,
   *              because the triggers are what you speak from)
   *   ← →        which COLUMN is on screen
   *   click      which SCRIPT — deliberately not on the keyboard at all
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          stepNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          stepPrev();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          laneLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          laneRight();
          break;
        case 'd':
        case 'D':
          toggleFocus();
          break;
        case 'm':
        case 'M':
          toggleMirror();
          break;
        case 'f':
        case 'F':
          if (document.fullscreenElement) void document.exitFullscreen();
          else void document.documentElement.requestFullscreen();
          break;
        default:
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stepNext, stepPrev, laneLeft, laneRight, toggleFocus, toggleMirror]);

  const showBullets = lane === 'bullets' || lane === 'both';
  const showScript = lane === 'script' || lane === 'both';

  // In the side-by-side view the triggers are what you are driving, so they
  // carry the strong marker and the transcript the quiet one. When a lane is
  // alone on screen it is unambiguously the one you are reading.
  const bulletRank: Rank = 'driven';
  const scriptRank: Rank = lane === 'both' ? 'follower' : 'driven';

  return (
    <div className="flex h-screen flex-col bg-canvas text-ink">
      {/* ---------------- chrome: never mirrored, always readable ---------------- */}
      <header className="shrink-0 border-b border-edge bg-panel">
        {/* The title strip IS the drag handle — see .tt-drag in index.css.
            It deliberately holds no controls, so nothing here needs to opt out. */}
        <div className="tt-drag flex select-none items-baseline gap-3 py-3 pr-5">
          <span className="font-display text-lg font-bold uppercase tracking-[0.2em] text-ink">
            Teletubby
          </span>
          <span className="font-body text-xs text-muted">
            Kybernesis Phase 1 · glance, don&apos;t read
          </span>
        </div>

        {/* Script selection — click only. */}
        <div className="flex flex-wrap gap-1.5 px-5 py-3">
          {SCRIPTS.map((s, i) => {
            const active = i === scriptIndex;
            return (
              <button
                key={s.n}
                type="button"
                onClick={() => selectScript(i)}
                title={s.title}
                className={[
                  'rounded border px-2.5 py-1 font-mono text-xs transition',
                  active
                    ? 'border-edge-strong bg-driven text-ink'
                    : 'border-edge bg-card text-muted hover:border-follower hover:text-ink',
                ].join(' ')}
              >
                {String(s.n).padStart(2, '0')}
              </button>
            );
          })}
          <span className="ml-3 self-center font-display text-sm uppercase tracking-wide text-ink">
            {String(script.n).padStart(2, '0')} · {script.title}
          </span>
        </div>

        {/* Controls + keymap */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-edge px-5 py-2">
          <LaneTrack lane={lane} />

          <div className="flex items-center gap-1.5">
            <span className="font-display text-[0.65rem] uppercase tracking-[0.18em] text-muted">
              Text
            </span>
            {TEXT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setText(preset)}
                className={[
                  'rounded border px-2 py-0.5 font-display text-[0.7rem] uppercase tracking-wide transition',
                  text === preset
                    ? 'border-edge-strong bg-driven text-ink'
                    : 'border-edge bg-card text-muted hover:text-ink',
                ].join(' ')}
              >
                {PRESET_LABEL[preset]}
              </button>
            ))}
          </div>

          <Toggle label="Mirror" hint="M" on={mirror} onClick={toggleMirror} />
          <Toggle label="Focus" hint="D" on={focus} onClick={toggleFocus} />

          <span className="ml-auto font-mono text-[0.7rem] text-muted">
            ↑ ↓ space step · ← → column · click script · F fullscreen
          </span>
        </div>
      </header>

      {/* ---------------- stage: mirrorable ---------------- */}
      <main className="relative flex-1 overflow-hidden">
        <div className={['flex h-full', mirror ? 'tt-mirror' : ''].join(' ')}>
          <TopicRail script={script} sectionIndex={sectionIndex} />
          {showBullets && (
            <BulletLane script={script} step={step} rank={bulletRank} focus={focus} />
          )}
          {showScript && (
            <ScriptLane
              script={script}
              sectionIndex={sectionIndex}
              rank={scriptRank}
              focus={focus}
            />
          )}
        </div>
        <CueOverlay />
      </main>

      <footer className="shrink-0 border-t border-edge bg-panel px-5 py-1.5">
        <span className="font-mono text-[0.7rem] text-muted">
          beat {step + 1}/{script.bullets.length} · section {sectionIndex + 1}/
          {script.sections.length} · {script.takeaway}
        </span>
      </footer>
    </div>
  );
}

function LaneTrack({ lane }: { lane: string }): JSX.Element {
  return (
    <div className="flex items-center gap-1">
      <span className="font-display text-[0.65rem] uppercase tracking-[0.18em] text-muted">
        Column
      </span>
      {LANES.map((name) => (
        <span
          key={name}
          className={[
            'rounded border px-2 py-0.5 font-display text-[0.7rem] uppercase tracking-wide',
            lane === name ? 'border-edge-strong bg-driven text-ink' : 'border-edge bg-card text-muted',
          ].join(' ')}
        >
          {name}
        </span>
      ))}
    </div>
  );
}

function Toggle({
  label,
  hint,
  on,
  onClick,
}: {
  label: string;
  hint: string;
  on: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={[
        'rounded border px-2.5 py-0.5 font-display text-[0.7rem] uppercase tracking-wide transition',
        on ? 'border-edge-strong bg-driven text-ink' : 'border-edge bg-card text-muted hover:text-ink',
      ].join(' ')}
    >
      {label} <span className="font-mono text-[0.65rem] opacity-60">{hint}</span>
    </button>
  );
}
