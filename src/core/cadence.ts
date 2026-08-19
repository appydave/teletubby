/**
 * THE CADENCE GATE — the buildable half of the scoring problem.
 *
 * A faithful port of `~/dev/ad/brains/kybernesis/phase-1-scripts/score.py`
 * (~35 lines of stdlib, eight falsifiable threshold rules). It is here rather
 * than shelled out to Python because it has no dependencies and the app needs
 * it before a script is ever put on screen.
 *
 * WHAT THIS IS NOT. There are two ways to score, and only one is available:
 *
 *   score the SCRIPT, before the take  →  needs nothing but the text  →  THIS
 *   score the TAKE, after it           →  needs a transcript of the take  →  blocked
 *
 * The second needs FliHub, which is ruled direction-only (requirements §8) and
 * is being rebuilt. Nothing here depends on it.
 *
 * ⚠️ Cadence CHECKING is not AI work and does not belong in the deferred layer.
 * Generating a re-cadenced script may need a model; verifying that a script sits
 * inside a talent's measured envelope does not. The honest position is "the
 * acceptance test exists, the generator does not" — the three re-cadenced
 * Kybernesis scripts were rewritten by hand against this gate.
 *
 * ⚠️ The thresholds are NEVER global. They arrive on a `Talent` because they are
 * a measurement of one person (requirements §9).
 */

import type { CadenceEnvelope } from '@shared/domain';

export interface CadenceMeasurements {
  words: number;
  sentences: number;
  sentenceMean: number;
  /** Population standard deviation, matching score.py's `st.pstdev`. */
  sentenceSd: number;
  /** Mean words per breath group — the headline number. David ≈ 11.5. */
  breathGroupMean: number;
  breaksPer100: number;
  emDash: number;
  antiVoice: string[];
  bookends: string[];
  missingTerms: string[];
}

export interface CadenceRule {
  /** Stable key, so a UI can flag one rule without matching on prose. */
  key:
    | 'length'
    | 'breath-group'
    | 'break-density'
    | 'sentence-variation'
    | 'em-dash'
    | 'mandatory-terms'
    | 'anti-voice'
    | 'bookends';
  label: string;
  pass: boolean;
  /** What was measured, and what was required — both, always. */
  actual: string;
  target: string;
}

export interface CadenceScore {
  pass: boolean;
  measurements: CadenceMeasurements;
  rules: CadenceRule[];
  /** Which envelope this was judged against. Never anonymous. */
  envelopeSource: string;
}

