---
doc: kdd-learning
project: teletubby
category: frontend
severity: high
status: current
created: 2026-08-19
---

# A Zustand selector that builds an array blanks the window

## The one-line version

A selector returning a fresh array on every call is never `Object.is`-equal to
the previous result, so the subscribing component re-renders forever, React
tears the tree down, and you get **a blank window with nothing in the console**.

## What happened

Session 2 moved the renderer onto the zone model. `zoneOrder` computes the
left-to-right order of the visible zones, and it necessarily builds a new array:

```ts
export const zoneOrder = (s: PrompterState): RecordingZone[] => {
  const followers = RECORDING_SET.filter((z) => s.visible.includes(z) && z !== s.driven);
  return s.camera === 'left' ? [s.driven, ...followers] : [...followers, s.driven];
};
```

Subscribed the obvious way:

```ts
const order = useProm(zoneOrder);   // ← new array every render
```

The app built cleanly, typechecked cleanly, and all 151 tests passed — because
the store logic was **correct**. Only the subscription was wrong. The window
opened, painted the canvas background, and rendered nothing else.

`activeTriggers` had the same defect in its empty case: `?? []` mints a new
array each time, so a transcript with no authored triggers would have blanked
the window too — a bug that would only have appeared on the cadence corpus.

## Why it was expensive to see

Everything that normally tells you something is wrong stayed silent:

- the build succeeded
- the typecheck succeeded
- the whole test suite passed, including 34 tests over the exact code involved
- the Electron window opened, sized correctly, with the right background colour
- nothing appeared in the main-process log

A screenshot was the only thing that showed the failure. **The suite proves the
rules; it says nothing about whether the app mounted.**

## The fix

Two shapes, depending on whether the new array is avoidable:

```ts
// 1. Avoidable — hoist one shared empty array instead of minting `[]`.
const NO_TRIGGERS: Trigger[] = [];
return findTriggerSet(transcript, style)?.triggers ?? NO_TRIGGERS;

// 2. Unavoidable — compare by value, not identity.
import { useShallow } from 'zustand/react/shallow';
const order = useProm(useShallow(zoneOrder));
```

## The rule

> **Any selector that constructs its return value needs `useShallow`.** If you
> can see a `[...]`, `.map`, `.filter` or `?? []` in a selector, it cannot be
> subscribed to directly.

## What this does NOT establish

Passing tests and a clean build say nothing about whether the renderer mounted.
Nothing in this repo's automated checks would have caught it, and adding a DOM
test harness to catch this one class of bug is not obviously worth it — but
**looking at the window before claiming a UI change works is not optional.**

## Related

This is the third silent-failure-with-no-error in this repo, after
[Tailwind dropping opacity modifiers on `var()` colours](tailwind-drops-opacity-modifiers-on-var-colours.md)
and [`hiddenInset` leaving no drag region](hiddeninset-leaves-no-drag-region.md).
Three instances of one shape is the bar this KDD sets for promoting a learning
to a pattern — **candidate pattern: "the renderer fails silently; the console
is not the place you will find out."** Left for Lisa to rule on rather than
self-promoted.
