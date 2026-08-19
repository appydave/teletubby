# Spec: Teletubby

**Status:** draft. A doubt-driven pass has run over it — its findings are folded in, and the two
it changed are marked in Open Questions §6 and under Boundaries. Not yet a build contract.

**This is a brownfield spec.** Session 1 (schema + control API) has landed: the domain model, the
capability core, the loopback control surface on 7111, the CLI, and the deterministic cadence gate.
146 tests passing. The three-column reading surface still runs on the legacy flat data and has not
been migrated onto the domain model — that is session 2. This document marks throughout what is
**built** versus **specified**.

**Inputs, not questions.** Direction is settled in [north-star.md](north-star.md) (interviewed and
ratified 2026-08-19) and behaviour in [requirements.md](requirements.md). Nothing here reopens
either. This spec adds the half they do not carry: **acceptance criteria and boundaries.**

---

## Objective

**Put the words in front of the talent in a shape they can talk to rather than read from — and learn
from every fumbled take so the next one comes out better.**

**The user** is the *talent* — the person on camera. David first; beyond him, any content creator who
struggles with reading a script. On an AppyDave video the originator, talent and operator are all
David; on the Kybernesis explainers they already split.

**Success looks like** a recording session where the talent's attention is on the lens rather than
the screen, and where the tool is measurably better on the tenth take than the first.

**Every feature argument is settled by one question:** *does it put more of the talent's attention on
the camera, and less on the screen?*

## Tech Stack

Scaffolded from `create-appytron`, matched to ImageDrip.

| | |
|---|---|
| Shell | Electron 34 · electron-vite 3 · electron-builder 25 |
| Renderer | React 18.3 · Tailwind 3.4 (`darkMode: []`) · Zustand 5 |
| Language | TypeScript 5.7, strict, two tsconfigs (node / web) |
| Core | `@appydave/core` ^0.1.0 — Lifecycle · Config · Logger · Store |
| Tests | Vitest 2.1, node environment |
| Ports | **7110** renderer dev server (`strictPort`), **7111** the loopback control API. Both registered in `apps.json`. |

✅ **`packageManager` is pinned to `npm@11.11.0`.** pnpm 10+ blocks postinstall, and Electron's
postinstall is what downloads the Electron binary — `pnpm install` yields a package with no Electron
in it and fails later, confusingly. ImageDrip paid for this once; Teletubby now has the guard.

## Commands

```
Install:    npm install                 # npm ONLY — see the packageManager note above
Dev:        npm run dev                 # Electron + renderer on :7110
Build:      npm run build
Preview:    npm run start
Package:    npm run package             # electron-vite build && electron-builder
Release:    npm run release:mac         # --mac --publish always

Test:       npm test                    # vitest run
Test watch: npm run test:watch
Typecheck:  npm run typecheck           # node + web
Format:     npm run format              # prettier --write .

Regen data: npm run build:data          # rebuilds script-set.ts AND scripts.ts

Drive it:   teletubby health             # app up? (no token)
            teletubby capabilities       # every verb + contract
            teletubby call <name> --input '<json>'
```

## Project Structure

```
src/main/          Electron main — window, IPC router, console lifecycle
  └── control-server.ts  the loopback HTTP adapter (7111). ADAPTER ONLY, no logic
src/core/          THE CAPABILITY CORE — the only place business logic lives
  ├── index.ts       createCore + invoke: the one entry point every adapter uses
  ├── handlers.ts    the verb implementations
  ├── safety.ts      THE GATE — principals, confirmations, idempotency, rate, audit
  ├── repository.ts  persistence (memory for tests, atomic JSON on disk)
  ├── cadence.ts     the score.py port — eight deterministic rules
  └── active-context.ts  the expiring ambient selection
src/preload/       The ONLY renderer↔main door; exposes window.appytron
src/renderer/src/  React app
  ├── App.tsx        chrome, keyboard map, stage composition
  ├── store.ts       Zustand — ALL navigation rules live here
  ├── index.css      design tokens (the single source of colour)
  └── components/    Lanes · CueOverlay · EndCard
src/shared/        Types and data crossing the boundary
  ├── domain.ts      THE DOMAIN — shapes, zod schemas, structural rules
  ├── capabilities.ts  THE CATALOG — every verb, with its contract and metadata
  ├── ipc.ts         the typed IPC contract
  ├── script-set.ts  GENERATED — the domain model. Do not edit by hand
  ├── scripts.ts     GENERATED — legacy flat view for the renderer. Removed in session 2
  └── data/          the verbatim Phase 1 source JSON
bin/teletubby.mjs  the CLI — a fetch() wrapper, deliberately stupid
scripts/           build-scripts-data.mjs + authored-domain.mjs — author both generated files
test/              Vitest specs
docs/              north-star · requirements · this spec · kdd/ · prior-art
```

