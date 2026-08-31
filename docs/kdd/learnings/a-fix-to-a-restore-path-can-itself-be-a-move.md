---
learning: a-fix-to-a-restore-path-can-itself-be-a-move
category: correctness
severity: high
date: 2026-08-31
status: fixed
files:
  - src/renderer/src/store.ts
  - test/prompter-navigation.test.ts
---

# A fix to a restore path can itself be a move

**The one-line version**: the correction meant to stop position drift caused position drift —
inside the machinery protecting against drift. Any "restore to a known state" feature needs an
explicit **no-op path** for the case where the state has not actually changed.

## What happened

The live-edit hole: `refresh()` kept the talent's step **index** across an agent's rewrite, so a
trigger inserted before the current beat shifted them silently. The fix was to re-seat by
paragraph id instead — the semantics already ruled for restore and the corpus switch.

First cut: *always* re-seat. `stepAtParagraph` lands on the paragraph's **first** trigger — so a
talent three triggers deep into a paragraph was yanked back to trigger one **on every agent
edit**, including edits that touched nothing near them. The repo's own pinned test caught it
before it shipped:

> `picks up an agent's new trigger words at the same beat` — expected 1 to be 2

The test existed because the rule it pins ("a refresh must never move the talent") had already
been paid for once. The fix to one violation of the rule was a second violation of the rule.

## The fix

```ts
// wrong way — always re-seat: correct for a changed world, a MOVE for an unchanged one
step = stepAtParagraph(transcript, triggers, landing);

// right way — a no-op fast path first: has the ground actually shifted?
if (transcript.id === from.id && triggers[state.step]?.paragraphId === fromParagraph) {
  step = state.step; // same index, same paragraph — hold the exact beat
} else {
  // …then topic-map / re-seat, and END visibly when even that fails
}
```

## The general rule

**"Restore to a known state" is only safe when it starts with "is the current state already
right?"** Re-deriving a position, a selection, a scroll offset, or a layout from stored identity
is lossy whenever the identity is coarser than the state (paragraph vs. trigger-within-paragraph
here) — so an unconditional restore rounds the user's position down to the identity's grain.
Check for the no-op first; restore only what actually moved.

Corollary for reviews: when a fix edits the machinery that protects an invariant, run that
invariant's pinned tests before believing the fix — they encode the last time it was violated.
