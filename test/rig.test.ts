import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LAYOUT,
  MIN_ZONE_WEIGHT,
  RECORDING_SET,
  canonicalZones,
  cloneLayout,
  findRig,
  sameLayout,
  validateRig,
  validateRigLayout,
  type Rig,
  type RigLayout,
} from '@shared/rig';

/**
 * THE RIG RULES.
 *
 * A rig is a way to arrive at an arrangement without clicking through to it,
 * which means every interactive guard the store enforces has to exist here too
 * — otherwise a rig is a back door into a state the UI refuses to produce.
 */

const layout = (patch: Partial<RigLayout> = {}): RigLayout => ({
  ...cloneLayout(DEFAULT_LAYOUT),
  ...patch,
});

const messages = (violations: { message: string }[]): string =>
  violations.map((v) => v.message).join(' | ');

describe('the opening arrangement', () => {
  it('is itself a valid rig layout', () => {
    // If the shipped default cannot pass the gate, every first launch starts
    // in a state the core would refuse to store.
    expect(validateRigLayout(DEFAULT_LAYOUT)).toEqual([]);
  });

  it('is handed out as a copy, never the shared constant', () => {
    const copy = cloneLayout(DEFAULT_LAYOUT);
    copy.visible.push('major');
    copy.weights.major = 9;
    expect(DEFAULT_LAYOUT.visible).toEqual(['triggers', 'paragraph']);
    expect(DEFAULT_LAYOUT.weights.major).toBe(1);
  });
});

describe('a rig layout', () => {
  it('must show at least one zone', () => {
    // An empty stage is not an arrangement, it is a broken app mid-take.
    const violations = validateRigLayout(layout({ visible: [], driven: 'triggers' }));
    expect(messages(violations)).toContain('at least one zone');
  });

  it('may not drive a zone it does not show', () => {
    // THE load-bearing rule: the strong marker and the arrow keys would both be
    // pointed at something off screen.
    const violations = validateRigLayout(layout({ visible: ['paragraph'], driven: 'triggers' }));
    expect(messages(violations)).toContain('cannot drive "triggers"');
  });

  it('accepts every zone as the driven one when it is visible', () => {
    for (const zone of RECORDING_SET) {
      expect(validateRigLayout(layout({ visible: [...RECORDING_SET], driven: zone }))).toEqual([]);
    }
  });

  it('rejects a duplicated zone', () => {
    const violations = validateRigLayout(
      layout({ visible: ['triggers', 'triggers'], driven: 'triggers' }),
    );
    expect(messages(violations)).toContain('duplicate zone "triggers"');
  });

  it('rejects a weight below what the divider clamps at', () => {
    // A rig may not encode an arrangement the divider would have refused —
    // otherwise a saved rig is a way to squeeze a zone to nothing.
    const violations = validateRigLayout(
      layout({ weights: { ...DEFAULT_LAYOUT.weights, paragraph: MIN_ZONE_WEIGHT - 0.01 } }),
    );
    expect(messages(violations)).toContain('below the');
  });

  it('rejects a missing or non-finite weight', () => {
    const broken = layout();
    // @ts-expect-error — deliberately modelling a hand-edited store file
    delete broken.weights.minor;
    expect(messages(validateRigLayout(broken))).toContain('finite weight');
  });
});

describe('a rig', () => {
  const rig = (patch: Partial<Rig> = {}): Rig => ({
    id: 'stage-left',
    label: 'Stage left',
    layout: layout(),
    ...patch,
  });

  it('needs a name to be pickable', () => {
    // The chip is the whole interface. A blank chip is unclickable in practice.
    expect(messages(validateRig(rig({ label: '   ' })))).toContain('needs a name');
  });

  it('carries its layout violations up', () => {
    const violations = validateRig(
      rig({ layout: layout({ visible: ['major'], driven: 'triggers' }) }),
    );
    expect(messages(violations)).toContain('cannot drive');
  });

  it('is found by id', () => {
    const rigs = [rig(), rig({ id: 'desk-right', label: 'Desk right' })];
    expect(findRig(rigs, 'desk-right')?.label).toBe('Desk right');
    expect(findRig(rigs, 'nope')).toBeUndefined();
  });
});

describe('comparing two arrangements', () => {
  it('ignores the order zones were toggled in', () => {
    // `visible` is stored canonically, but a hand-written rig might not be.
    expect(
      sameLayout(
        layout({ visible: ['triggers', 'paragraph'] }),
        layout({ visible: ['paragraph', 'triggers'] }),
      ),
    ).toBe(true);
  });

  it('tolerates sub-pixel weight drift', () => {
    // Weights come out of pixel drags. An exact === would report every rig as
    // modified forever after the first nudge of a divider.
    expect(
      sameLayout(layout(), layout({ weights: { ...DEFAULT_LAYOUT.weights, triggers: 2 + 1e-9 } })),
    ).toBe(true);
  });

  it('notices a real resize', () => {
    expect(
      sameLayout(layout(), layout({ weights: { ...DEFAULT_LAYOUT.weights, triggers: 2.4 } })),
    ).toBe(false);
  });

  it.each([
    ['driven', { driven: 'paragraph' }],
    ['camera', { camera: 'left' }],
    ['text', { text: 'stage' }],
    ['mirror', { mirror: true }],
    ['focus', { focus: true }],
    ['visible', { visible: ['triggers', 'paragraph', 'major'] }],
  ] as [string, Partial<RigLayout>][])('notices a change of %s', (_field, patch) => {
    expect(sameLayout(layout(), layout(patch))).toBe(false);
  });
});

describe('canonical zone order', () => {
  it('is the recording set order, whatever order came in', () => {
    expect(canonicalZones(['paragraph', 'major', 'triggers'])).toEqual([
      'major',
      'triggers',
      'paragraph',
    ]);
  });

  it('drops anything not in the recording set', () => {
    expect(canonicalZones([])).toEqual([]);
  });
});
