import { beforeEach, describe, expect, it } from 'vitest';
import { KYBERNESIS_PHASE_1 } from '@shared/script-set';
import { paragraphsOf, type ScriptSet } from '@shared/domain';
import {
  RECORDING_SET,
  activeTriggers,
  correspondingParagraphId,
  currentMajor,
  currentMinor,
  currentParagraph,
  currentParagraphId,
  currentScript,
  currentTranscript,
  isLastStep,
  nextScript,
  rankOf,
  useProm,
  zoneOrder,
} from '../src/renderer/src/store';

/**
 * The navigation and zone rules, driven through the store with no DOM.
 *
 * Every rule here is a bug that already happened once, or a requirement that
 * would be discovered broken mid-take. The store is where they live precisely
 * so they can be asserted without rendering anything — a component may render
 * state, it may not decide what a keypress means.
 */

const SCRIPT_01 = 'kybernesis-phase-1/01';
const SCRIPT_02 = 'kybernesis-phase-1/02';
const LAST_SCRIPT = 'kybernesis-phase-1/12';

const s = () => useProm.getState();

const reset = (): void => {
  useProm.setState({
    set: null,
    scriptId: null,
    transcriptId: null,
    style: null,
    step: 0,
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
  });
  // The data is injected, not fetched. The store never talks to a transport —
  // that is the adapter's job — which is what keeps these rules testable.
  s().load(JSON.parse(JSON.stringify(KYBERNESIS_PHASE_1)));
};

beforeEach(reset);

describe('loading', () => {
  it('opens on the first script, with a transcript and a style it actually has', () => {
    expect(s().scriptId).toBe(SCRIPT_01);
    expect(currentTranscript(s())).toBeDefined();
    expect(activeTriggers(s()).length).toBeGreaterThan(0);
  });

  it('prefers the talent’s cadence transcript once it can be driven', () => {
    // Script 01's rewrite now carries all three styles, so it is both the
    // better opening choice AND a usable one.
    expect(currentTranscript(s())?.kind).toBe('cadence');
    expect(currentTranscript(s())?.corpus).toBe('v01-rewrite');
    expect(activeTriggers(s()).length).toBeGreaterThan(0);
  });

  it('never opens on a transcript with no triggers authored', () => {
    // Script 02 HAS a cadence transcript and it would otherwise be preferred —
    // but nobody has authored trigger words for it, and the app never invents
    // them. Opening there would hand the talent an empty column 2, which is
    // the product missing. So it opens on Tom's original instead.
    s().selectScript(SCRIPT_02);
    expect(currentScript(s())?.transcripts.some((t) => t.kind === 'cadence')).toBe(true);
    expect(currentTranscript(s())?.kind).toBe('provenance');
    expect(activeTriggers(s()).length).toBeGreaterThan(0);
  });

  it('falls back to provenance for a script with no cadence version', () => {
    s().selectScript('kybernesis-phase-1/07');
    expect(currentTranscript(s())?.kind).toBe('provenance');
  });
});

describe('stepping is clamped inside its unit', () => {
  beforeEach(() => s().selectScript(SCRIPT_01));

  it('advances one beat at a time', () => {
    s().selectTranscript('tom-original');
    s().stepNext();
    expect(s().step).toBe(1);
    s().stepNext();
    expect(s().step).toBe(2);
  });

  it('never steps past the last beat, and never crosses into the next script', () => {
    s().selectTranscript('tom-original');
    const last = activeTriggers(s()).length - 1;
    for (let i = 0; i < last + 10; i++) s().stepNext();

    expect(s().step).toBe(last);
    // The boundary is a thing you step over deliberately, never something that
    // happens to you. In the original prompter this silently advanced the
    // script and David got lost mid-take.
    expect(s().scriptId).toBe(SCRIPT_01);
    expect(s().nudge).toBeGreaterThan(0);
  });

  it('never steps before the first beat', () => {
    s().selectTranscript('tom-original');
    for (let i = 0; i < 5; i++) s().stepPrev();
    expect(s().step).toBe(0);
  });

  it('refuses to move at all when a transcript has no triggers authored', () => {
    // Scripts 02 and 03 still ship a cadence transcript with no trigger set —
    // the app never invents one. Stepping must be inert rather than throwing
    // or landing nowhere.
    s().selectScript(SCRIPT_02);
    s().selectTranscript('v02-rewrite');
    expect(activeTriggers(s())).toEqual([]);
    s().stepNext();
    expect(s().step).toBe(0);
    expect(s().nudge).toBe(0);
  });
});

