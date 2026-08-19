import { describe, expect, it } from 'vitest';
import { KYBERNESIS_PHASE_1, TALENTS } from '@shared/script-set';
import {
  TRIGGER_STYLE_LETTER,
  cadenceFor,
  paragraphsOf,
  provenanceOf,
  validateScriptSet,
  validateTranscript,
  validateTriggerSet,
  type Transcript,
  type TriggerSet,
} from '@shared/domain';
import { scriptSetSchema, talentSchema } from '@shared/domain-schema';

/**
 * The domain rules, and the shipped data held to them.
 *
 * `test/scripts-data.test.ts` covers the legacy flat shape the renderer still
 * reads. This file covers the model that replaces it — including the three
 * things the flat shape could not express, which is the whole reason it exists.
 */

const script01 = KYBERNESIS_PHASE_1.scripts[0];
const provenance01 = provenanceOf(script01)!;

describe('the shipped Kybernesis set', () => {
  it('is a valid domain object', () => {
    expect(scriptSetSchema.safeParse(KYBERNESIS_PHASE_1).success).toBe(true);
    expect(validateScriptSet(KYBERNESIS_PHASE_1)).toEqual([]);
  });

  it('ships all twelve, each with a provenance transcript', () => {
    expect(KYBERNESIS_PHASE_1.scripts).toHaveLength(12);
    for (const script of KYBERNESIS_PHASE_1.scripts) {
      const provenance = provenanceOf(script);
      expect(provenance, `${script.id} has no provenance transcript`).toBeDefined();
      expect(provenance!.corpus).toBe('tom-original');
      // Meaning belongs to provenance, and provenance belongs to nobody's voice.
      expect(provenance!.talentId).toBeNull();
    }
  });

  it('carries BOTH corpora for the three re-cadenced scripts', () => {
    // The gap the flat shape could not express at all. Trigger styles derived
    // from Tom's 7-word breath groups are not the same experiment as styles
    // derived from the 11-word rewrites (requirements open item 9), so both
    // have to be loadable before either result means anything.
    const withCadence = KYBERNESIS_PHASE_1.scripts.filter(
      (script) => cadenceFor(script, 'david').length > 0,
    );
    expect(withCadence.map((s) => s.n)).toEqual([1, 2, 3]);
    for (const script of withCadence) {
      const [cadence] = cadenceFor(script, 'david');
      expect(cadence.corpus).toMatch(/^v0\d-rewrite$/);
      // A cadence transcript with no talent is meaningless.
      expect(cadence.talentId).toBe('david');
    }
  });

  it('lets a cadence transcript have its own paragraph structure', () => {
    // v02 re-cadences four of Tom's paragraphs into three. If a transcript
    // borrowed the script's structure this would be unrepresentable, and the
    // trigger map would silently point at the wrong beat.
    const script02 = KYBERNESIS_PHASE_1.scripts[1];
    expect(paragraphsOf(provenanceOf(script02)!)).toHaveLength(4);
    expect(paragraphsOf(cadenceFor(script02, 'david')[0])).toHaveLength(3);
  });

  it('carries two heading levels', () => {
    // Requirements §1 needs a major AND a minor topic; the shipped flat data
    // had one level, which is why the zone model could not be built on it.
    for (const script of KYBERNESIS_PHASE_1.scripts) {
      const transcript = provenanceOf(script)!;
      expect(transcript.topics.length).toBeGreaterThanOrEqual(2);
      const minors = transcript.topics.flatMap((major) => major.minors);
      expect(minors.length).toBeGreaterThan(transcript.topics.length);
      for (const major of transcript.topics) {
        expect(major.heading.trim()).not.toBe('');
        for (const minor of major.minors) expect(minor.heading.trim()).not.toBe('');
      }
    }
  });

  it('labels its one trigger set honestly, and invents no others', () => {
    // The app never invents a trigger. Styles A and C are absent because
    // nothing has authored them — they arrive through `write_trigger_set`.
    for (const script of KYBERNESIS_PHASE_1.scripts) {
      const sets = provenanceOf(script)!.triggerSets;
      expect(sets).toHaveLength(1);
      expect(sets[0].style).toBe('compressed-concept');
      expect(TRIGGER_STYLE_LETTER[sets[0].style]).toBe('B');
      expect(sets[0].authoredBy).toBe('hand');
    }
    for (const n of [1, 2, 3]) {
      expect(cadenceFor(KYBERNESIS_PHASE_1.scripts[n - 1], 'david')[0].triggerSets).toEqual([]);
    }
  });

  it('has a summary short enough that twelve are scannable in one sitting', () => {
    // Requirements §6: "Don't give me too much brain drain on this."
    for (const script of KYBERNESIS_PHASE_1.scripts) {
      expect(script.summary.length).toBeGreaterThan(20);
      expect(script.summary.length, `${script.id} summary is a wall`).toBeLessThan(200);
    }
  });

  it('holds every landing line to the originator’s approved takeaway', () => {
    // Ported from the legacy scripts-data spec when the flat shape was retired.
    // Meaning belongs to provenance: the talent may re-voice the words, but the
    // last beat has to still land on what Tom approved.
    const norm = (value: string): string =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

    for (const script of KYBERNESIS_PHASE_1.scripts) {
      const triggers = provenanceOf(script)!.triggerSets[0].triggers;
      const landing = norm(triggers[triggers.length - 1].text);
      const takeaway = norm(script.takeaway);
      expect(takeaway.length).toBeGreaterThan(0);

      const overlap = takeaway.split(' ').filter((w) => w.length > 3 && landing.includes(w));
      expect(
        overlap.length,
        `${script.id} landing line drifted from its takeaway`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it('ships David’s envelope and nobody else’s', () => {
    // AITLDR has a verbal style but no MEASURED envelope. An unmeasured talent
    // holding borrowed thresholds is worse than no talent at all, because the
    // gate then reports a confident wrong answer (requirements §9, brief §3).
    expect(TALENTS.map((t) => t.id)).toEqual(['david']);
    expect(talentSchema.safeParse(TALENTS[0]).success).toBe(true);
    expect(TALENTS[0].envelope.source).toMatch(/measured/i);
  });
});

/* ------------------------------------------------------------------ *
 * The map rules — now scoped to the trigger set, which is the correction
 * ------------------------------------------------------------------ */

const withTriggers = (triggers: TriggerSet['triggers']): TriggerSet => ({
  style: 'loose-keywords',
  authoredBy: 'agent',
  triggers,
});

const paragraphIds = paragraphsOf(provenance01).map((p) => p.id);

describe('the trigger→paragraph map', () => {
  it('accepts a map that dwells and spans the script', () => {
    const set = withTriggers([
      { id: 'g1', text: 'open', paragraphId: paragraphIds[0] },
      { id: 'g2', text: 'still here', paragraphId: paragraphIds[0] },
      {
        id: 'g3',
        text: 'land',
        paragraphId: paragraphIds[paragraphIds.length - 1],
      },
    ]);
    expect(validateTriggerSet(set, provenance01)).toEqual([]);
  });

  it('refuses a map that rewinds', () => {
    // The transcript may dwell on a paragraph; it may never rewind. A backwards
    // map means the follower column jumps up while the talent moves down.
    const set = withTriggers([
      { id: 'g1', text: 'open', paragraphId: paragraphIds[0] },
      { id: 'g2', text: 'ahead', paragraphId: paragraphIds[2] },
      { id: 'g3', text: 'back', paragraphId: paragraphIds[1] },
      {
        id: 'g4',
        text: 'land',
        paragraphId: paragraphIds[paragraphIds.length - 1],
      },
    ]);
    expect(validateTriggerSet(set, provenance01).map((v) => v.message)).toContain(
      'the map goes backwards — it must be non-decreasing',
    );
  });

  it('refuses a map that points at a paragraph in another transcript', () => {
    // The bug an index-based map cannot even detect.
    const set = withTriggers([
      { id: 'g1', text: 'open', paragraphId: paragraphIds[0] },
      { id: 'g2', text: 'nowhere', paragraphId: 'p99' },
    ]);
    expect(validateTriggerSet(set, provenance01)[0].message).toMatch(/not in this transcript/);
  });

  it('refuses a map that does not span the script', () => {
    // Otherwise a paragraph is unreachable by stepping, and the talent finds
    // that out mid-take.
    const short = withTriggers([
      { id: 'g1', text: 'open', paragraphId: paragraphIds[0] },
      { id: 'g2', text: 'stop early', paragraphId: paragraphIds[1] },
    ]);
    expect(validateTriggerSet(short, provenance01).map((v) => v.message)).toContain(
      'the last trigger must land on the last paragraph',
    );

    const late = withTriggers([
      { id: 'g1', text: 'start late', paragraphId: paragraphIds[1] },
      {
        id: 'g2',
        text: 'land',
        paragraphId: paragraphIds[paragraphIds.length - 1],
      },
    ]);
    expect(validateTriggerSet(late, provenance01).map((v) => v.message)).toContain(
      'the first trigger must open on the first paragraph',
    );
  });

  it('lets two styles over one transcript have different step counts', () => {
    // This is the correction gap 1 asked for. With the map on the SCRIPT, style
    // A taking fourteen steps over the same four paragraphs style C crosses in
    // three was unrepresentable.
    const long = withTriggers(
      paragraphIds.flatMap((id, index) => [
        { id: `a${index}a`, text: `${index} first half`, paragraphId: id },
        { id: `a${index}b`, text: `${index} second half`, paragraphId: id },
      ]),
    );
    const short = withTriggers([
      { id: 'c1', text: 'the gap', paragraphId: paragraphIds[0] },
      {
        id: 'c2',
        text: 'start small',
        paragraphId: paragraphIds[paragraphIds.length - 1],
      },
    ]);

    expect(validateTriggerSet(long, provenance01)).toEqual([]);
    expect(validateTriggerSet(short, provenance01)).toEqual([]);
    expect(long.triggers.length).not.toBe(short.triggers.length);
  });
});

describe('provenance and cadence are distinct things', () => {
  const base = (): Transcript => JSON.parse(JSON.stringify(provenance01)) as Transcript;

  it('refuses a cadence transcript with no talent', () => {
    const orphan = { ...base(), kind: 'cadence' as const, talentId: null };
    expect(validateTranscript(orphan).map((v) => v.message)).toContain(
      'a cadence transcript must name the talent it was voiced for',
    );
  });

  it('refuses a provenance transcript that claims a voice', () => {
    const voiced = { ...base(), talentId: 'david' };
    expect(validateTranscript(voiced).map((v) => v.message)).toContain(
      'a provenance transcript belongs to no talent — meaning is not voiced',
    );
  });

  it('refuses two trigger sets in the same style', () => {
    const doubled = base();
    doubled.triggerSets = [doubled.triggerSets[0], doubled.triggerSets[0]];
    expect(validateTranscript(doubled).map((v) => v.message)).toContain(
      'two trigger sets share the style "compressed-concept"',
    );
  });

  it('refuses duplicate paragraph ids', () => {
    // Duplicates would make the map ambiguous rather than wrong, which is worse
    // — nothing errors, the follower column just lands somewhere plausible.
    const duplicated = base();
    duplicated.topics[1].minors[0].paragraphs[0].id =
      duplicated.topics[0].minors[0].paragraphs[0].id;
    expect(
      validateTranscript(duplicated).some((v) => /duplicate paragraph id/.test(v.message)),
    ).toBe(true);
  });

  it('refuses a script with two provenance transcripts', () => {
    const twoBaselines = {
      ...script01,
      transcripts: [provenance01, { ...provenance01, id: 'other' }],
    };
    expect(
      validateScriptSet({ ...KYBERNESIS_PHASE_1, scripts: [twoBaselines] }).map((v) => v.message),
    ).toContain('a script has at most one provenance transcript');
  });
});
