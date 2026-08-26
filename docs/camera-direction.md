# Camera direction — a proposal, not a build

**Status:** open question, for David to rule on. Nothing here is implemented.
**Written:** 2026-08-26, out of the session that reclaimed the top band.

---

## The ask

`src/shared/rig.ts` models the lens as one of two **edges**:

```ts
export const CAMERA_SIDES = ['left', 'right'] as const;
```

David's camera is **above** the screen, and sometimes **above-left**. The ask is for
all directions.

This is not a mechanical enum extension, and that is the whole point of writing it
down before touching it.

## What `camera` actually drives today

Three things, all derived — there is no second knob anywhere:

| consumer | rule | code |
|---|---|---|
| `zoneOrder` | the driven zone sits at the lens end of the row | `store.ts:792` |
| `transcriptEdge` | the drawer enters from the edge **furthest** from the lens | `store.ts:490,612` |
| `setupEdge` | same rule, same reason | `store.ts:775` |

All three express "nearest the lens" as a **horizontal position in a row of lanes**.
A lens *above* the screen has no horizontal position, so all three rules go quiet at
once — and quietly, which is the risk. `camera: 'top'` added to the enum with nothing
else changed would compile, validate, save into a rig, and put the setup panel back on
the left for no reason anyone could name.

It is also a **saved rig property**, so whatever shape it takes has to survive rigs
already written to `~/Library/Application Support/teletubby/teletubby.json`.

## The options

### A — Add `'top'` / `'bottom'` to `CAMERA_SIDES` and stack the lanes vertically

`camera: 'top'` → the lanes become rows, driven zone on top; `Divider` becomes a
horizontal splitter; `resizeZones` grows an axis.

- **For:** it is the literal reading of "the driven zone sits nearest the lens".
- **Against, and this is the one that kills it:** with the lanes stacked, *only* the
  driven zone is near a top-mounted lens. The two follower zones end up **further**
  from the lens than they were side by side, because they are now a full lane-height
  below it. A vertical stack maximises follower eye-travel for the exact camera
  position it claims to serve.
- **Against, second:** `weights` currently means *column widths*. Under `'top'` the
  same numbers would mean *row heights*. A rig would silently mean a different
  arrangement depending on a sibling field — the kind of coupling that produces a
  layout nobody chose.

### B — Separate `camera` (4 directions) from a new `stackAxis` (row / column)

Expressive, and wrong on the app's own terms: it is a second control the talent has to
learn and reason about jointly with the first. The North Star test rejects it.

### C — Widen `camera` from a **side** to a **position**, and derive everything ⭐

```ts
export interface CameraPosition {
  x: 'left' | 'centre' | 'right';
  y: 'above' | 'level';
}
```

`'above-left'` is `{x:'left', y:'above'}`; today's `'left'` is `{x:'left', y:'level'}`.
Three derivations, no new knob:

| derived | rule |
|---|---|
| lane order | `x` picks which end of the row the driven zone sits at; `'centre'` puts it in the middle |
| panel entry edge | `y === 'above'` → panels enter from the **bottom**; otherwise the far horizontal edge |
| reading line | `y === 'above'` → the reclaimed value is the default, not an opt-in |

**The lanes stay side by side in every case.** That is the substantive claim in this
proposal and the one worth arguing with: for a lens above the screen, "nearest the
lens" stops being a horizontal question and becomes a vertical one — and the way to
answer a vertical question is to raise the *reading line*, not to re-stack the lanes.
Side-by-side lanes with a high reading line put **every** zone inside the same narrow
band under the lens. That is what this session's reclaimed state already does, and it
is why it made the paragraph-driven case go from 4.6cm to 1.2cm without moving a
single lane.

`x: 'centre'` earns its place here: with the lens above and centred, the driven zone
belongs in the middle of the row, which today's two-value enum cannot express at all.

**Cost:** it changes the shape of a saved rig property. Needs a normaliser that reads
the old string form (`'left'` → `{x:'left',y:'level'}`) on load, a `domain-schema.ts`
union that accepts both, and a look at `capability-surface.test.ts` because `save_rig`
and `list_rigs` are published verbs with a pinned contract.

### D — Do nothing to `camera`; treat "above" purely as the reclaimed state

This is what shipped this session, and it is worth stating as an option because it may
be sufficient. It already delivered the thing camera-above actually demanded:

| driven zone | before | after (reclaimed) |
|---|---|---|
| paragraph | 167px / 4.6cm | 44px / 1.2cm |
| triggers, beat 1 | 336px / 9.3cm | 57px / 1.6cm |

What it does **not** fix: the setup panel and the transcript drawer still choose their
edge from a horizontal rule that has no meaning for a top lens, and the footer strip is
now the only thing that knows the lens is not at the bottom.

## Recommendation

**Ship D (done), then C — and only C.** Do not build A.

Order, if David agrees:

1. **Now, free:** nothing. The reclaimed state is the camera-above fix and it is in.
2. **Next, small:** make the panel entry edge honour a vertical lens. Even before the
   type changes, "the panel must not sit between the talent and the driven zone" is
   about to be violated in a new direction.
3. **Then, deliberately:** the `CameraPosition` change, with the string→object
   normaliser, in one PR with the rig-schema and capability-surface updates — because
   the rule in `CLAUDE.md` is that a verb's contract and its implementation land
   together.

**What would change my mind:** if David tries a top-mounted take and finds his eyes
travelling *sideways* between lanes more than they used to. That is the failure mode
option A is built for, and it is a thing you can only learn by shooting — the same
ruling the North Star already makes about trigger words. One take with the reclaimed
state answers it; no amount of argument here does.