describe('every boundary crossing announces itself', () => {
  it('raises a cue card on any script change', () => {
    s().selectScript(SCRIPT_02);
    expect(s().cue?.title).toBe('Why AI pilots become dead ends');
    expect(s().cue?.label).toBe('02');
  });

  it('raises a new cue on a rapid second change, so the timer restarts', () => {
    s().selectScript(SCRIPT_02);
    const first = s().cue?.token ?? 0;
    s().selectScript('kybernesis-phase-1/03');
    expect(s().cue?.token).toBe(first + 1);
  });

  it('resets the beat on a script change — no half-remembered position', () => {
    s().selectTranscript('tom-original');
    s().stepNext();
    s().stepNext();
    s().selectScript(SCRIPT_02);
    expect(s().step).toBe(0);
  });

  it('goes to the next script, and refuses at the end of the set', () => {
    s().selectScript(LAST_SCRIPT);
    expect(nextScript(s())).toBeUndefined();
    s().goToNextScript();
    expect(s().scriptId).toBe(LAST_SCRIPT);
  });

  it('KEEPS the paragraph on a corpus change and stays SILENT about it', () => {
    // David A/B'd script 04 paragraph by paragraph and every flip dropped him
    // to paragraph 1 (2026-08-30). Paragraph 2 in Tom's must be the SAME TOPIC
    // in the rewrite, or the comparison he flipped to make is lost.
    s().selectScript(SCRIPT_01);
    s().selectTranscript('tom-original');
    useProm.setState({ visible: ['paragraph'], driven: 'paragraph' });
    s().stepNext(); // one paragraph, because paragraph is driven (rule 1)
    const tom = currentTranscript(s())!;
    const from = currentParagraphId(s())!;
    const minor = currentMinor(s())!.id;
    expect(from).not.toBe('p1');
    useProm.setState({ cue: null });

    s().selectTranscript('v01-rewrite');
    const rewrite = currentTranscript(s())!;
    expect(rewrite.corpus).toBe('v01-rewrite');
    expect(currentParagraphId(s())).toBe(correspondingParagraphId(tom, from, rewrite));
    expect(currentMinor(s())?.id).toBe(minor);
    // No cue. Switching corpus is an A/B comparison, and a card over the top
    // hides the very difference the talent flipped across to see (B437).
    expect(s().cue).toBeNull();

    // And back again — still on the same beat, not the top.
    s().selectTranscript('tom-original');
    expect(currentParagraphId(s())).toBe(from);
  });

  it('a live rewrite that DELETES the current topic lands at the END, visibly', () => {
    // The vanished case first: this is where a mistake moves the talent
    // somewhere silently, which is the defect being fixed. Tom's p3 owns minor
    // t2.1 under major t2; the rewrite removes that whole major, so neither the
    // paragraph nor its topic survives. The talent must land at the END — the
    // end card is the visible statement — never silently at the top.
    useProm.setState({ visible: ['paragraph'], driven: 'paragraph' });
    s().selectScript(SCRIPT_02);
    s().selectTranscript('tom-original');
    s().stepNext();
    s().stepNext();
    expect(currentParagraphId(s())).toBe('p3');

    const rewritten = structuredClone(KYBERNESIS_PHASE_1);
    const script = rewritten.scripts.find((x) => x.id === SCRIPT_02)!;
    const tom = script.transcripts.find((t) => t.corpus === 'tom-original')!;
    tom.topics = tom.topics.filter((major) => major.id !== 't2');
    for (const set of tom.triggerSets)
      set.triggers = set.triggers.filter((t) => t.paragraphId !== 'p3');
    s().refresh(rewritten);

    expect(s().scriptId).toBe(SCRIPT_02);
    expect(isLastStep(s())).toBe(true);
    expect(currentParagraphId(s())).not.toBe('p1');
  });

  it('a live rewrite that INSERTS a trigger keeps the talent on their paragraph', () => {
    // The drift case: the old refresh kept the step INDEX, so a trigger
    // prepended to the set moved the talent one beat back without a word.
    s().selectScript(SCRIPT_01);
    s().selectTranscript('tom-original');
    useProm.setState({ visible: ['paragraph'], driven: 'paragraph' });
    s().stepNext();
    const before = currentParagraphId(s())!;
    expect(before).not.toBe('p1');

    const grown = structuredClone(KYBERNESIS_PHASE_1);
    const script = grown.scripts.find((x) => x.id === SCRIPT_01)!;
    const tom = script.transcripts.find((t) => t.corpus === 'tom-original')!;
    tom.triggerSets[0]!.triggers.unshift({ text: 'NEW HOOK', paragraphId: 'p1' });
    useProm.setState({ cue: null }); // clear the script-change cue from setup
    s().refresh(grown);

    expect(currentParagraphId(s())).toBe(before);
    // And no cue: the data changed underneath, the talent crossed nothing.
    expect(s().cue).toBeNull();
  });

  it('restores the remembered position — script, corpus, style, paragraph', () => {
    // Recording day, 2026-08-31: every dev reload dropped David to the top of
    // script 01. The workspace now recalls his place; `load` resolves it.
    useProm.setState({
      pendingPosition: {
        setId: 'kybernesis-phase-1',
        scriptId: SCRIPT_02,
        transcriptId: 'tom-original',
        style: 'compressed-concept',
        paragraphId: 'p3',
      },
    });
    s().load(KYBERNESIS_PHASE_1);

    expect(s().scriptId).toBe(SCRIPT_02);
    expect(currentTranscript(s())?.corpus).toBe('tom-original');
    expect(s().style).toBe('compressed-concept');
    expect(currentParagraphId(s())).toBe('p3');
    // Consumed: a later data refresh must not re-teleport the talent.
    expect(s().pendingPosition).toBeNull();
  });

  it('a remembered position for a VANISHED paragraph lands at the END, visibly', () => {
    // The restore twin of the corpus-switch rule: a paragraph that no longer
    // exists must not silently become paragraph 1 — the end card is a visible
    // statement that the remembered place has nowhere to go.
    useProm.setState({
      pendingPosition: {
        setId: 'kybernesis-phase-1',
        scriptId: SCRIPT_02,
        transcriptId: 'tom-original',
        style: 'compressed-concept',
        paragraphId: 'p999',
      },
    });
    s().load(KYBERNESIS_PHASE_1);

    expect(s().scriptId).toBe(SCRIPT_02);
    expect(isLastStep(s())).toBe(true);
  });

  it('a remembered position whose ids all vanished falls back to the top, honestly', () => {
    useProm.setState({
      pendingPosition: {
        setId: 'kybernesis-phase-1',
        scriptId: 'kybernesis-phase-1/99',
        transcriptId: 'gone',
        style: null,
        paragraphId: null,
      },
    });
    s().load(KYBERNESIS_PHASE_1);
    expect(s().scriptId).toBe(SCRIPT_01);
    expect(s().step).toBe(0);
  });

  it('maps by TOPIC at the ragged edge, never by paragraph index', () => {
    // v02 re-cadences four of Tom's paragraphs into three: t1.1 + t1.2 fold
    // into one. A flat index would put Tom's p3 (t2.1) on the rewrite's p3
    // (t3.1) — a different topic, silently.
    const script = KYBERNESIS_PHASE_1.scripts.find((x) => x.id === SCRIPT_02)!;
    const tom = script.transcripts.find((t) => t.corpus === 'tom-original')!;
    const rewrite = script.transcripts.find((t) => t.corpus === 'v02-rewrite')!;
    expect(paragraphsOf(tom).length).toBe(4);
    expect(paragraphsOf(rewrite).length).toBe(3);

    expect(correspondingParagraphId(tom, 'p1', rewrite)).toBe('p1'); // t1.1 → t1.1
    expect(correspondingParagraphId(tom, 'p2', rewrite)).toBe('p1'); // t1.2 folded → major t1
    expect(correspondingParagraphId(tom, 'p3', rewrite)).toBe('p2'); // t2.1 → t2.1
    expect(correspondingParagraphId(tom, 'p4', rewrite)).toBe('p3'); // t3.1 → t3.1
    // And back: the rewrite's p2 is Tom's p3, not Tom's p2.
    expect(correspondingParagraphId(rewrite, 'p2', tom)).toBe('p3');
  });

  it('lands on the LAST paragraph — visibly, the end card — when no topic matches', () => {
    const script = KYBERNESIS_PHASE_1.scripts.find((x) => x.id === SCRIPT_02)!;
    const tom = script.transcripts.find((t) => t.corpus === 'tom-original')!;
    const alien: typeof tom = {
      ...tom,
      id: 'alien',
      corpus: 'alien',
      topics: [
        {
          id: 'zz',
          heading: 'Elsewhere',
          minors: [
            { id: 'zz.1', heading: 'a', paragraphs: [{ id: 'q1', text: 'one' }] },
            { id: 'zz.2', heading: 'b', paragraphs: [{ id: 'q2', text: 'two' }] },
          ],
        },
      ],
    };
    // Not paragraph 1: a silent reset to the top is the bug this replaces.
    expect(correspondingParagraphId(tom, 'p3', alien)).toBe('q2');
    // No origin at all → the top, honestly.
    expect(correspondingParagraphId(undefined, null, alien)).toBe('q1');
  });
});