## Code Style

**Colour comes from tokens, never from a hex value in a component.**

```tsx
// GOOD — semantic token, ranked marker
const markerBar = (rank: Rank, active: boolean): string => {
  if (!active) return 'border-l-2 border-transparent';
  return rank === 'driven'
    ? 'border-l-4 border-driven bg-driven-wash'
    : 'border-l-4 border-follower bg-follower-wash';
};

// BAD — raw hex, and an opacity modifier that compiles to nothing
<div className="border-l-4 border-[#ffde59] bg-canvas/92" />
```

- **Navigation rules live in the store, not in components.** A component may render state; it may
  not decide what a keypress means. This is what makes the rules testable without a DOM.
- **Every non-obvious rule carries the bug that earned it**, in a comment, with a pointer to the
  prior-art section or KDD learning.
- Named presets over steppers; `data-*` attributes over per-component sizing.
- Prettier for formatting. No custom lint config beyond it.

## Testing Strategy

Vitest, node environment, specs in `test/`. **146 passing today.**

| Level | What it covers | Where |
|---|---|---|
| **Data invariants (legacy)** | The authored bullet→paragraph maps on the flat shape | `test/scripts-data.test.ts` |
| **Domain rules** | Both corpora present, two heading levels, per-style maps, provenance/cadence distinction, and every structural rule a schema cannot express | `test/domain.test.ts` |
| **Navigation rules** | Clamping, boundary refusal, lane track, cue cards, toggles — through the store with no DOM | `test/prompter-navigation.test.ts` |
| **The published surface** | The exact verb set per principal, pinned. Every verb has a handler and every handler is published | `test/capability-surface.test.ts` |
| **Capability behaviour** | The verbs doing their jobs, especially `write_trigger_set` | `test/capabilities.test.ts` |
| **Agent safety** | Principal narrowing, preview→confirm→execute, idempotency, rate limiting, audit, ambient-context expiry | `test/agent-safety.test.ts` |
| **The control surface** | Real HTTP: token auth, status-code mapping, loopback binding, discovery file | `test/control-server.test.ts` |
| **Cadence gate** | Per-document parity with `score.py` on all three Kybernesis pairs | `test/cadence-gate.test.ts` |
| **Scaffold primitives** | FileAuthor, ProcessSupervisor | inherited from AppyTron |

**Coverage expectation is not a percentage.** The rule: **every rule in requirements.md that can be
expressed as a store assertion must have one.** A rule with no test is a rule that will regress.

**What tests cannot cover, and must not be claimed as covered**: whether the talent looks at the
camera, whether a trigger style works on camera, whether cadence rewriting sounds like David. Those
are settled by recording takes. A green suite says the mechanism works, never that the product does.

## Boundaries

**Always:**
- Run `npm test` and `npm run typecheck` before committing
- Regenerate `script-set.ts` and `scripts.ts` via `npm run build:data` — never hand-edit either
- Consume design tokens; verify `grep -rc "prefers-color-scheme" src/` returns `0` on every file
- Keep navigation rules in the store, and add a test with the rule
- Record a learning in `docs/kdd/learnings/` when something costs more than an hour

