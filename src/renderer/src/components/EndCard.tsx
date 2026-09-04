import { useProm, isLastStep, nextScript } from '../store';

/**
 * Sits at the bottom of every script. It goes live (yellow) once you reach the
 * last beat, names what comes next, and carries the only keyboard-free way
 * forward. Pressing down again nudges it rather than moving — the boundary is
 * a thing you step over deliberately, never something that happens to you.
 */
export default function EndCard(): JSX.Element {
  const reached = useProm(isLastStep);
  const nudge = useProm((s) => s.nudge);
  const next = useProm(nextScript);
  const goToNextScript = useProm((s) => s.goToNextScript);
  const scriptCount = useProm((s) => s.set?.scripts.length ?? 0);

  const isFinal = !next;

  return (
    <div
      // `key` on the nudge counter remounts the node, so the animation replays
      // on every refused keypress instead of only the first.
      key={nudge}
      className={[
        nudge > 0 && reached ? 'tt-nudge' : '',
        'mt-8 rounded-lg border-2 px-5 py-4 transition-colors duration-200',
        reached ? 'border-driven bg-driven-wash' : 'border-edge bg-transparent opacity-45',
      ].join(' ')}
    >
      <p className="font-display text-xs uppercase tracking-[0.18em] text-muted">
        {isFinal ? 'End of the set' : 'End of this script'}
      </p>

      {isFinal ? (
        <p className="mt-1 font-body text-script text-ink">
          {scriptCount > 1
            ? `That was the last of the ${scriptCount}.`
            : 'That was the only script in this set.'}
        </p>
      ) : (
        <>
          <p className="mt-1 font-body text-script text-ink">
            Next up —{' '}
            <span className="font-mono text-sequence">{String(next.n).padStart(2, '0')}</span>{' '}
            <span className="font-semibold">{next.title}</span>
          </p>
          <button
            type="button"
            onClick={goToNextScript}
            disabled={!reached}
            className="mt-3 rounded border border-edge-strong bg-driven px-4 py-1.5 font-display text-sm uppercase tracking-wide text-ink transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            Go to script {String(next.n).padStart(2, '0')}
          </button>
        </>
      )}
    </div>
  );
}
