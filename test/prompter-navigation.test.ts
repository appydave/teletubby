import { beforeEach, describe, expect, it } from 'vitest';
import { SCRIPTS } from '@shared/scripts';
import {
  useProm,
  currentScript,
  currentSectionIndex,
  currentLane,
  isLastStep,
  LANES,
} from '../src/renderer/src/store';

const reset = (): void => {
  useProm.setState({
    scriptIndex: 0,
    step: 0,
    laneIndex: 1,
    mirror: false,
    focus: false,
    text: 'standard',
    cue: null,
    nudge: 0,
  });
};

const s = () => useProm.getState();

describe('stepping is clamped inside its unit', () => {
  beforeEach(reset);

  it('advances one beat at a time', () => {
    s().stepNext();
    expect(s().step).toBe(1);
    s().stepNext();
    expect(s().step).toBe(2);
  });

  it('never steps past the last beat, and never crosses into the next script', () => {
    const last = SCRIPTS[0].bullets.length - 1;
    for (let i = 0; i < last + 10; i++) s().stepNext();

    expect(s().step).toBe(last);
    expect(s().scriptIndex).toBe(0); // the boundary was NOT crossed
    expect(isLastStep(s())).toBe(true);
  });

  it('registers a nudge each time a step is refused at the end', () => {
    const last = SCRIPTS[0].bullets.length - 1;
    for (let i = 0; i < last; i++) s().stepNext();
    expect(s().nudge).toBe(0);

    s().stepNext();
    expect(s().nudge).toBe(1);
    s().stepNext();
    expect(s().nudge).toBe(2);
    expect(s().step).toBe(last);
  });

  it('clamps at the top too', () => {
    s().stepPrev();
    s().stepPrev();
    expect(s().step).toBe(0);
  });
});

describe('the transcript stays in sync with the triggers', () => {
  beforeEach(reset);

  it('derives the section from the authored map at every beat', () => {
    const script = SCRIPTS[0];
    for (let i = 0; i < script.bullets.length; i++) {
      useProm.setState({ step: i });
      expect(currentSectionIndex(s())).toBe(script.map[i] - 1);
    }
  });

  it('never rewinds the transcript while stepping forward', () => {
    for (let i = 0; i < SCRIPTS.length; i++) {
      useProm.setState({ scriptIndex: i, step: 0 });
      let previous = -1;
      for (let step = 0; step < SCRIPTS[i].bullets.length; step++) {
        useProm.setState({ step });
        const section = currentSectionIndex(s());
        expect(section).toBeGreaterThanOrEqual(previous);
        previous = section;
      }
      // The last beat lands on the final paragraph of the script.
      expect(previous).toBe(SCRIPTS[i].sections.length - 1);
    }
  });
});

describe('the lane track', () => {
  beforeEach(reset);

  it('walks left and right without wrapping', () => {
    expect(currentLane(s())).toBe('both');
    s().laneLeft();
    expect(currentLane(s())).toBe('bullets');
    s().laneLeft();
    s().laneLeft();
    expect(currentLane(s())).toBe('bullets'); // clamped, no wrap

    s().laneRight();
    expect(currentLane(s())).toBe('both');
    s().laneRight();
    expect(currentLane(s())).toBe('script');
    s().laneRight();
    expect(currentLane(s())).toBe('script'); // clamped, no wrap
  });

  it('offers exactly the three documented positions', () => {
    expect(LANES).toEqual(['bullets', 'both', 'script']);
  });

  it('does not disturb the step position', () => {
    s().stepNext();
    s().stepNext();
    const before = s().step;
    s().laneLeft();
    s().laneRight();
    s().laneRight();
    expect(s().step).toBe(before);
  });
});

describe('script changes announce themselves', () => {
  beforeEach(reset);

  it('raises a cue card and resets the beat', () => {
    s().stepNext();
    s().stepNext();
    s().selectScript(4);

    expect(s().scriptIndex).toBe(4);
    expect(s().step).toBe(0);
    expect(s().cue?.n).toBe(SCRIPTS[4].n);
    expect(s().cue?.title).toBe(SCRIPTS[4].title);
  });

  it('issues a fresh token per cue so a rapid second change re-times', () => {
    s().selectScript(2);
    const first = s().cue?.token ?? 0;
    s().selectScript(3);
    expect(s().cue?.token).toBeGreaterThan(first);
  });

  it('clamps script selection to the set', () => {
    s().selectScript(99);
    expect(s().scriptIndex).toBe(SCRIPTS.length - 1);
    s().selectScript(-5);
    expect(s().scriptIndex).toBe(0);
  });

  it('will not advance past the final script', () => {
    s().selectScript(SCRIPTS.length - 1);
    s().goToNextScript();
    expect(s().scriptIndex).toBe(SCRIPTS.length - 1);
  });

  it('every script is reachable and self-consistent', () => {
    for (let i = 0; i < SCRIPTS.length; i++) {
      s().selectScript(i);
      expect(currentScript(s()).n).toBe(i + 1);
      expect(currentSectionIndex(s())).toBe(0);
    }
  });
});

describe('stage toggles', () => {
  beforeEach(reset);

  it('mirrors and un-mirrors', () => {
    expect(s().mirror).toBe(false);
    s().toggleMirror();
    expect(s().mirror).toBe(true);
    s().toggleMirror();
    expect(s().mirror).toBe(false);
  });

  it('carries exactly three named text presets', () => {
    s().setText('large');
    expect(s().text).toBe('large');
    s().setText('stage');
    expect(s().text).toBe('stage');
    s().setText('standard');
    expect(s().text).toBe('standard');
  });
});
