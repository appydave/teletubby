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

## Decisions

| ADR | Title | Status |
|---|---|---|
| [001](decisions/adr-001-rebuild-on-appytron-rather-than-extend-the-artifact.md) | Rebuild on AppyTron rather than extend the working artifact | accepted |

---

## What is not here yet

Nothing has been learned about the things that actually matter to this product — **trigger-word
quality, cadence rewriting, or whether the three-column model works on camera** — because no video
has been recorded from it. The first real takes will produce the learnings worth having.