const WORD = /[a-z']+/g;
/**
 * Breath-group and sentence splitting, verbatim from score.py. Groups of fewer
 * than two words are dropped — a lone "So." is not a breath group.
 */
const SENTENCE_SPLIT = /(?<=[.!?])\s+/;
const BREATH_SPLIT = /[,;:.!?—…]/;
const BREAK_CHARS = /[,;:—]/g;

const wordsIn = (text: string): string[] => text.toLowerCase().match(WORD) ?? [];

const mean = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;

/** Population standard deviation — `statistics.pstdev`, not `stdev`. */
const pstdev = (values: number[]): number => {
  if (values.length === 0) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
};

const round = (value: number, places: number): number => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

const escapeRegExp = (literal: string): string => literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** `re.escape(m).replace(r'\ ', r'\s+')` — a term may wrap across a line break. */
const termPattern = (term: string): RegExp =>
  new RegExp(escapeRegExp(term).replace(/\\?\s+/g, '\\s+'), 'i');

const countMatches = (text: string, literals: string[]): string[] => {
  const found: string[] = [];
  for (const literal of literals) {
    const pattern = new RegExp(`\\b${escapeRegExp(literal).replace(/\\?\s+/g, '[- ]')}\\b`, 'gi');
    const matches = text.match(pattern);
    if (matches) found.push(...matches.map((m) => m.toLowerCase()));
  }
  return found;
};

export function measure(text: string, mustTerms: string[] = []): CadenceMeasurements {
  const normalised = text.trim().replace(/\s+/g, ' ');
  const words = wordsIn(normalised).length;

  const sentences = normalised
    .split(SENTENCE_SPLIT)
    .filter((sentence) => sentence.split(' ').filter(Boolean).length >= 2);
  const sentenceLengths = sentences.map((s) => s.split(' ').filter(Boolean).length);

  const breathGroups = normalised
    .split(BREATH_SPLIT)
    .map((group) => group.split(' ').filter(Boolean).length)
    .filter((length) => length >= 2);

  const breaks = normalised.match(BREAK_CHARS)?.length ?? 0;

  return {
    words,
    sentences: sentences.length,
    sentenceMean: round(mean(sentenceLengths), 1),
    sentenceSd: round(pstdev(sentenceLengths), 1),
    breathGroupMean: round(mean(breathGroups), 1),
    breaksPer100: words === 0 ? 0 : round((100 * breaks) / words, 2),
    emDash: (normalised.match(/—/g) ?? []).length,
    antiVoice: [],
    bookends: [],
    missingTerms: mustTerms.filter((term) => !termPattern(term).test(normalised)),
  };
}

/**
 * Score `text` against ONE talent's envelope.
 *
 * `mustTerms` are the content words the provenance owner requires to survive
 * the re-cadencing — the measured constraint from requirements §4 is that every
 * word dropped must be a function word or a synonym, and no content term is
 * lost. They are per-script, not per-talent, which is why they are an argument.
 */
export function scoreAgainst(
  text: string,
  envelope: CadenceEnvelope,
  mustTerms: string[] = [],
): CadenceScore {
  const normalised = text.trim().replace(/\s+/g, ' ');
  const measurements = measure(normalised, mustTerms);
  measurements.antiVoice = countMatches(normalised, envelope.antiVoice);
  measurements.bookends = countMatches(normalised, envelope.bookends);

  const rules: CadenceRule[] = [
    {
      key: 'length',
      label: 'length',
      pass: measurements.words >= envelope.wordsMin && measurements.words <= envelope.wordsMax,
      actual: `${measurements.words} words`,
      target: `${envelope.wordsMin}–${envelope.wordsMax}`,
    },
    {
      key: 'breath-group',
      label: 'breath group',
      pass: measurements.breathGroupMean >= envelope.breathGroupMeanMin,
      actual: `${measurements.breathGroupMean} words`,
      target: `≥ ${envelope.breathGroupMeanMin}`,
    },
    {
      key: 'break-density',
      label: 'breaks per 100 words',
      pass: measurements.breaksPer100 <= envelope.breaksPer100Max,
      actual: `${measurements.breaksPer100}`,
      target: `≤ ${envelope.breaksPer100Max}`,
    },
    {
      key: 'sentence-variation',
      label: 'sentence-length SD',
      pass: measurements.sentenceSd >= envelope.sentenceSdMin,
      actual: `${measurements.sentenceSd}`,
      target: `≥ ${envelope.sentenceSdMin}`,
    },
    {
      key: 'em-dash',
      label: 'em-dash appositives',
      pass: measurements.emDash <= envelope.emDashMax,
      actual: `${measurements.emDash}`,
      target: `≤ ${envelope.emDashMax}`,
    },
    {
      key: 'mandatory-terms',
      label: 'mandatory terms retained',
      pass: measurements.missingTerms.length === 0,
      actual:
        measurements.missingTerms.length === 0
          ? 'all'
          : `missing: ${measurements.missingTerms.join(', ')}`,
      target: '100%',
    },
    {
      key: 'anti-voice',
      label: 'anti-voice words',
      pass: measurements.antiVoice.length === 0,
      actual: measurements.antiVoice.length === 0 ? 'none' : measurements.antiVoice.join(', '),
      target: 'none',
    },
    {
      key: 'bookends',
      label: 'channel bookends in body',
      pass: measurements.bookends.length === 0,
      actual: measurements.bookends.length === 0 ? 'none' : measurements.bookends.join(', '),
      target: 'none',
    },
  ];

  return {
    pass: rules.every((rule) => rule.pass),
    measurements,
    rules,
    envelopeSource: envelope.source,
  };
}
