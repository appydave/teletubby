import { useEffect, useState } from 'react';

/**
 * WHAT "CADENCE" ACTUALLY MEANS, shown in the app.
 *
 * David, using it for the first time: "I don't understand how you got to this
 * cadence… I don't understand how it's configured, how we learn it… is it a
 * prompt? At the moment it's a little bit of a black box, I don't want it to be
 * a black box" (B437).
 *
 * ⚠️ **There is no prompt, and this panel says so.** V01–V03 were rewritten BY
 * HAND against a measured gate. The honest position on record is "the
 * acceptance test exists, the generator does not" — so a panel that displayed a
 * cadence prompt would be displaying something that was never written. What
 * exists is a MEASUREMENT of how one person speaks, and a scorer that says
 * whether a script sits inside it. That is what this shows.
 *
 * ⚠️ The thresholds belong to ONE person and are never ported. Applying David's
 * numbers to Alex would make the gate meaningless, so the panel always names
 * whose envelope it is judging against and where it came from.
 */

interface Rule {
  key: string;
  label: string;
  pass: boolean;
  actual: string;
  target: string;
}

interface Score {
  pass: boolean;
  rules: Rule[];
  envelopeSource: string;
}

export default function CadencePanel({
  scriptId,
  transcriptId,
  corpus,
  talentId,
  onClose,
}: {
  scriptId: string;
  transcriptId: string;
  corpus: string;
  talentId: string;
  onClose: () => void;
}): JSX.Element {
  const [score, setScore] = useState<Score | null>(null);
  const [talentName, setTalentName] = useState<string>(talentId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const scored = await window.appytron.invoke<{ score: Score }>({
        capability: 'score_transcript',
        input: { scriptId, transcriptId, talentId },
      });
      const talent = await window.appytron.invoke<{ talent: { name: string } }>({
        capability: 'get_talent',
        input: { talentId },
      });
      if (cancelled) return;
      if (!scored.ok) {
        setError(scored.error.message);
        return;
      }
      setScore(scored.data.score);
      if (talent.ok) setTalentName(talent.data.talent.name);
    })();
    return () => {
      cancelled = true;
    };
  }, [scriptId, transcriptId, talentId]);

  return (
    <div
      className="absolute inset-0 z-30 flex items-start justify-center bg-veil pt-16"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="tt-lane-scroll max-h-[80%] w-[38rem] rounded-lg border border-edge-strong bg-panel px-7 py-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="presentation"
      >
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-base uppercase tracking-[0.18em] text-ink">Cadence</h2>
          <span className="font-mono text-xs text-muted">{corpus}</span>
          <span className="ml-auto font-mono text-[0.65rem] text-muted">click away to close</span>
        </div>

        <p className="mt-3 font-body text-sm text-ink">
          Measured against <span className="font-semibold">{talentName}</span>&apos;s envelope.
        </p>

        {error && <p className="mt-4 font-body text-sm text-ink">{error}</p>}

        {score && (
          <>
            <p
              className={[
                'mt-4 inline-block rounded border px-3 py-1 font-display text-sm uppercase tracking-wide',
                score.pass
                  ? 'border-edge-strong bg-driven text-ink'
                  : 'border-edge bg-card text-ink',
              ].join(' ')}
            >
              {score.pass ? 'Inside the envelope' : 'Outside the envelope'}
            </p>

            <table className="mt-4 w-full border-collapse font-body text-sm">
              <tbody>
                {score.rules.map((rule) => (
                  <tr key={rule.key} className="border-b border-edge last:border-b-0">
                    <td className="py-1.5 pr-3 text-muted">{rule.label}</td>
                    <td className="py-1.5 pr-3 font-mono text-xs text-ink">{rule.actual}</td>
                    <td className="py-1.5 pr-3 font-mono text-xs text-muted">{rule.target}</td>
                    <td className="py-1.5 text-right font-mono text-xs">
                      {rule.pass ? (
                        <span className="text-muted">ok</span>
                      ) : (
                        <span className="font-semibold text-ink">off</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="mt-4 font-body text-xs leading-relaxed text-muted">
              <span className="font-semibold text-ink">Where these numbers come from — </span>
              {score.envelopeSource}
            </p>

            {/*
              The honest bit, and the reason this panel exists at all. It would
              be easy to imply a cadence prompt is driving the rewrite. Nothing
              is.
            */}
            <p className="mt-3 rounded border border-edge bg-card px-3 py-2 font-body text-xs leading-relaxed text-ink">
              <span className="font-semibold">There is no cadence prompt.</span> The re-cadenced
              scripts were rewritten <em>by hand</em> against these eight rules — the gate is
              automated, the rewriting is not. Thresholds belong to one person and are never carried
              across to another talent.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
