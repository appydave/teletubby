---
doc: session-checkpoint
project: teletubby
date: 2026-08-31
session: app-dev fix-it session, recording day 2 (scripts 04–07 shot with the app live)
status: all work committed and pushed; queue is design-ratified, unbuilt
---

# Checkpoint — 2026-08-31, end of recording-day session

Written at machine shutdown. Everything below the SHIPPED line is the part that
existed only in the session window; it is the payload.

## Shipped today (all on `main`, all pushed, all verified by David in the running app)

- `790c0b0` arrival dot — a corpus that arrives/changes unselected pulses until selected
- `a0fd941` provenance chips: dashed ghost + "source" tag; dark ink when selected, never yellow
- `8f2fb34` Shift+⌘-arrows made inert — reserved for version stepping
- `e0f5550` position restore + refresh re-seats by paragraph (never index)
- `4670ac8` ⌘←/⌘→ script stepping (stops at ends, matches footer)
- `4c13fab` click-to-copy titles (full model text, confirm/fail states)
- `78cff4e` zone labels at the lane FEET, never hidden
- `0b73794` CLAUDE.md rule: during a recording block the prompter is a live instrument —
  no renderer change lands unannounced (stage behind a take boundary, or one line first)
- KDD: +4 learnings (absence-rendering-as-success rec=4 · restore-needs-a-no-op-path ·
  no-file-watcher constraint · occluded-window screenshots) — see `docs/kdd/README.md`

Suite at close: **296/296**, typecheck clean, tree clean, 0 unpushed.

## The queue (ranked, ratified, UNBUILT — first item after the next recording block)

### 1+2 · Version history AND the atomic transcript+map write — ONE feature, one spine

⚠️ **These are not two tickets. Build order inside the feature:**

1. A core-level **`replaceTranscript(candidate)` seam** — ONE candidate transcript
   (text + trigger sets together) validated whole and swapped atomically inside a single
   `repository.update`. `write_transcript` and `write_trigger_set` become callers of it,
   and it gains an input form carrying both (this resolves the agent's deadlock on 07).
2. **Revisions hang off that seam** — every atomic swap archives exactly one
   `TranscriptRevision`.

**Why the order is load-bearing: versioning built without the seam freezes broken
intermediate states (new text, stale map) into history** — the agent's text-then-map
two-verb dance would mint two revisions for one logical edit, and Shift+⌘← would step
David through a state that never existed on screen.

⚠️ **The deadlock's two refusals were both CORRECT.** `write_transcript` refuses a map
pointing at a removed paragraph; `write_trigger_set` validates against current text;
`domain.ts:330` pins first/final triggers to real paragraphs. A future session reading
"deadlock" will be tempted to loosen a gate — **that is a regression, not a fix**. The
answer is the wider transaction above. (The agent's workaround — reuse the last
paragraph instead of deleting it — was right and stands.)

**Ratified version-history model** (orchestrator ruling, 2026-08-31, on David's ask):
revisions INSIDE a transcript (`corpus` = meaning axis, `revision` = time axis — chip
explosion is the symptom, semantic collision is the disease; put that in the type
comment). Same JSON file (one-process-one-file is a KDD invariant). Auto-archive on both
write verbs — explicit checkpoints rejected: optional safety = no safety (the mustTerms
vacuity, instance 3). FIFO cap 20, count visible in reads. Step-BACK IS A VIEW;
`restore_revision` is explicit and itself mints a revision — nothing destroyed, redo
free. Keybinding Shift+⌘←/→, currently inert on purpose; ship chord + feature as one
change. `workspace.position` gains `revision: number|null`; pruned → live + topic-map.
Paragraph identity across versions uses `correspondingParagraphId` + the refresh no-op
fast path — both already built and pinned.

**Numbers measured for the design** (nobody else wrote these down):
store 113,135 bytes; transcripts mean 2.8KB / max 4.8KB ⇒ ~3–5KB per archived revision,
~250KB/day worst case uncapped at 50 writes/day. `recordPrior` (core/index.ts:154) is
audit-log-only, one-deep, ephemeral — concept exists, storage does not.

### 3–6 · Older tickets, still open, David-gated where noted

- **Publish per-verb INPUT shapes** in `describe_capabilities` — feature; David said yes-not-today via orch.
- **Empty trigger set renders as end-of-script** — bug, cleared to fix; repro = script 02/03
  rewrites (0 sets). Mechanism traced: `isLastStep` → true on 0 triggers; `currentParagraph`
  → undefined → `—`. Fix = say "nothing authored" in the driven zone instead.
- **`mustTerms`** — verified vacuous in gate, pinned tests AND the Python original; where
  terms live is a David design decision. Do not silently make rule 6 pass-by-default.
- **`teletubby` CLI not on PATH** — parked; halves are ALTERNATIVES (ship bin OR fix the
  skill docs at `~/.claude/skills/teletubby/` — outside this repo). David's scope call.

## Standing rules earned this session (already durable in CLAUDE.md / KDD, listed for recall)

- Live-instrument rule (CLAUDE.md, run section) — announce before any mid-shoot repaint.
- Capture learnings via `appydave:lisa` (CLAUDE.md) — docs-only changes ship on session judgement.
- `absence-rendering-as-success` is at recurrence 4 — promotion to pattern is David's call.

## Single next action

Open the next session in this repo, read this file, and start on the
`replaceTranscript` seam (queue item 1+2). The app runs detached under overmind
(`npm run app` / `app:status` — see the `teletubby` skill); do not use `npm run dev`.
