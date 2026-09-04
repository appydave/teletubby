---
doc: kdd-index
project: teletubby
status: current
created: 2026-08-19
purpose: the knowledge-driven-development record — what we learned the expensive way, and what we decided
---

# Teletubby KDD

**Learnings** are problem-and-fix records. When the same learning recurs across 3+ sessions it
earns promotion to a **pattern** (none yet — promotion needs recurrence, not enthusiasm).

⚠️ **One candidate is now at the bar**: three learnings below describe the SAME shape — the
renderer failing with no error anywhere (Tailwind `var()` opacity, `hiddenInset`, the Zustand
selector). Left for Lisa to rule on rather than self-promoted.

⚠️ **A second candidate reached the bar on 2026-08-30**: *absence rendering as success* —
three instances (cadence rule 6, the unauthored trigger set, the dropped CLI argument), logged as
one learning with `recurrence: 3` rather than three. Promotion is David's call.
**Decisions** are ADRs.

Curated by Lisa (`appydave:lisa`). Capture one item at a time, reconcile before writing, never mint
a duplicate — bump the existing entry instead.

Seeded 2026-08-19 from the first build session. Every entry below was paid for that day.

---

## Learnings

| Learning | Category | Severity | The one-line version |
|---|---|---|---|
| [Tailwind drops opacity modifiers on `var()` colours](learnings/tailwind-drops-opacity-modifiers-on-var-colours.md) | frontend | high | `bg-canvas/92` compiles to **nothing**. No rule, no warning, no background — the class sits in the JSX looking correct. |
| [`hiddenInset` leaves no drag region](learnings/hiddeninset-leaves-no-drag-region.md) | electron | high | Removing the title bar removes the drag area with it. Every AppyTron app shipped undraggable; the rule existed only in an optional recipe. |
| [An idle agent is not a finished agent](learnings/an-idle-agent-is-not-a-finished-agent.md) | process | high | Two background agents idled three times without delivering. The trap is that your own prompt contains enough summary to fabricate plausible findings from. |
| [A JSON round-trip rewrites the whole file](learnings/a-json-round-trip-rewrites-the-whole-file.md) | tooling | medium | One entry added to a shared config produced 22 lines of phantom diff — in both escaping directions. Insert as text, not as a dump. |
| [An artifact URL is not durable storage](learnings/an-artifact-url-is-not-durable-storage.md) | process | high | The only working prior art was lost: never committed, URL now 404s. The one bullet set that survived did so because it had been **quoted** into a committed doc. |
| [A Zustand selector that builds an array blanks the window](learnings/a-zustand-selector-that-builds-an-array-blanks-the-window.md) | frontend | high | Build clean, typecheck clean, 151 tests green — and the window painted nothing. A new array per call re-renders forever and React tears the tree down, silently. |
| [Correspondence between versions is by authored structure, never index](learnings/correspondence-between-versions-is-by-authored-structure-never-index.md) | domain | high | Flipping Tom ↔ rewrite reset to paragraph 1 because "no honest correspondence exists". It does — the authored topic grouping — and the ragged edge lands on the END, visibly, never the top. (2026-08-30) |
| [Absence rendering as success](learnings/absence-rendering-as-success.md) | correctness | high | Rule 6 passed on an empty term list; an unauthored trigger set lit the end card; a dropped CLI argument said *not found*; `process.exit()` truncated a successful payload mid-pipe so the write's own caller parsed it as a failure. **Recurrence 4 — past the promotion bar, human to rule.** (2026-08-30, +2026-09-04) |
| [An occluded Electron window cannot be screenshotted for proof](learnings/an-occluded-electron-window-cannot-be-screenshotted-for-proof.md) | tooling | medium | Identical pixels before and after an HMR that changed the page. Stale frame, failed render and nothing-to-change look the same; only a focused window or a human proves it. (2026-08-30) |
| [The store has no file watcher — safe only while writes go through the API](learnings/the-store-has-no-file-watcher-safe-only-while-writes-go-through-the-api.md) | architecture | medium | The running app never re-reads `teletubby.json`; live updates exist because `onChange` fires inside the writing process. One direct disk edit = silent divergence. A convention, not an enforcement. (2026-08-31) |
| [A fix to a restore path can itself be a move](learnings/a-fix-to-a-restore-path-can-itself-be-a-move.md) | correctness | high | Re-seating to the paragraph's first trigger yanked the talent back three beats on every agent edit — drift caused by the anti-drift fix. Every restore needs a no-op path: is the current state already right? (2026-08-31) |
| [System evidence cannot answer a workflow question](learnings/system-evidence-cannot-answer-a-workflow-question.md) | process | high | Project UX designed entirely from verified system facts — code, disk, APIs — and no one asked David how he works. "The worst user experience I've seen." Contract questions ≠ workflow questions; for the latter the human is the only primary source. (2026-09-02) |

## Decisions

| ADR | Title | Status |
|---|---|---|
| [001](decisions/adr-001-rebuild-on-appytron-rather-than-extend-the-artifact.md) | Rebuild on AppyTron rather than extend the working artifact | accepted |

---

## What is not here yet

Nothing has been learned about the things that actually matter to this product — **trigger-word
quality, cadence rewriting, or whether the three-column model works on camera** — because no video
has been recorded from it. The first real takes will produce the learnings worth having.