describe('zones stay aligned as the talent moves', () => {
  beforeEach(() => {
    s().selectScript(SCRIPT_01);
    s().selectTranscript('tom-original');
  });

  it('derives paragraph, minor and major from the same one position', () => {
    // Rule 1 is structural: there is no second cursor that could drift.
    for (let step = 0; step < activeTriggers(s()).length; step++) {
      useProm.setState({ step });
      const id = currentParagraphId(s());
      expect(id).toBeTruthy();
      expect(currentParagraph(s())?.id).toBe(id);
      expect(currentMinor(s())?.paragraphs.some((p) => p.id === id)).toBe(true);
      expect(currentMajor(s())?.minors.some((m) => m.paragraphs.some((p) => p.id === id))).toBe(
        true,
      );
    }
  });

  it('reads the trigger→paragraph map, never a proportional guess', () => {
    const transcript = currentTranscript(s())!;
    const ids = paragraphsOf(transcript).map((p) => p.id);
    const triggers = activeTriggers(s());

    // Eight triggers over four paragraphs: a positional scheme would put beat 2
    // on paragraph 2. The authored map keeps it on paragraph 1.
    expect(triggers.length).toBeGreaterThan(ids.length);
    useProm.setState({ step: 1 });
    expect(currentParagraphId(s())).toBe(ids[0]);
  });

  it('never rewinds the transcript while the talent moves forward', () => {
    const order = paragraphsOf(currentTranscript(s())!).map((p) => p.id);
    let previous = -1;
    for (let step = 0; step < activeTriggers(s()).length; step++) {
      useProm.setState({ step });
      const position = order.indexOf(currentParagraphId(s())!);
      expect(position).toBeGreaterThanOrEqual(previous);
      previous = position;
    }
  });
});

