---
learning: absence-rendering-as-success
category: correctness
severity: high
date: 2026-08-30
status: open
recurrence: 3
files:
  - src/core/cadence.ts
  - test/cadence-gate.test.ts
  - src/renderer/src/store.ts
  - bin/teletubby.mjs
---

# Absence rendering as success

**The one-line version**: three separate places in this app reported a **pass, an end, or a
not-found** when the truthful answer was *nothing was supplied*. The two states looked identical
on screen and in the log, and in every case someone acted on the wrong one.

## The three instances (recurrence: 3 — at the promotion bar)

1. **The cadence gate, rule 6** (`src/core/cadence.ts:196-205`). `mustTerms` is an optional
   argument that nothing persists — not on `Script`, not in the seed, not in the store, and not
   in the Python original either (`score.py` defaults `must=()`; no caller passes a list). With an
   empty list the rule reports `pass: true, actual: 'all'`. The pinned tests asserting v01–v03
   pass call `scoreAgainst(text, david)` with no terms, so **rule 6 was never exercised** and
   "eight rules passed" was quoted all day when seven had. An agent authoring script 04 had to
   invent its own term list to make the gate real — an agent inventing the fidelity list it is
   then judged against is not a gate.

2. **A transcript with no trigger set** (`store.ts` `isLastStep` → `true` when
   `triggers.length === 0`; `currentParagraph` derives from the trigger map so it is
   `undefined`). The paragraph zone painted `—` and the end card lit yellow. David, in front of
   the agent: *"number four is not on teletubby."* The data was there and correct. Only the
   trigger lane said "no trigger words authored yet" — and on his rig that lane was the quiet
   follower, while the two loud zones said *empty* and *over*. Not yet fixed.

3. **The CLI dropping a positional argument** (commit `55ae4db`). A bare positional JSON was
   parsed as a second positional and discarded, and the call returned
   `not_found: no set specified` — which reads as *that set does not exist*, so you hunt for
   missing data instead of your own vanished argument. Fixed: the CLI refuses a stray positional
   and names the right form.

## The fix, per instance

```ts
// wrong way — an empty requirement passes
pass: measurements.missingTerms.length === 0,   // true for mustTerms = []
actual: 'all'

// right way — say the check did not run
pass: mustTerms.length > 0 && missing.length === 0,
actual: mustTerms.length === 0 ? 'no terms supplied — not checked' : ...
```

Instance 3 shipped in `55ae4db`. Instances 1 and 2 are open; 2 is the next bug in the queue, and
1 is waiting on a design decision (where `mustTerms` lives).

## The general rule

**If absence and success would look identical, the code has to say which one it is.** A rule
with nothing to check must report *not checked*, never *passed*; a zone with nothing to drive must
say *nothing authored*, never *finished*; a command with a missing argument must say *missing*,
never *not found*. The test for a new check is: *what does this print when the input is empty,
and could a reader tell?*

This is the same shape the global preferences already legislate for reports ("a check rules out
only its own mechanism"). Three instances in one codebase, two of them found on one day, is what
the promotion bar is for — **left for the human to rule on**, per `README.md`.
