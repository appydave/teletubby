import { beforeEach, describe, expect, it } from 'vitest';
import { KYBERNESIS_PHASE_1 } from '@shared/script-set';
import { DEFAULT_LAYOUT, type Rig, type RigLayout } from '@shared/rig';
import {
  currentParagraph,
  currentScript,
  layoutOf,
  nextScript,
  prevScript,
  setupEdge,
  useProm,
} from '../src/renderer/src/store';

/**
 * THE SETUP PANEL — the slide-out that replaced six toolbar rows.
 *
 * The rules under all of this: the panel may take WIDTH and it may never take
 * anything else. It must not move the talent, must not rewrite the rig, and
 * must not come between them and the driven zone.
 */

const s = () => useProm.getState();

const layout = (patch: Partial<RigLayout> = {}): RigLayout => ({
  ...DEFAULT_LAYOUT,
  visible: [...DEFAULT_LAYOUT.visible],
  weights: { ...DEFAULT_LAYOUT.weights },
  ...patch,
});

const STAGE_LEFT: Rig = {
  id: 'stage-left',
  label: 'Stage left',
  layout: layout({ driven: 'paragraph', camera: 'left', text: 'stage' }),
};

const reset = (): void => {
  useProm.setState({
    set: null,
    scriptId: null,
    transcriptId: null,
    style: null,
    step: 0,
    ...layout(),
    transcriptOpen: false,
    transcriptEdge: 'left',
    setupOpen: false,
    rigs: [],
    rigId: null,
    rigsLoaded: false,
    restoredLayout: false,
    cue: null,
    nudge: 0,
  });
  s().load(JSON.parse(JSON.stringify(KYBERNESIS_PHASE_1)));
};

beforeEach(reset);

describe('opening and closing it', () => {
  it('toggles, and closes on demand', () => {
    expect(s().setupOpen).toBe(false);
    s().toggleSetup();
    expect(s().setupOpen).toBe(true);
    s().closeSetup();
    expect(s().setupOpen).toBe(false);
  });

  it('does not move the talent', () => {
    // THE rule. Opening a config drawer is not a boundary crossing and must
    // not change which script, corpus, style or beat is in front of them.
    s().selectScript('kybernesis-phase-1/03');
    s().stepNext();
    const before = {
      scriptId: s().scriptId,
      transcriptId: s().transcriptId,
      style: s().style,
      step: s().step,
      paragraph: currentParagraph(s())?.id,
    };

    s().toggleSetup();

    expect(s().scriptId).toBe(before.scriptId);
    expect(s().transcriptId).toBe(before.transcriptId);
    expect(s().style).toBe(before.style);
    expect(s().step).toBe(before.step);
    expect(currentParagraph(s())?.id).toBe(before.paragraph);
  });

  it('never touches the lane weights', () => {
    // The lanes narrow because a flex sibling took width, and they spring back
    // when it closes. Lane widths are a saved rig property, so a panel that
    // rebalanced them would rewrite the talent's rig every time it opened.
    s().loadRigs([STAGE_LEFT], { layout: STAGE_LEFT.layout, rigId: 'stage-left' });
    const before = layoutOf(s());

    s().toggleSetup();
    s().closeSetup();

    expect(layoutOf(s())).toEqual(before);
  });

  it('is not part of a rig', () => {
    // A rig is what the STAGE looks like. Whether a config drawer happened to
    // be open when you quit is not, and reopening on it would put a panel
    // between the talent and their first take.
    s().toggleSetup();
    expect(Object.keys(layoutOf(s()))).not.toContain('setupOpen');
    expect(layoutOf(s())).toEqual(DEFAULT_LAYOUT);
  });

  it('raises no cue card', () => {
    s().toggleSetup();
    expect(s().cue).toBeNull();
  });
});

describe('which edge it enters from', () => {
  it('is always the one furthest from the lens', () => {
    // Same rule the transcript drawer follows. A panel between the talent and
    // the driven zone is the failure mode, whichever panel it is.
    s().setCamera('right');
    expect(setupEdge(s())).toBe('left');

    s().setCamera('left');
    expect(setupEdge(s())).toBe('right');
  });

  it('follows the camera even while it is open', () => {
    s().toggleSetup();
    s().setCamera('left');
    expect(setupEdge(s())).toBe('right');
    expect(s().setupOpen).toBe(true);
  });

  it('agrees with the transcript drawer, so they can never both crowd the lens', () => {
    for (const side of ['left', 'right'] as const) {
      s().setCamera(side);
      expect(setupEdge(s())).toBe(s().transcriptEdge);
    }
  });
});

describe('the strip’s script stepper', () => {
  it('walks to the neighbouring script', () => {
    s().selectScript('kybernesis-phase-1/05');
    s().goToPrevScript();
    expect(currentScript(s())?.n).toBe(4);
    s().goToNextScript();
    expect(currentScript(s())?.n).toBe(5);
  });

  it('stops at both ends rather than wrapping', () => {
    // Rolling from 12 back to 01 is the silent-advance bug the prior-art rule
    // exists to prevent, one level up from the beat.
    s().selectScript('kybernesis-phase-1/01');
    expect(prevScript(s())).toBeUndefined();
    s().goToPrevScript();
    expect(currentScript(s())?.n).toBe(1);

    s().selectScript('kybernesis-phase-1/12');
    expect(nextScript(s())).toBeUndefined();
    s().goToNextScript();
    expect(currentScript(s())?.n).toBe(12);
  });

  it('announces the change like every other script change', () => {
    // Every boundary crossing announces itself, whatever triggered it — and a
    // stepper press is a crossing where opening the panel is not.
    s().selectScript('kybernesis-phase-1/02');
    const before = s().cue?.token ?? 0;
    s().goToNextScript();
    expect(s().cue?.token).toBeGreaterThan(before);
    expect(s().cue?.label).toBe('03');
  });

  it('resets the beat, because a half-remembered position is worse than a known one', () => {
    s().stepNext();
    s().stepNext();
    expect(s().step).toBeGreaterThan(0);
    s().goToNextScript();
    expect(s().step).toBe(0);
  });
});