describe('the talent chooses which zones are on screen', () => {
  it('supports every combination the requirements name', () => {
    // major+minor · minor+paragraph · any single zone · all of the recording set
    const combinations: (typeof RECORDING_SET)[number][][] = [
      ['major', 'minor'],
      ['minor', 'paragraph'],
      ['triggers'],
      ['major'],
      ['major', 'minor', 'triggers', 'paragraph'],
    ];
    for (const combination of combinations) {
      useProm.setState({ visible: [...combination], driven: combination[0] });
      expect(zoneOrder(s()).slice().sort()).toEqual([...combination].sort());
    }
  });

  it('refuses to hide the last visible zone', () => {
    useProm.setState({ visible: ['triggers'], driven: 'triggers' });
    s().toggleZone('triggers');
    // An empty stage is not an arrangement, it is a broken app mid-take.
    expect(s().visible).toEqual(['triggers']);
  });

  it('moves the strong marker when the driven zone is hidden', () => {
    useProm.setState({ visible: ['triggers', 'paragraph'], driven: 'triggers' });
    s().toggleZone('triggers');
    // Driving something you cannot see is the alignment bug wearing a hat.
    expect(s().visible).toEqual(['paragraph']);
    expect(s().driven).toBe('paragraph');
    expect(s().visible).toContain(s().driven);
  });

  it('keeps a stable canonical order as zones come and go', () => {
    useProm.setState({ visible: ['paragraph'], driven: 'paragraph' });
    s().toggleZone('major');
    s().toggleZone('triggers');
    expect(s().visible).toEqual(['major', 'triggers', 'paragraph']);
  });

  it('refuses to drive a zone that is not on screen', () => {
    useProm.setState({ visible: ['triggers'], driven: 'triggers' });
    s().setDriven('major');
    expect(s().driven).toBe('triggers');
  });
});

