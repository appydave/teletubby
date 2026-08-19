import { useEffect } from 'react';
import { useProm } from '../store';

const CUE_MS = 850;

/**
 * Fires on EVERY boundary crossing, whatever triggered it — a script change or
 * a switch between the provenance and cadence corpora. A boundary you cross
 * without noticing is the bug this exists to prevent; see
 * docs/prior-art-kybernesis-prompter.md §3.
 */
export default function CueOverlay(): JSX.Element | null {
  const cue = useProm((s) => s.cue);
  const dismissCue = useProm((s) => s.dismissCue);

  useEffect(() => {
    if (!cue) return;
    const timer = window.setTimeout(dismissCue, CUE_MS);
    return () => window.clearTimeout(timer);
    // `token` changes on every cue, so a rapid second change restarts the timer.
  }, [cue?.token, cue, dismissCue]);

  if (!cue) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-veil"
      role="status"
      aria-live="polite"
    >
      <div className="tt-cue flex flex-col items-center gap-3 px-10 text-center">
        <span className="font-display text-[7rem] font-bold leading-none text-sequence">
          {cue.label}
        </span>
        <span className="max-w-xl font-display text-2xl uppercase tracking-wide text-ink">
          {cue.title}
        </span>
      </div>
    </div>
  );
}
