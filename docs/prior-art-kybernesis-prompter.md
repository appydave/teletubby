# Prior Art — the Kybernesis Prompter

**Date**: 2026-08-19
**Status**: built, published, driven live by David · not a Teletubby prototype, but the
closest thing to one that exists

A working two-column prompter built the day before this repo was created, for the twelve
Kybernesis Phase 1 explainer videos. It was built to record a specific batch, not to
explore the Teletubby idea — but it independently arrived at **columns 2 and 3 of the
three-column model**, and the iteration on it produced findings that bear directly on
[open-questions.md](open-questions.md).

Read this as evidence, not as a spec. Where it disagrees with [concept.md](concept.md),
concept.md is the intent and this is one datapoint.

---

## 1. Where it lives

| Thing | Where |
|---|---|
| **Live prompter (widget)** | **https://claude.ai/code/artifact/68ce89b5-f720-4200-af10-06e72e658b5b** |
| Source HTML | `~/dev/video-projects/v-kybernesis/phase-1/prompter.html` |
| Reference doc (briefs + scripts) | https://claude.ai/code/artifact/753845aa-f2d0-49cd-8bad-a170776baad1 |
| Reference doc source | `~/dev/video-projects/v-kybernesis/phase-1/briefs-and-draft-scripts.html` |
| Content origin | `~/Downloads/KYBERNESIS-PHASE-1-VIDEO-HANDOVER.md` (Tom Lane, 14 Aug 2026) |

Single self-contained HTML file. No build step, no dependencies, no server. All twelve
scripts are inlined as a JS array. Settings persist in `localStorage`.

> ⚠️ An earlier artifact URL for the reference doc (`4a9073b1-…`) was **deleted** and
> returns 404. The two URLs above are the live ones. The source files on disk are the
> durable copies — the artifacts are republished from them.

---

## 2. What it maps onto

Teletubby wants three columns. The prompter has two of them, and reaches column 1 by a
different route.

| Teletubby column | In the prompter | Notes |
|---|---|---|
| **1 · Topic** | ✗ not present as a column | Replaced by a 12-chip strip selecting **which script**, plus a fixed header naming it. That's one level *above* Teletubby's column 1 — script selection, not section headings within a script. |
| **2 · Triggers** ⭐ | ✅ the "Bullets" lane | Hook line + 4–6 short points + a fixed landing line. See §4 — this is a **specimen, not a validated answer** to Q1. |
| **3 · Transcript** | ✅ the "Script" lane | The full prose paragraphs, read as written. |

**The lanes sit left-to-right exactly as Teletubby describes**: bullets left, transcript
right — an ordering David specified from his own mental model, independently of this repo.

---

## 3. The navigation model (and what it cost to get right)

Three shipped iterations. The middle one contains the finding.

### v1 — beat-stepping instead of auto-scroll
Each script is 4–5 paragraphs; each paragraph is one spoken beat. `Space` advances one
beat, dims the others back, and scrolls it to centre. **No auto-scroll was built at all**,
deliberately — you set a scroll speed before you know how you'll read, and then race it.

→ Bears on **Q2 (auto-scrolling)**: one build, used live, where the answer was "no
auto-scroll, step manually" and it did not become a problem. Not proof the answer is no.
It is one existence proof that no-scroll is workable.

### v2 — the boundary bug 🔴 the real finding
In v1, pressing `↓` past the last beat **silently advanced to the next script**. David hit
this in live use and reported: *"there was no clear distinction that I was moving out of
transcript 1 into transcript 2. I got really confused."*

Three fixes, all worth carrying into Teletubby:

1. **Stepping is clamped inside the unit.** Down-arrow can never cross a section boundary.
2. **An end card** at the bottom of every script, which turns yellow when reached, names
   the next script, and carries a button. Pressing down again nudges it instead of moving.
3. **A cue card** — big numeral + title over the full stage for ~850ms on *every* script
   change, whatever triggered it.

> **The generalisable rule: one key must mean one scale of movement.** Mixing
> "next paragraph" and "next script" onto a single key is what broke it. Teletubby has
> *three* scales in play (trigger → topic → script), so it is more exposed to this, not less.

### v3 — lanes on the left/right axis
`←` and `→` walk a three-position track that matches the physical layout:

```
      ←──────────────────────────────────────→
   BULLETS            BOTH              SCRIPT
   (col 2)      (col 2 | col 3)         (col 3)
```

Clamped at both ends, no wrapping. `↑`/`↓`/`Space` always step **the bullets** — including
in the side-by-side view — because bullets are what you're speaking from. Script switching
was removed from the keyboard entirely and is click-only.