describe('layout is subordinate to camera position', () => {
  it('puts the driven zone nearest the lens, on either side', () => {
    useProm.setState({
      visible: ['major', 'minor', 'triggers', 'paragraph'],
      driven: 'triggers',
      camera: 'left',
    });
    expect(zoneOrder(s())[0]).toBe('triggers');

    useProm.setState({ camera: 'right' });
    expect(zoneOrder(s()).at(-1)).toBe('triggers');
  });

  it('holds for EVERY zone as the driven one, on both sides', () => {
    // §2 is the constraint everything bends to, so it cannot hold only for the
    // arrangement someone happened to test.
    for (const driven of RECORDING_SET) {
      useProm.setState({ visible: [...RECORDING_SET], driven, camera: 'left' });
      expect(zoneOrder(s())[0], `${driven} on a left camera`).toBe(driven);

      useProm.setState({ camera: 'right' });
      expect(zoneOrder(s()).at(-1), `${driven} on a right camera`).toBe(driven);
    }
  });

  it('shows every visible zone exactly once, whatever the arrangement', () => {
    for (const driven of RECORDING_SET) {
      for (const camera of ['left', 'right'] as const) {
        useProm.setState({ visible: [...RECORDING_SET], driven, camera });
        const order = zoneOrder(s());
        expect(new Set(order).size).toBe(order.length);
        expect(order).toHaveLength(RECORDING_SET.length);
      }
    }
  });

  it('opens the skim surface from the edge away from the lens', () => {
    s().setCamera('left');
    // It must never slide across the zone the talent is looking at.
    expect(s().transcriptEdge).toBe('right');
    s().setCamera('right');
    expect(s().transcriptEdge).toBe('left');
  });

  it('does not move the driven zone when the skim surface opens', () => {
    useProm.setState({ visible: [...RECORDING_SET], driven: 'triggers', camera: 'right' });
    const before = zoneOrder(s());
    s().toggleTranscript();
    // It overlays rather than displacing — displacing would push the driven
    // zone away from the lens, which §2 forbids.
    expect(s().transcriptOpen).toBe(true);
    expect(zoneOrder(s())).toEqual(before);
  });
});

