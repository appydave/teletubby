# The hot zone — where the driven text sits in relation to the lens

**Status:** proposal. Nothing here is implemented, and nothing here changes what a rig
stores.
**Written:** 2026-08-26. Reframed the same day, after David described the physical rig.

---

## The reframe

The first draft of this document asked whether to add `'top'` to `CAMERA_SIDES`, and then
asked David whether the lanes should stay side by side or stack. **Both were the wrong
question**, and the second was unanswerable because it put a derivation in front of the
talent.

`camera: 'left' | 'right'` is not wrong because it is missing `'top'`. It is wrong
because **the camera is not on an edge at all.**

> Stop modelling *where the camera is*.
> Model **where the hot zone sits in relation to the camera**.

## The physical rig

Facts about the actual setup, none of which the code knows today:

- The camera is on a **vertical pole**. It travels **up and down** it and **across** the
  screen. It is not fixed to an edge, and it is **not behind the monitor**.
- It sits roughly **1 inch in front of the screen plane** and **physically blocks part of
  the display**. Right now it is at the left-hand edge, overhanging right, clipping a
  couple of letters off each line.
- **That occlusion is acceptable.** David reads through it — the missing letters are
  inferred. It is a region to *prefer not to put load-bearing text in*, not a bug to
  prevent absolutely. A layout that contorted to guarantee zero occlusion would be worse
  than one that clips two letters.
- The current body is a **Pocket 4**, whose own rear screen widens the blocked strip.
- **Never mounted low.** The convention is above the jawline; the lens sits at or above
  forward eye height.
- **Behind-the-monitor is the known bad case**: the eyeline goes *up* to clear the
  monitor, so reading down the page walks steadily away from the lens. That is the B437
  failure arriving by a different route.
- Under consideration: raising the monitor ~10 cm, or dropping the camera ~10 cm, to open
  a clear band of screen beside the lens with the eyeline just above the camera.

## The hot zone

David's term, and the thing to solve for:

> **A small region — roughly 10 cm wide — that must fall inside the sight line to the
> lens.**

The current left-edge rig works *because* the hot zone can be kept narrow and parked just
to the right of the camera body. Not because the driven lane is "at the lens end of a
row".

So the layout's job is not *"put the driven lane at the lens end"*. It is:

> **Place the driven zone's reading line adjacent to the lens point, and out from behind
> the camera body.**

## What that makes the camera model

An edge enum cannot express any of the above. The shape it needs:

```ts
interface CameraRig {
  /** Where the lens sits over the screen plane. Normalised 0..1 from top-left. */
  lens: { x: number; y: number };
  /**
   * The strip the MOUNT blocks, as a fraction of screen width.
   * One number, not a rectangle — see below.
   */
  occlusion: number;
}
```

Two things to notice.

**Occlusion is a vertical strip, because the mount is a vertical pole.** The pole blocks a
full-height sliver; the body widens it around `lens.y`. Modelling that faithfully takes
two numbers and asks the talent to calibrate twice. One number, taken as the worst case —
the body at its widest — is the honest simplification, and it is the number that matters,
because the body is what sits at the reading line.

⚠️ **The app cannot know centimetres.** Electron reports size in device-independent pixels
and a scale factor, never physical size. So "10 cm" cannot be computed; it has to arrive
as a fraction of the screen that the talent sets once, or calibrates by dragging. On this
32" display (2560×1440 logical, 70.8 cm wide, **36.2 px/cm**) a 10 cm hot zone is **362
logical px — 14.1% of the width**. That is the conversion, and it is display-specific.
Any number hard-coded in cm is a bug on the next monitor.

## Rows vs columns is DERIVED, not chosen

This is the question that was wrongly put to the talent. It falls out of the geometry.

**The mount is a vertical pole, so the blocked region is a vertical strip spanning the
full height of the screen.** The same physical area is blocked however the app divides the
screen — what changes is how many content units it damages, and whether the layout has
anywhere to put the damage.

| arrangement | what the vertical strip eats |
|---|---|
| **columns** (lanes side by side) | a sliver of **one** lane, down its height. The strip can be absorbed by that lane's padding, or the least load-bearing zone parked there. |
| **rows** (lanes stacked) | a sliver of **every** row, all at the same x. Rows span the full width, so **there is nowhere to move the damage to** — rearranging rows does not move a vertical strip. |

**Columns give the layout somewhere to put the occlusion; rows do not.** That holds for a
lens at *any* height, which is why the camera's height was never the question. The earlier
argument for columns — that stacking puts the follower lanes a full lane-height from a
high lens — is true and secondary. This one is structural.