**Ask first:**
- Adding a dependency, or anything that touches the network. **The renderer CSP is `self` only and
  stays that way** — criterion 16 needs a live connection to FliHub, and that connection belongs in
  the main process with results crossing the typed IPC bridge. Relaxing the renderer CSP to reach
  FliHub directly is the wrong fix and is not approved.
- Changing the keyboard map, the port, or the IPC surface
- **Adding or re-scoping a capability.** Both gates below apply, and
  `test/capability-surface.test.ts` fails until the published set is updated deliberately
- Any change to the zone model, the camera rule, or the trigger styles — those are ruled
- Editing files under `docs/` that carry rulings (`north-star.md`)

**Never:**
- Emit an OS-theme media query or a `dark:` variant — AppyDave is light-only
- Record, capture, stitch, or write a video file — Teletubby owns none of that
- Add human editing controls for scripts — editing arrives via agent tools
- Let one key mean two scales of movement, or cross a script boundary silently
- Hand-edit a generated file, or derive the trigger→paragraph map positionally
- Put authorization in an adapter, or a business rule in one
- Expose `approve_pending`, `list_pending` or `set_active_context` on the agent surface
- Bind the control server to anything but 127.0.0.1
- Ship a feature that adds something to read

### The two gates — every PR that adds or re-scopes a capability

**Reachability.** A capability reachable from the UI and not headlessly *is a regression*.

```markdown
- [ ] Capability defined (typed input + output + metadata in `src/shared/capabilities.ts`)
- [ ] Implemented once in `src/core/` — no logic in any adapter
- [ ] Reachable headlessly (automatic, unless you made it UI-only — then say why)
- [ ] All of the above land in THIS PR
```

**Safety.** Reachability is not safety; a capability can pass the gate above and still be
dangerously exposed.

```markdown
- [ ] Classified: read-only / reversible-write / destructive / external-side-effect
- [ ] Authorization enforced in `src/core/safety.ts` — NOT in an adapter, NOT in a prompt
- [ ] Agent principal is narrower than the UI's
- [ ] Destructive: preview/dry-run exists AND a human approves it before it acts
- [ ] Meaningful effect: accepts an idempotency key, returns the original result on retry
- [ ] Audit record includes principal, parameters, and prior state
- [ ] Failure modes enumerated and distinguishable
- [ ] Confirmation / override / approval channels are NOT on the agent surface
- [ ] `test/capability-surface.test.ts` updated deliberately, not to make CI pass
```

Unticked boxes need a reason. "Later" is not one, and neither is "the agent won't do that".

## Success Criteria

Numbered so a review can accept or reject each one independently.

**Built and verified (2026-08-19) — the proof of concept**
1. `npm run dev` launches the Electron app; window opens; no console errors ✅
2. All twelve scripts load and are selectable ✅
3. Arrow/space steps triggers and the transcript stays in sync via the authored map ✅
4. Stepping cannot cross a script boundary; the end card nudges instead ✅
5. Mirror mode and three named text presets work ✅
6. `grep -rc "prefers-color-scheme" src/` returns `0`; no raw hex in components ✅
7. 38 tests and both typechecks pass ✅
8. The window can be dragged ✅

**Built and verified (2026-08-19) — session 1: schema + control API**
S1. The domain carries major AND minor topics, per-trigger-set maps bound to paragraph ids, and corpus as a first-class field ✅
S2. Both corpora are loadable — Tom's originals for all twelve, plus the three re-cadenced transcripts ✅
S3. An agent can read scripts and projects, and create/edit/write/update them, over a loopback API on 7111 reaching the same store as the UI ✅
S4. Every verb runs through one authorization gate beneath every adapter; the agent principal is narrower than the UI's ✅
S5. Destructive verbs preview → confirm → execute, and the approval channel is not on the agent surface ✅
S6. The published capability set is pinned by a test ✅
S7. `packageManager` pinned to `npm@11.11.0` ✅