describe('resizing the seam between zones', () => {
  // David asked for this twice in one take, and worked around its absence by
  // shrinking the whole window (B437).
  beforeEach(() => {
    useProm.setState({
      visible: [...RECORDING_SET],
      driven: 'triggers',
      weights: { major: 1, minor: 1, triggers: 2, paragraph: 2 },
    });
  });

  it('moves weight from one zone to its neighbour, keeping the total', () => {
    const before = Object.values(s().weights).reduce((a, b) => a + b, 0);
    s().resizeZones('triggers', 'paragraph', 120);
    expect(s().weights.triggers).toBeGreaterThan(2);
    expect(s().weights.paragraph).toBeLessThan(2);
    expect(Object.values(s().weights).reduce((a, b) => a + b, 0)).toBeCloseTo(before, 10);
  });

  it('refuses to squeeze a zone to nothing', () => {
    // A zone dragged to zero width is one the talent hid by accident mid-take,
    // and hiding is what the zone toggles are for.
    for (let i = 0; i < 200; i++) s().resizeZones('triggers', 'paragraph', 100);
    expect(s().weights.paragraph).toBeGreaterThanOrEqual(0.35);
    expect(s().weights.triggers).toBeLessThanOrEqual(3.65);
  });

  it('is reversible', () => {
    s().resizeZones('major', 'minor', 90);
    s().resizeZones('major', 'minor', -90);
    expect(s().weights.major).toBeCloseTo(1, 10);
    expect(s().weights.minor).toBeCloseTo(1, 10);
  });
});

describe('exactly one strong marker', () => {
  it('ranks the driven zone strong and every follower quiet', () => {
    useProm.setState({ visible: [...RECORDING_SET], driven: 'minor' });
    const ranks = RECORDING_SET.map((zone) => rankOf(s().driven, zone));
    expect(ranks.filter((r) => r === 'driven')).toHaveLength(1);
    expect(rankOf(s().driven, 'minor')).toBe('driven');
  });

  it('never shows two strong markers in ANY combination', () => {
    // Two equally-loud markers read as two competing claims about where you
    // are. This has to hold for every arrangement, not the common one.
    for (const driven of RECORDING_SET) {
      useProm.setState({ visible: [...RECORDING_SET], driven });
      const strong = zoneOrder(s()).filter((zone) => rankOf(s().driven, zone) === 'driven');
      expect(strong, `driven: ${driven}`).toHaveLength(1);
    }
  });
});

describe('switching trigger style keeps your place', () => {
  beforeEach(() => {
    s().selectScript(SCRIPT_01);
    s().selectTranscript('tom-original');
  });

  it('lands on the same PARAGRAPH, not the same index', () => {
    // Real authored data: style A takes 17 steps over the same four paragraphs
    // that style C crosses in five. Holding the index across that would drop
    // the talent somewhere else in the script entirely.
    const ids = paragraphsOf(currentTranscript(s())!).map((p) => p.id);
    s().selectStyle('near-verbatim');

    const target = activeTriggers(s()).findIndex((t) => t.paragraphId === ids[2]);
    expect(target).toBeGreaterThan(0);
    useProm.setState({ step: target });
    expect(currentParagraphId(s())).toBe(ids[2]);

    s().selectStyle('loose-keywords');

    expect(s().style).toBe('loose-keywords');
    // The index changed; the place did not.
    expect(currentParagraphId(s())).toBe(ids[2]);
    expect(s().step).not.toBe(target);
  });

  it('refuses a style the transcript does not have', () => {
    // Script 02's provenance carries only style B.
    s().selectScript(SCRIPT_02);
    s().selectTranscript('tom-original');
    const before = s().style;
    s().selectStyle('near-verbatim');
    expect(s().style).toBe(before);
  });
});

describe('the end card', () => {
  it('goes live only on the last beat', () => {
    s().selectScript(SCRIPT_01);
    s().selectTranscript('tom-original');
    expect(isLastStep(s())).toBe(false);
    useProm.setState({ step: activeTriggers(s()).length - 1 });
    expect(isLastStep(s())).toBe(true);
  });

  it('names what comes next', () => {
    s().selectScript(SCRIPT_01);
    expect(nextScript(s())?.title).toBe('Why AI pilots become dead ends');
  });
});