So: **the lanes stay columns.** The app does not ask, and must never ask.

## The app already has the two controls it needs

The hot zone is a rectangle. Its position has exactly two degrees of freedom, and
Teletubby already steers both:

| degree of freedom | the control that already exists |
|---|---|
| **horizontal** — which lane the hot zone sits in | the driven lane's position in the row (`zoneOrder`) |
| **vertical** — how far down that lane | the reading line (`--tt-reading-line`) |

Nothing new has to be built to *place* a hot zone. The defect is only that both are
steered from a two-value edge enum instead of from a lens point. **This is a re-plumbing
job, not a layout job** — which is why the next step below is as small as it is.

## How this subsumes the reclaimed state

`D` (reclaimed) pulls the reading line from 26vh to 0.5rem. Under the hot-zone frame that
stops being a mode and becomes an instance of one rule:

> **The reading line tracks `lens.y`.**

Because the camera is *never mounted low* and sits at or above forward eye height,
`lens.y` is always small — so the derived reading line is always near the top, which is
exactly what reclaimed hard-codes. Reclaimed is not replaced by this frame; it is **the
right answer for today's camera height, arrived at by hand**. When `lens.y` exists the two
named constants collapse into one derived number, and `D` goes back to meaning only what
it originally meant: dim everything that is not the live beat.

That also settles the tension flagged against prior-art rule 7. The fixed height stays
fixed; the number it is fixed *at* becomes a property of the physical rig rather than a
constant somebody has to defend.

`transcriptEdge` and the setup panel's entry edge need no reframing at all. The
invariant — **never between the talent and the hot zone** — survives verbatim; it just
derives from the lens point instead of an edge. It gets *better*: with a point, a panel
can be refused on the correct side even when the lens is near the middle of the screen,
which the current enum cannot express at all.

## The constraint that four zones is too many

David, unprompted: he would not display all four zones, and showing all four *"wouldn't
make any sense."*

The hot-zone frame says why, with a number. On this display the hot zone is **362 px**.
Four equal lanes are **640 px each**; two lanes are **1280 px each**. **One lane is
already 1.8× wider than the entire hot zone**, at any zone count.

The consequence is sharper than "four is cluttered":

> **The hot zone is always part of ONE lane. Every other zone is outside the sight line by
> construction.**

They are not glance surfaces — they are look-away surfaces. Each additional visible zone
is one more reason to break eyeline, which is exactly what the North Star test forbids.
The zone count is not a clutter question, it is an eyeline question.

⚠️ **Recorded, not acted on.** `RECORDING_SET` is unchanged, `DEFAULT_LAYOUT` is
unchanged, and what a rig stores is unchanged. What it implies for the arrangement work:
when the lens point lands, the natural default is **two lanes — the driven one carrying
the hot zone, plus one follower** — and the app should make that easy to reach rather than
enforce it. Four stays expressible, because a rig is the talent's to build.

## Recommendation

1. **Adopt the hot-zone frame.** `camera` becomes a lens point plus an occlusion width.
2. **Never ask rows vs columns.** Columns, derived, permanently.
3. **Do not chase zero occlusion.** Keep load-bearing text out of the strip where it is
   free to do so; accept clipping rather than contorting the layout.
4. **Let the reading line track `lens.y`**, collapsing reclaimed's two constants into one
   derived number.
5. **Never ship a hard-coded 10 cm.** It is a screen fraction the talent sets or
   calibrates, because physical size is not knowable from Electron.

## The next step — small enough for one pass

**Introduce a single derivation seam, with no behaviour change and no rig change.**

Today `zoneOrder` and `edgeFor` each interpret `camera` independently, in different
places, with the invariant restated in prose in both. Replace that with **one** function
they both derive from:

```ts
// src/renderer/src/store.ts
hotZone(state) -> { lane: RecordingZone, readingLine: string, panelEdge: CameraSide }
```

Fed by today's two-value enum it must produce **today's behaviour, exactly** — a pure
refactor, provable by the existing tests plus a table test asserting old and new agree for
both enum values. It is a strangler seam: when `lens` arrives, that one function changes
and every consumer is already reading from it.

Why this before any type change: it turns the rig-schema migration into a single-function
job instead of a hunt, and it turns "the invariant" from prose repeated in three comments
into one testable thing.

**What would change my mind on the whole frame:** if David raises the monitor or drops the
camera as he is considering, and the clear band that opens up makes occlusion stop
mattering. Then the occlusion half of the model is dead weight and the lens point alone is
enough. Worth knowing *before* building it — one rig change and one take answers it, and
no amount of reasoning here does.
