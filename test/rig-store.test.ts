import { beforeEach, describe, expect, it } from 'vitest';
import { KYBERNESIS_PHASE_1 } from '@shared/script-set';
import { DEFAULT_LAYOUT, type Rig, type RigLayout, type Workspace } from '@shared/rig';
import {
  activeRig,
  currentParagraph,
  layoutOf,
  rigModified,
  useProm,
  zoneOrder,
} from '../src/renderer/src/store';

/**
 * RIGS, DRIVEN THROUGH THE STORE.
 *
 * The rule under all of these: **changing the arrangement must never change
 * where the talent is.** A rig moves columns around; it does not move the
 * person on camera to a different script, corpus, style or beat. That is the
 * same rule `refresh` obeys, applied to the other axis.
 */

const s = () => useProm.getState();

const layout = (patch: Partial<RigLayout> = {}): RigLayout => ({
  ...DEFAULT_LAYOUT,
  visible: [...DEFAULT_LAYOUT.visible],
  weights: { ...DEFAULT_LAYOUT.weights },
  ...patch,
});

/** David's actual rig, from the screenshot that started this. */
const STAGE_LEFT: Rig = {
  id: 'stage-left',
  label: 'Stage left',
  layout: layout({
    visible: ['triggers', 'paragraph'],
    driven: 'paragraph',
    camera: 'left',
    text: 'stage',
  }),
};

const WIDE: Rig = {
  id: 'wide',
  label: 'Wide',
  layout: layout({ visible: ['major', 'triggers', 'paragraph'], driven: 'triggers' }),
};

const workspace = (patch: Partial<Workspace> = {}): Workspace => ({
  layout: null,
  rigId: null,
  ...patch,
});

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
    rigs: [],
    rigId: null,
    rigsLoaded: false,
    cue: null,
    nudge: 0,
  });
  s().load(JSON.parse(JSON.stringify(KYBERNESIS_PHASE_1)));
};

beforeEach(reset);

describe('opening the app', () => {
  it('restores the arrangement the talent quit with', () => {
    // The entire point. Four controls used to be re-set before every take.
    s().loadRigs([STAGE_LEFT], workspace({ layout: STAGE_LEFT.layout, rigId: 'stage-left' }));

    expect(s().driven).toBe('paragraph');
    expect(s().camera).toBe('left');
    expect(s().text).toBe('stage');
    expect(s().rigId).toBe('stage-left');
  });

  it('keeps the skim surface on the far edge from the lens', () => {
    // Derived, never stored — otherwise a restored workspace could open the
    // transcript drawer across the zone the talent is reading.
    s().loadRigs([], workspace({ layout: layout({ camera: 'left' }) }));
    expect(s().transcriptEdge).toBe('right');
  });

  it('falls back to the opening arrangement on a machine that has never run it', () => {
    s().loadRigs([], workspace());
    expect(layoutOf(s())).toEqual(DEFAULT_LAYOUT);
    // Still marked loaded, or the app would never start remembering anything.
    expect(s().rigsLoaded).toBe(true);
  });

  it('ignores a stored layout the domain would refuse', () => {
    // A hand-edited store file must not be able to put the strong marker on a
    // zone that is not on screen.
    s().loadRigs([], workspace({ layout: layout({ visible: ['paragraph'], driven: 'major' }) }));
    expect(layoutOf(s())).toEqual(DEFAULT_LAYOUT);
    expect(s().rigsLoaded).toBe(true);
  });

  it('canonicalises the zone order it was given', () => {
    s().loadRigs(
      [],
      workspace({ layout: layout({ visible: ['paragraph', 'major'], driven: 'major' }) }),
    );
    expect(s().visible).toEqual(['major', 'paragraph']);
  });
});