describe('the driven zone sets the scale of movement', () => {
  /**
   * The bug David hit on the first real take: driving Paragraph, `↓` walked the
   * trigger set, so it took five presses to advance one paragraph (B437).
   */
  beforeEach(() => {
    s().selectScript(SCRIPT_01);
    s().selectTranscript('tom-original');
  });

  it('advances one PARAGRAPH per press when driving the paragraph', () => {
    useProm.setState({ visible: ['paragraph'], driven: 'paragraph', step: 0 });
    const ids = paragraphsOf(currentTranscript(s())!).map((p) => p.id);

    expect(currentParagraphId(s())).toBe(ids[0]);
    s().stepNext();
    expect(currentParagraphId(s())).toBe(ids[1]);
    s().stepNext();
    expect(currentParagraphId(s())).toBe(ids[2]);
  });

  it('still advances one TRIGGER per press when driving the triggers', () => {
    useProm.setState({ driven: 'triggers', step: 0 });
    s().stepNext();
    expect(s().step).toBe(1);
  });

  it('advances one MAJOR topic per press when driving the major', () => {
    useProm.setState({ visible: ['major'], driven: 'major', step: 0 });
    const first = currentMajor(s())?.id;
    s().stepNext();
    expect(currentMajor(s())?.id).not.toBe(first);
  });

  it('lands on the FIRST beat of a unit when stepping back into it', () => {
    // Stepping back into a paragraph puts the talent at its start, never at
    // whatever beat they happened to leave from.
    useProm.setState({ driven: 'paragraph', step: 0 });
    s().stepNext();
    const secondParagraph = currentParagraphId(s());
    const landed = s().step;

    useProm.setState({ driven: 'triggers' });
    s().stepNext();
    s().stepNext();
    expect(currentParagraphId(s())).toBe(secondParagraph);

    useProm.setState({ driven: 'paragraph' });
    s().stepPrev();
    s().stepNext();
    expect(s().step).toBe(landed);
  });

  it('clamps at the last unit and nudges, whatever the scale', () => {
    for (const driven of RECORDING_SET) {
      useProm.setState({ driven, step: 0, nudge: 0 });
      for (let i = 0; i < 40; i++) s().stepNext();
      expect(s().scriptId, `${driven} crossed a script boundary`).toBe(SCRIPT_01);
      expect(s().nudge, `${driven} never nudged`).toBeGreaterThan(0);
      expect(isLastStep(s()), `${driven} did not reach the end`).toBe(true);
    }
  });

  it('never steps before the first beat, whatever the scale', () => {
    for (const driven of RECORDING_SET) {
      useProm.setState({ driven, step: 0 });
      for (let i = 0; i < 5; i++) s().stepPrev();
      expect(s().step).toBe(0);
    }
  });

  it('reaches every paragraph when driving the paragraph', () => {
    // A coarser scale must not make part of the script unreachable.
    useProm.setState({ driven: 'paragraph', step: 0 });
    const ids = paragraphsOf(currentTranscript(s())!).map((p) => p.id);
    const seen = [currentParagraphId(s())];
    for (let i = 0; i < 20 && !isLastStep(s()); i++) {
      s().stepNext();
      seen.push(currentParagraphId(s()));
    }
    expect([...new Set(seen)]).toEqual(ids);
  });
});

