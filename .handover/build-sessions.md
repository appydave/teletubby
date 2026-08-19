# Teletubby — build handover (3 sessions)

**State**: docs are done and ratified. Nothing left to plan. A working PoC ships — three fixed
columns, keyboard nav over twelve scripts, 38 tests green. **Your job is code.**

**Do not write another planning document.** David has said explicitly we are past documenting.

---

## Read these, in this order

```
/Users/davidcruwys/dev/ad/apps/teletubby/CLAUDE.md          ← start; rules + gotchas
/Users/davidcruwys/dev/ad/apps/teletubby/docs/north-star.md ← ratified; do not reopen
/Users/davidcruwys/dev/ad/apps/teletubby/docs/requirements.md
/Users/davidcruwys/dev/ad/apps/teletubby/docs/spec.md       ← criteria + boundaries
/Users/davidcruwys/dev/ad/apps/teletubby/docs/kdd/README.md ← 5 learnings that cost real time
```

Patterns to consult before designing the control API — **already identified, do not re-derive**:

```
/Users/davidcruwys/dev/ad/brains/agent-first-architecture/external-control-surface-pattern.md
/Users/davidcruwys/dev/ad/brains/agent-first-architecture/capability-model.md
/Users/davidcruwys/dev/ad/brains/agent-first-architecture/agent-safety.md
/Users/davidcruwys/dev/ad/brains/agent-first-architecture/micro-app-with-agent-access.md
```

Data that exists and is not yet loaded by the app:

```
/Users/davidcruwys/dev/ad/brains/kybernesis/phase-1-scripts/       v01–v03 rewrite + tom-original
/Users/davidcruwys/dev/ad/brains/kybernesis/phase-1-scripts/score.py   35 lines, 8 threshold rules
/Users/davidcruwys/dev/ad/brains/kybernesis/phase-1-teletubby-brief.md
```

---

## THE TWO GAPS — David named these; the docs do not cover them

Everything else in the docs stands. These are the missing foundation.

### Gap 1 · No schema for the data shapes — do this first

`src/shared/scripts.ts` carries types, but they are **an artifact of one generator, not a contract**.
Define the shapes properly: provenance transcript · cadence transcript · major topic · minor topic ·
paragraph · trigger sets in styles A/B/C · the map binding triggers to paragraphs.

**Three things the current model gets wrong, and you will hit them immediately:**

1. **There is no minor topic.** The shipped data has ONE heading level (`sections[].heading`).
   Requirements §1 needs **major AND minor**. The zone model in session 2 cannot be built until the
   data carries both.
2. **The map is modelled at the wrong level.** It currently sits on the script (`map: number[]`).
   With three trigger styles per script, **each style has its own step count and therefore its own
   map**. The map belongs to the trigger set, not the script.
3. **Corpus is not modelled at all.** Tom's originals and the re-cadenced rewrites are different
   corpora of the same script, and both must be loadable and switchable (requirements open item 9).

Talent also needs to be a first-class shape — the cadence envelope thresholds are **per talent and
must never be ported between talents** (requirements §9).

### Gap 2 · No control API — and A/B/C cannot work without one

**This corrects an assumption in the current docs.** requirements §5 reads as though the app derives
the three trigger styles itself. **It does not. A/B/C is a data problem, not a display problem.**

The styles have to be *filled with data*, and that authoring is done by an **agent — most likely
Claude Code talking to the app over an API**. The app's job is to expose the surface and switch
between what it has been given. **It never invents triggers.**

This is the North Star's *"yes, but only by making itself drivable"* ruling arriving earlier than the
roadmap assumed. Verbs the agent needs: **read scripts, read projects, create, edit, write, update.**

Non-negotiables from the patterns:

- **One capability core.** Adapters (UI, CLI, MCP) hold **no business logic**.
- **A capability living in the UI process is not externally reachable.** Script editing cannot be a
  button that also contains the logic.
- **The renderer CSP stays `self`-only.** The server lives in **main**; results cross the typed IPC
  bridge. Relaxing the renderer CSP is explicitly not approved (spec Boundaries).
- **Port 7111 is already reserved for exactly this** in `~/.config/appydave/apps.json`. Use it. Bind
  localhost only.
- **Agent safety is not optional** — an agent can call a destructive verb fifty times in three
  seconds. A dry-run/preview primitive belongs in the core verb set, not bolted on.

---

## The three sessions, in order

1. **Schema, then control API.** Nothing visual. Schema first — gap 2 sits on gap 1.
2. **Zone model + camera-aware placement.** Zones the talent selects; driven zone placeable nearest
   the lens; strong/quiet marker ranking preserved in **every** combination. This is the change that
   alters what a take looks like.
3. **A/B/C switching over real data**, loaded through the session-1 API — plus both corpora loadable
   and switchable, so the experiment moves one variable at a time.

**After all three, and only then**: a UX pass using the `design` skill (Claude Design canvas in
Claude Code). **After the capabilities are built, not during.** It is the only design step David
wants.

**Done when** David can open the app, load a script, and record against it, and the reporting side
can be tested.

⚠️ *"The reporting side" is not defined anywhere in the docs. Ask David what it means before
building to it — do not invent a definition.*

---

## Standards — unchanged, enforced per commit

- `npm test` and `npm run typecheck` green **before** each commit
- Navigation rules live in the store, **with a test alongside each rule**
- No raw hex in components; `grep -rc "prefers-color-scheme" src/` returns `0` on every file
- Record a KDD learning in `docs/kdd/learnings/` whenever something costs more than an hour
- Strengthen the existing codebase — **do not restart it.** The 38 tests, the AppyDave light-only
  tokens, and the prior-art carry-over rules all stand.

## Do NOT build

The AI layer (live listening, waffle detection, sync-to-voice, trigger *generation*) · recording ·
clip capture · human editing controls for scripts · **anything against FliHub** — ruled 2026-08-19 as
future and explicitly not a contract.

## Traps already paid for — read `docs/kdd/` before you hit them again

- Tailwind **silently drops** an opacity modifier on a `var()` colour. `bg-canvas/92` compiles to
  nothing. Check the built CSS, not the JSX.
- `titleBarStyle: hiddenInset` leaves no drag region. Fixed here and upstream; do not regress it.
- **An idle agent is not a finished agent.** If you delegate, have the agent write to a named path
  and check the file exists. Never reconstruct a delegated finding from your own prompt.
- `packageManager` is **not pinned** and should be (`npm@11.11.0`). pnpm blocks postinstall, and
  Electron's postinstall is what downloads the binary. One line; David has already approved raising
  it — confirm and do it in session 1.

## Working style

David does **not** want to be involved turn by turn. Work autonomously, commit and push as you go,
and surface only decisions that are genuinely his — the `docs/spec.md` Open Questions list is the
short version of those.