describe('picking a rig', () => {
  beforeEach(() => {
    s().loadRigs([STAGE_LEFT, WIDE], workspace());
  });

  it('rearranges the screen and lights the chip', () => {
    s().applyRig('stage-left');
    expect(layoutOf(s())).toEqual(STAGE_LEFT.layout);
    expect(activeRig(s())?.label).toBe('Stage left');
  });

  it('does not move the talent', () => {
    // THE rule. A rig moves columns; it never moves the person on camera.
    s().selectScript('kybernesis-phase-1/03');
    s().stepNext();
    s().stepNext();

    const before = {
      scriptId: s().scriptId,
      transcriptId: s().transcriptId,
      style: s().style,
      step: s().step,
      paragraph: currentParagraph(s())?.id,
    };

    s().applyRig('wide');

    expect(s().scriptId).toBe(before.scriptId);
    expect(s().transcriptId).toBe(before.transcriptId);
    expect(s().style).toBe(before.style);
    expect(s().step).toBe(before.step);
    expect(currentParagraph(s())?.id).toBe(before.paragraph);
  });

  it('raises no cue card', () => {
    // A cue announces a boundary the talent CROSSED. Rearranging the screen in
    // front of them is not a crossing — and the card would cover the change
    // they just asked to see.
    s().applyRig('stage-left');
    expect(s().cue).toBeNull();
  });

  it('ignores an id that is not there', () => {
    const before = layoutOf(s());
    s().applyRig('never-existed');
    expect(layoutOf(s())).toEqual(before);
    expect(s().rigId).toBeNull();
  });

  it('puts the driven zone nearest the lens, whichever rig it is', () => {
    // requirements §2 is not something a rig can opt out of.
    s().applyRig('stage-left');
    expect(zoneOrder(s())[0]).toBe('paragraph');

    s().applyRig('wide');
    expect(zoneOrder(s()).at(-1)).toBe('triggers');
  });
});

describe('whether the rig is still what it says', () => {
  beforeEach(() => {
    s().loadRigs([STAGE_LEFT], workspace());
    s().applyRig('stage-left');
  });

  it('reads clean the moment it is applied', () => {
    expect(rigModified(s())).toBe(false);
  });

  it.each([
    ['a zone toggled', () => s().toggleZone('major')],
    ['the camera moved', () => s().setCamera('right')],
    ['the text resized', () => s().setText('large')],
    ['mirror flipped', () => s().toggleMirror()],
    ['a divider dragged', () => s().resizeZones('triggers', 'paragraph', 120)],
  ])('reads modified after %s', (_what, change) => {
    change();
    expect(rigModified(s())).toBe(true);
  });

  it('reads clean again once the rig is re-applied', () => {
    s().toggleZone('major');
    s().applyRig('stage-left');
    expect(rigModified(s())).toBe(false);
  });

  it('keeps the chip lit while the talent tweaks', () => {
    // A chip that goes dark the moment you nudge a divider tells you you have
    // left your rig when you have not.
    s().resizeZones('triggers', 'paragraph', 60);
    expect(s().rigId).toBe('stage-left');
    expect(rigModified(s())).toBe(true);
  });

  it('reads clean when no rig is applied at all', () => {
    s().loadRigs([STAGE_LEFT], workspace());
    expect(s().rigId).toBeNull();
    expect(rigModified(s())).toBe(false);
  });
});

describe('a rig arriving from an agent', () => {
  it('adds the chip and leaves the stage alone', () => {
    // An agent authoring a rig must not repaint the screen of someone mid-take.
    s().loadRigs([STAGE_LEFT], workspace({ layout: STAGE_LEFT.layout, rigId: 'stage-left' }));
    const before = layoutOf(s());

    s().setRigs([STAGE_LEFT, WIDE]);

    expect(s().rigs).toHaveLength(2);
    expect(layoutOf(s())).toEqual(before);
    expect(s().rigId).toBe('stage-left');
  });
});

describe('the live layout', () => {
  it('round-trips through a rig unchanged', () => {
    // What `layoutOf` reads is exactly what `save_rig` would store and
    // `applyRig` would restore. If those three ever disagree, a saved rig is
    // not the arrangement the talent saved.
    s().loadRigs([], workspace());
    s().toggleZone('major');
    s().setDriven('major');
    s().setCamera('left');
    s().setText('stage');
    s().toggleMirror();
    s().resizeZones('major', 'triggers', 80);

    const captured = layoutOf(s());
    const rig: Rig = { id: 'captured', label: 'Captured', layout: captured };

    s().setRigs([rig]);
    s().applyRig('captured');

    expect(layoutOf(s())).toEqual(captured);
    expect(rigModified(s())).toBe(false);
  });

  it('is a copy, so a caller cannot reach into the store through it', () => {
    const captured = layoutOf(s());
    captured.visible.push('major');
    captured.weights.triggers = 99;
    expect(s().visible).toEqual(['triggers', 'paragraph']);
    expect(s().weights.triggers).toBe(2);
  });
});
