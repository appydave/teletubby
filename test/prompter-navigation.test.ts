import { beforeEach, describe, expect, it } from 'vitest';
import { KYBERNESIS_PHASE_1 } from '@shared/script-set';
import { paragraphsOf } from '@shared/domain';
import {
  RECORDING_SET,
  activeTriggers,
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

  it('announces a corpus change too, and resets the beat', () => {
    s().selectScript(SCRIPT_01);
    s().selectTranscript('tom-original');
    s().stepNext();
    s().selectTranscript('v01-rewrite');

    // A cadence transcript is a different document, not a translation — v02
    // turns four of Tom's paragraphs into three, so there is no honest
    // correspondence to carry across.
    expect(s().step).toBe(0);
    expect(s().cue?.label).toBe('Cadence');
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