**Specified, not built**
9. The talent can choose which zones are on screen, from the combinations in requirements §1 — and any chosen combination stays aligned as they move
10. The driven zone carries the strong marker and any follower a quieter one, in **every** combination — never two equal markers
11. The full transcript slides from a left **or** right edge, chosen by the talent, without moving the driven zone away from the camera
12. The window and the zone order can both be arranged so the driven zone sits nearest the lens, on either side
13. The set view lists every script in the set with a summary, one script visible at a time, reachable by keyboard
14. All three trigger styles are derived for every script, and switching between them mid-session keeps the beat position — **partly built:** script 01 carries all three on both corpora, and switching holds the PARAGRAPH rather than the step index. Scripts 02–12 carry style B only, pending a first take
15. ✅ **Built.** A provenance transcript and a cadence transcript are both viewable and clearly distinguished — **three real pairs already exist** (`phase-1-scripts/v0N-rewrite.txt` + `v0N-tom-original.txt`), so this is partly satisfiable today rather than pending; the build currently loads only the originals
16. ~~On a take landing in the FliHub queue…~~ **BLOCKED — removed from this spec.** Ruled
    2026-08-19: FliHub cannot be relied on for this yet, it is all future, and it is slated for a
    ground-up rebuild. See requirements §8, which is now marked direction-only. **Replaced by
    criterion 16b.**
16b. A script is scored against the talent's measured envelope **before it is put on screen**, and a
    failing script is visibly flagged or refused. Deterministic — eight threshold rules, no model, no
    transcript, no FliHub. Thresholds are per talent and never ported between talents.
    **Half built:** the gate exists and is reachable as `score_transcript`, with per-document parity
    against `score.py` pinned by a test. The *visible flag* is UI and waits for session 2.

17. Every rule in 9–16 that can be a store assertion has a test

**Explicitly out of scope for this spec**: live listening, waffle detection, sync-to-voice, automatic
trigger *generation*, cadence *rewriting*, and script authoring. Named in the North Star; not
specified here.

⚠️ **Scope correction — cadence *checking* is not AI work and does not belong in the deferred layer.**
Generating a re-cadenced script may need a model. **Verifying that a script sits inside the talent's
measured envelope does not** — it is eight deterministic threshold rules and ~35 lines of stdlib,
already written and reproducible. That is why criterion 16b is in this spec while cadence rewriting
stays out. The honest position is *"the acceptance test exists, the generator does not"* — the three
re-cadenced scripts were rewritten by hand against the gate.

## Open Questions

Blocking ones first.

1. **Does Teletubby hold an incoming idea, or only a transcript?** (requirements §0). Decides whether
   this is a prompter or a content tool. **Everything downstream of criterion 13 depends on it.**
2. **Where does the app learn the camera edge?** Criterion 12 is untestable until the app knows which
   side the lens is on — talent sets it, or it is inferred from window position.
3. ~~**Should `packageManager` be pinned to npm now?**~~ **Done** — `npm@11.11.0`, pinned in
   session 1.
4. ~~**What happens on a poor Jaccard score mid-take?**~~ **Answered.** Score the script before the
   take; score a take only at its boundary. Interrupting mid-sentence fails the objective. The
   mid-take half is blocked on FliHub regardless.
5. ~~**How does a talent with no corpus get a speech profile?**~~ **Answered.** From any corpus of
   their own *punctuated* unscripted speech via `verbal-style-forge` — David's envelope came from
   318 transcripts / ~229k words of ordinary published video, not from the 45 takes. Auto-captions
   must be filtered out; they are unpunctuated and corrupt the measure.
6. **FliHub — ruled out for now.** I verified socket.io and a transcriptions module exist in
   FliHub's current source, and was about to specify against them. **David's ruling supersedes that
   reading**: the queue-and-promote model came from one conversation about where FliHub *should* go,
   it is not a contract, and FliHub is being rebuilt from the ground up. Specifying against today's
   routes would produce a contract against a surface that is about to vanish.
7. **Which corpus does the trigger-style experiment run against?** Styles derived from Tom's 7-word
   breath groups are not the same experiment as styles derived from the 11-word re-cadenced
   versions. Criteria #14 and #15 only mean what they say if both corpora are loadable.
