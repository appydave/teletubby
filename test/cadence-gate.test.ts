import { describe, expect, it } from 'vitest';
import { KYBERNESIS_PHASE_1, TALENTS } from '@shared/script-set';
import { cadenceFor, provenanceOf, transcriptText } from '@shared/domain';
import { measure, scoreAgainst } from '@core/cadence';

/**
 * PARITY WITH score.py.
 *
 * The gate is a port of `~/dev/ad/brains/kybernesis/phase-1-scripts/score.py`,
 * and a port that drifts is worse than no port — it would report a confident
 * wrong answer about whether a script is speakable. So the numbers here are
 * the ones the Python produced, not the ones this implementation happens to.
 *
 * The brief's headline table is corpus-wide (mean breath group 7.30 → 11.17,
 * breaks/100w 7.89 → 3.58, sentence SD 8.53 → 14.77). Those are means over the
 * set, so an individual script sits either side of them — which is why the
 * table below pins PER-DOCUMENT figures instead, taken straight from the
 * Python.
 */

const david = TALENTS[0].envelope;

describe('the eight rules', () => {
  it('measures breath groups the way score.py does', () => {
    // Groups of fewer than two words are dropped; splitting is on , ; : . ! ? — …
    const m = measure('One, two three, four five six. Seven eight nine ten.');
    expect(m.breathGroupMean).toBe(3);
    expect(m.breaksPer100).toBe(20);
    expect(m.sentences).toBe(2);
  });

  it('uses population standard deviation, not sample', () => {
    // st.pstdev, not st.stdev. Sample SD on short scripts runs visibly higher
    // and would let a flat script through the sentence-variation rule.
    const m = measure('One two three four. One two.');
    expect(m.sentenceSd).toBe(1);
  });

  it('flags an anti-voice word and a bookend', () => {
    const score = scoreAgainst(
      'This seamless workflow is game-changing. Like and subscribe for more of it.',
      david,
    );
    expect(score.rules.find((r) => r.key === 'anti-voice')?.pass).toBe(false);
    expect(score.rules.find((r) => r.key === 'bookends')?.pass).toBe(false);
    // `game-changing` and `game changing` are the same word to the gate.
    expect(score.measurements.antiVoice).toContain('game-changing');
  });

  it('reports every missing mandatory term, not just the first', () => {
    const score = scoreAgainst('An agent takes an action.', david, [
      'agent',
      'shared foundation',
      'permissions',
    ]);
    expect(score.measurements.missingTerms).toEqual(['shared foundation', 'permissions']);
    expect(score.rules.find((r) => r.key === 'mandatory-terms')?.pass).toBe(false);
  });

  it('matches a mandatory term across a line break', () => {
    // re.escape(term).replace(r'\ ', r'\s+') — a term may wrap.
    const score = scoreAgainst('the shared\nfoundation underneath', david, ['shared foundation']);
    expect(score.measurements.missingTerms).toEqual([]);
  });

  it('names the envelope it judged against', () => {
    // A score with no provenance is a number someone will later apply to
    // another talent because nothing said whose it was.
    expect(scoreAgainst('anything at all here', david).envelopeSource).toMatch(/David/);
  });
});

describe('parity with score.py, on the real Kybernesis pairs', () => {
  /**
   * Ground truth, produced by running the Python on the committed files:
   *
   *   python3 -c "from score import score; print(score(open('v01-rewrite.txt').read()))"
   *
   * If a number here changes, the port has drifted — do NOT update the table to
   * match the port. Re-run the Python and find out which one is wrong.
   */
  const EXPECTED = [
    {
      n: 1,
      kind: 'provenance',
      words: 146,
      bg: 7.9,
      breaks: 8.9,
      sd: 10.3,
      em: 3,
      pass: false,
    },
    {
      n: 1,
      kind: 'cadence',
      words: 155,
      bg: 11.1,
      breaks: 3.87,
      sd: 15.6,
      em: 0,
      pass: true,
    },
    {
      n: 2,
      kind: 'provenance',
      words: 140,
      bg: 7.8,
      breaks: 6.43,
      sd: 8.6,
      em: 1,
      pass: false,
    },
    {
      n: 2,
      kind: 'cadence',
      words: 146,
      bg: 10.4,
      breaks: 4.11,
      sd: 14.3,
      em: 0,
      pass: true,
    },
    {
      n: 3,
      kind: 'provenance',
      words: 132,
      bg: 6.2,
      breaks: 8.33,
      sd: 6.7,
      em: 2,
      pass: false,
    },
    {
      n: 3,
      kind: 'cadence',
      words: 143,
      bg: 11.8,
      breaks: 2.8,
      sd: 14.4,
      em: 0,
      pass: true,
    },
  ] as const;

  it.each(EXPECTED)('script $n · $kind', (expected) => {
    const script = KYBERNESIS_PHASE_1.scripts[expected.n - 1];
    const transcript =
      expected.kind === 'provenance' ? provenanceOf(script)! : cadenceFor(script, 'david')[0];
    const score = scoreAgainst(transcriptText(transcript), david);

    expect(score.measurements.words).toBe(expected.words);
    expect(score.measurements.breathGroupMean).toBe(expected.bg);
    expect(score.measurements.breaksPer100).toBe(expected.breaks);
    expect(score.measurements.sentenceSd).toBe(expected.sd);
    expect(score.measurements.emDash).toBe(expected.em);
    expect(score.pass).toBe(expected.pass);
  });

  it('fails every one of Tom’s twelve originals on the breath-group rule', () => {
    // Not a slight — the measured finding. Tom writes ~7-word breath groups;
    // David speaks in ~11.5. The originals are the corpus measured hardest to
    // perform, and the gate has to say so out loud before a take, not after.
    for (const script of KYBERNESIS_PHASE_1.scripts) {
      const score = scoreAgainst(transcriptText(provenanceOf(script)!), david);
      expect(score.pass, `${script.id} unexpectedly passes`).toBe(false);
      expect(score.rules.find((r) => r.key === 'breath-group')?.pass).toBe(false);
    }
  });

  it('passes all three re-cadenced scripts', () => {
    // The acceptance test exists; the generator does not. These three were
    // rewritten BY HAND against this gate — nothing in this repo produces them.
    for (const n of [1, 2, 3]) {
      const transcript = cadenceFor(KYBERNESIS_PHASE_1.scripts[n - 1], 'david')[0];
      expect(scoreAgainst(transcriptText(transcript), david).pass, `v0${n} should pass`).toBe(true);
    }
  });

  it('still refuses a script that is too short — the length rule is not cosmetic', () => {
    const clipped = scoreAgainst('So here is a question. That is the gap.', david);
    expect(clipped.rules.find((r) => r.key === 'length')?.pass).toBe(false);
    expect(clipped.pass).toBe(false);
  });
});