Final map: `↑ ↓ Space` = step · `← →` = which column · click = which script ·
`D` focus · `M` mirror (teleprompter glass) · `F` fullscreen.

---

## 4. The bullets — how they were generated, and why that's not an answer to Q1

All twelve bullet sets were **written by hand (by Claude), by compressing each paragraph**,
preserving: opening hook → gloss the jargon → mechanism → payoff. Each set is
hook + 4–6 points + a landing line held verbatim from Tom's approved "Desired takeaway".

Example — script 08:

> **YOUR SALES AGENT NEEDS TO KNOW IF IT CAN OFFER A DISCOUNT.**
> ▪ That's genuinely a finance question
> ▪ But you don't want sales reading the finance data
> ▪ So the sales agent asks the finance agent
> ▪ Finance looks at what it's allowed to see
> ▪ Returns the answer only — approved, or not approved
> ▪ Sales never receives the underlying numbers. At any point.
> **COLLABORATION DOES NOT REQUIRE UNIVERSAL ACCESS.**

**This is Q1's "literal words pulled from the paragraph" framing, and only that one.**
It has not been tested against the other three candidate framings, and no take has been
recorded from it yet. It was flagged to David at the time as possibly too close to the
prose to count as ad-lib prompting:

> *"switching modes changes how much you're carrying, not what you're saying. If you'd
> rather the bullets be genuinely looser — five keywords, no sentences — say so."*

That question is still open. **Treat these twelve as a first specimen for the Q1
experiment, not as a resolved rule.** They are ready-made material for the A/B that
open-questions.md says is the way to settle it: same script, three trigger styles, record
all three, judge which take sounds least recited.

---

## 5. Column 2 ↔ column 3 sync — the one mechanic worth lifting wholesale

For side-by-side to work, stepping a trigger has to move the transcript. That needs an
explicit **bullet → paragraph map**, authored per script:

```js
{ n: 8, map: [1,1,1,2,2,2,3,4] }   // 8 bullet steps -> 5 paragraphs
```

Several bullets legitimately map to one paragraph — that's correct, it's one spoken beat
broken into three prompts. Notes from building it:

- **Authored, not derived.** Proportional/positional mapping was considered and rejected;
  the boundaries don't fall evenly, and a wrong sync is worse than none. If Teletubby
  generates triggers with AI, **it must emit this mapping at the same time** — recovering
  it afterwards is a second, harder problem.
- **Validated at build time**: length matches step count, no index past the last paragraph,
  monotonically non-decreasing. All three caught real errors while authoring.
- **The map is directional.** Trigger → paragraph is exact. Paragraph → trigger takes the
  *first* trigger belonging to that paragraph, so switching columns mid-flow keeps position.
- **Visual ranking matters.** The lane you're driving has a yellow marker; the follower lane
  a quieter gold one. Without that, two highlighted columns read as two claims about where
  you are.

---

## 6. What this does NOT establish

- **Nothing about trigger-word quality.** No video has been recorded from it yet. Every Q1
  framing except "literal words from the paragraph" is untested.
- **Nothing about column 1.** Per-section topic headings within a script were never built.
- **Nothing about the AI layer.** No live listening, no waffle detection, no
  sync-to-voice — all of concept.md §4 is absent.
- **Nothing about FliHub.** No recording, no clip capture, no per-section stop/start. The
  prompter displays; it does not record.
- **Nothing about other users.** One operator, one machine, one content batch (Q4 untouched).
- **Scale is unproven.** Twelve scripts of 4–5 paragraphs each. The chip strip would not
  survive a much longer set.

---

## 7. Concrete carry-overs

1. **Clamp stepping to the unit, always.** One key = one scale of movement.
2. **Make every boundary crossing announce itself** — end card at the edge, cue card on the change.
3. **Emit the trigger→paragraph map when generating triggers**, never reconstruct it later.
4. **Rank the columns visually** so the driven column is unambiguous.
5. **Mirror mode is cheap and belongs in v1** — one `scaleX(-1)`, needed for prompter glass.
6. **Text size as three named presets**, not a ±stepper — one decision before the take, not a fiddle during it.
7. **A single self-contained HTML file got to "usable on camera" in one sitting.** Whatever
   Teletubby becomes, the bar for the recording surface is low; the value is in columns 1–2
   and the AI layer, not the shell.

---

## Related

- [concept.md](concept.md) — the three-column model this is measured against
- [open-questions.md](open-questions.md) — Q1 and Q2 are the ones this touches
- `~/dev/ad/brains/kybernesis/video-production.md` — the Phase 1 video programme
- `~/dev/video-projects/v-kybernesis/phase-1/` — both source HTML files and Tom's brief