describe('a refresh must never move the talent', () => {
  /**
   * This fires when an agent writes through the control API — which is the
   * point of the app being drivable, and also the moment it could ruin a take.
   * Rewriting a trigger word must not yank the person on camera somewhere else.
   */
  const edited = (mutate: (set: ScriptSet) => void): ScriptSet => {
    const copy: ScriptSet = JSON.parse(JSON.stringify(s().set));
    mutate(copy);
    return copy;
  };

  beforeEach(() => {
    s().selectScript(SCRIPT_02);
    s().selectTranscript('tom-original');
    s().stepNext();
    s().stepNext();
    useProm.setState({ cue: null });
  });

  it('holds the script, corpus, style and beat when data changes elsewhere', () => {
    const before = {
      scriptId: s().scriptId,
      transcriptId: s().transcriptId,
      style: s().style,
      step: s().step,
    };

    s().refresh(
      edited((set) => {
        set.scripts[0].title = 'Rewritten by an agent';
      }),
    );

    expect({
      scriptId: s().scriptId,
      transcriptId: s().transcriptId,
      style: s().style,
      step: s().step,
    }).toEqual(before);
  });

  it('does not flash a cue card when nothing moved', () => {
    // A cue announces a boundary the TALENT crossed. Data changing underneath
    // is not a crossing, and a card on every keystroke of an agent's edit is
    // noise on camera.
    s().refresh(edited((set) => void (set.scripts[0].summary = 'edited')));
    expect(s().cue).toBeNull();
  });

  it('marks a corpus that ARRIVES so absence and arrival cannot look alike', () => {
    // David sat on TOM-ORIGINAL for an hour believing v07-rewrite had not
    // landed; it was one click away as an unmarked grey chip. The swap stays
    // silent; the fact of arrival must not.
    const scriptId = s().scriptId!;
    s().refresh(
      edited((set) => {
        const script = set.scripts.find((x) => x.id === scriptId)!;
        script.transcripts.push({
          ...JSON.parse(JSON.stringify(script.transcripts[0])),
          id: 'v-new-rewrite',
          corpus: 'v-new-rewrite',
        });
      }),
    );
    expect(s().freshTranscripts[scriptId]).toEqual(['v-new-rewrite']);

    // Selecting it is what clears the mark.
    s().selectTranscript('v-new-rewrite');
    expect(s().freshTranscripts[scriptId]).toBeUndefined();
  });

  it('does NOT mark the transcript the talent is looking at', () => {
    // Its changes are already in front of them — and selecting is what clears
    // a mark, so a mark on the selected one could never clear.
    const scriptId = s().scriptId!;
    const transcriptId = s().transcriptId!;
    s().refresh(
      edited((set) => {
        const script = set.scripts.find((x) => x.id === scriptId)!;
        const mine = script.transcripts.find((t) => t.id === transcriptId)!;
        mine.source = 'edited-under-their-eyes';
      }),
    );
    expect(s().freshTranscripts[scriptId]).toBeUndefined();
  });

  it('picks up an agent’s new trigger words at the same beat', () => {
    const step = s().step;
    s().refresh(
      edited((set) => {
        const transcript = set.scripts[1].transcripts.find((t) => t.id === 'tom-original')!;
        transcript.triggerSets[0].triggers[step].text = 'REWRITTEN MID-TAKE';
      }),
    );
    expect(s().step).toBe(step);
    expect(activeTriggers(s())[step].text).toBe('REWRITTEN MID-TAKE');
  });

  it('clamps rather than resets when the trigger set gets shorter', () => {
    // A shortened set is not a reason to send the talent back to the top.
    s().refresh(
      edited((set) => {
        const transcript = set.scripts[1].transcripts.find((t) => t.id === 'tom-original')!;
        transcript.triggerSets[0].triggers = transcript.triggerSets[0].triggers.slice(0, 2);
      }),
    );
    expect(s().step).toBe(1);
  });

  it('falls back to a style that still exists, keeping the transcript', () => {
    s().refresh(
      edited((set) => {
        const transcript = set.scripts[1].transcripts.find((t) => t.id === 'tom-original')!;
        transcript.triggerSets[0].style = 'loose-keywords';
      }),
    );
    expect(s().transcriptId).toBe('tom-original');
    expect(s().style).toBe('loose-keywords');
  });

  it('announces it, and only then, if the talent’s script was deleted', () => {
    s().refresh(edited((set) => void set.scripts.splice(1, 1)));
    // This one genuinely moved them, so it has to say so.
    expect(s().scriptId).toBe(SCRIPT_01);
    expect(s().cue).not.toBeNull();
  });

  it('loads from scratch if nothing was selected yet', () => {
    useProm.setState({ scriptId: null });
    s().refresh(JSON.parse(JSON.stringify(KYBERNESIS_PHASE_1)));
    expect(s().scriptId).toBe(SCRIPT_01);
  });
});

describe('presentation toggles', () => {
  it('mirrors, for prompter glass', () => {
    s().toggleMirror();
    expect(s().mirror).toBe(true);
  });

  it('has three named text presets and no stepper', () => {
    s().setText('stage');
    expect(s().text).toBe('stage');
  });

  it('keeps the script and its data intact through every toggle', () => {
    const before = currentScript(s())?.id;
    s().toggleMirror();
    s().toggleFocus();
    s().setText('large');
    s().toggleTranscript();
    expect(currentScript(s())?.id).toBe(before);
  });
});
