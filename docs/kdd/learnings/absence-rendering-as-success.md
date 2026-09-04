---
learning: absence-rendering-as-success
category: correctness
severity: high
date: 2026-08-30
status: open
recurrence: 4
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

## The instances (recurrence: 4 — past the promotion bar)

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

4. **The CLI truncating a SUCCESSFUL large payload** (2026-09-04). `process.exit()` fired
   immediately after `process.stdout.write()`, killing the process before the pipe drained —
   piped output cut at exactly 131072 bytes (the pipe buffer), mid-string. teletubby-agent's
   `json.loads` died on the body of a write that had **applied**, so a success read as a
   failure and the agent shipped a regex workaround for a parse it should never have needed.
   Direct-to-terminal and redirect-to-file were unaffected, which is why it survived every
   by-hand check. Fixed: `process.exitCode` instead of `process.exit()`, so the process exits
   only after stdout flushes. Reproduced at `get_set full` (133,604 bytes → 131,072 through a
   pipe) before the fix; full and valid after.

## The fix, per instance

```ts
// wrong way — an empty requirement passes
pass: measurements.missingTerms.length === 0,   // true for mustTerms = []
actual: 'all'

// right way — say the check did not run
pass: mustTerms.length > 0 && missing.length === 0,
actual: mustTerms.length === 0 ? 'no terms supplied — not checked' : ...
```

Instances 3 and 4 are fixed and shipped. Instances 1 and 2 are open; 2 is the next bug in the
queue, and 1 is waiting on a design decision (where `mustTerms` lives).

## The general rule

**If absence and success would look identical, the code has to say which one it is.** A rule
with nothing to check must report *not checked*, never *passed*; a zone with nothing to drive must
say *nothing authored*, never *finished*; a command with a missing argument must say *missing*,
never *not found*. The test for a new check is: *what does this print when the input is empty,
and could a reader tell?*

This is the same shape the global preferences already legislate for reports ("a check rules out
only its own mechanism"). Four instances in one codebase — past the promotion bar, and the
newest one hid in *process teardown*, not in any check's logic, which is why the family keeps
growing: the shape recurs anywhere output and outcome are reported separately. Promotion is
still **the human's to rule on**, per `README.md`.
