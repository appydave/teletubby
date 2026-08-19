# Spec: Teletubby

**Status:** draft. A doubt-driven pass has run over it — its findings are folded in, and the two
it changed are marked in Open Questions §6 and under Boundaries. Not yet a build contract.

**This is a brownfield spec.** A working proof of concept already ships — the three-column reading
surface with keyboard navigation over the twelve Kybernesis scripts, 38 tests passing. This document
specifies the *next* state, and marks throughout what is **built** versus **specified**.

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
| Ports | **7110** renderer dev server (`strictPort`), 7111 reserved. Registered in `apps.json`. |

⚠️ **`packageManager` is not pinned, and it should be.** ImageDrip pins `npm@11.11.0` because pnpm
10+ blocks postinstall, and Electron's postinstall is what downloads the Electron binary — `pnpm
install` yields a package with no Electron in it and fails later, confusingly. Teletubby has the
same shape and no guard. See Open Questions.

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

Regen data: npm run build:data          # rebuilds src/shared/scripts.ts
```

## Project Structure

```
src/main/          Electron main — window, IPC router, console lifecycle
src/preload/       The ONLY renderer↔main door; exposes window.appytron
src/renderer/src/  React app
  ├── App.tsx        chrome, keyboard map, stage composition
  ├── store.ts       Zustand — ALL navigation rules live here
  ├── index.css      design tokens (the single source of colour)
  └── components/    Lanes · CueOverlay · EndCard
src/shared/        Types and data crossing the boundary
  ├── ipc.ts         the typed IPC contract
  ├── scripts.ts     GENERATED — do not edit by hand
  └── data/          the verbatim Phase 1 source JSON
scripts/           build-scripts-data.mjs — authors scripts.ts
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

Vitest, node environment, specs in `test/`. **38 passing today.**

| Level | What it covers | Where |
|---|---|---|
| **Data invariants** | The authored bullet→paragraph maps: length matches step count, no index past the last paragraph, monotonically non-decreasing, spans the whole script | `test/scripts-data.test.ts` |
| **Navigation rules** | Clamping, boundary refusal, lane track, cue cards, toggles — driven through the store with no DOM | `test/prompter-navigation.test.ts` |
| **Scaffold primitives** | FileAuthor, ProcessSupervisor | inherited from AppyTron |

**Coverage expectation is not a percentage.** The rule: **every rule in requirements.md that can be
expressed as a store assertion must have one.** A rule with no test is a rule that will regress.

**What tests cannot cover, and must not be claimed as covered**: whether the talent looks at the
camera, whether a trigger style works on camera, whether cadence rewriting sounds like David. Those
are settled by recording takes. A green suite says the mechanism works, never that the product does.

## Boundaries

**Always:**
- Run `npm test` and `npm run typecheck` before committing
- Regenerate `scripts.ts` via `npm run build:data` — never hand-edit it
- Consume design tokens; verify `grep -rc "prefers-color-scheme" src/` returns `0` on every file
- Keep navigation rules in the store, and add a test with the rule
- Record a learning in `docs/kdd/learnings/` when something costs more than an hour

**Ask first:**
- Adding a dependency, or anything that touches the network. **The renderer CSP is `self` only and
  stays that way** — criterion 16 needs a live connection to FliHub, and that connection belongs in
  the main process with results crossing the typed IPC bridge. Relaxing the renderer CSP to reach
  FliHub directly is the wrong fix and is not approved.
- Changing the keyboard map, the port, or the IPC surface
- Any change to the zone model, the camera rule, or the trigger styles — those are ruled
- Editing files under `docs/` that carry rulings (`north-star.md`)

**Never:**
- Emit an OS-theme media query or a `dark:` variant — AppyDave is light-only
- Record, capture, stitch, or write a video file — Teletubby owns none of that
- Add human editing controls for scripts — editing arrives via agent tools
- Let one key mean two scales of movement, or cross a script boundary silently
- Hand-edit `src/shared/scripts.ts`, or derive the bullet→paragraph map positionally
- Ship a feature that adds something to read

## Success Criteria

Numbered so a review can accept or reject each one independently.

**Built and verified (2026-08-19)**
1. `npm run dev` launches the Electron app; window opens; no console errors ✅
2. All twelve scripts load and are selectable ✅
3. Arrow/space steps triggers and the transcript stays in sync via the authored map ✅
4. Stepping cannot cross a script boundary; the end card nudges instead ✅
5. Mirror mode and three named text presets work ✅
6. `grep -rc "prefers-color-scheme" src/` returns `0`; no raw hex in components ✅
7. 38 tests and both typechecks pass ✅
8. The window can be dragged ✅

**Specified, not built**
9. The talent can choose which zones are on screen, from the combinations in requirements §1 — and any chosen combination stays aligned as they move
10. The driven zone carries the strong marker and any follower a quieter one, in **every** combination — never two equal markers
11. The full transcript slides from a left **or** right edge, chosen by the talent, without moving the driven zone away from the camera
12. The window and the zone order can both be arranged so the driven zone sits nearest the lens, on either side
13. The set view lists every script in the set with a summary, one script visible at a time, reachable by keyboard
14. All three trigger styles are derived for every script, and switching between them mid-session keeps the beat position
15. A provenance transcript and a cadence transcript are both viewable and clearly distinguished
16. On a take landing in the FliHub queue, Teletubby receives the transcript and reports a Jaccard comparison against what was intended — **over a socket connection opened from main, never from the renderer** (see the CSP note under Boundaries)
17. Every rule in 9–16 that can be a store assertion has a test

**Explicitly out of scope for this spec**: live listening, waffle detection, sync-to-voice, automatic
trigger generation, cadence rewriting, and script authoring. Named in the North Star; not specified
here.

## Open Questions

Blocking ones first.

1. **Does Teletubby hold an incoming idea, or only a transcript?** (requirements §0). Decides whether
   this is a prompter or a content tool. **Everything downstream of criterion 13 depends on it.**
2. **Where does the app learn the camera edge?** Criterion 12 is untestable until the app knows which
   side the lens is on — talent sets it, or it is inferred from window position.
3. **Should `packageManager` be pinned to npm now?** One line, prevents a failure ImageDrip already
   paid for. Recommend yes.
4. **What happens on a poor Jaccard score mid-take?** Interrupting the talent to say they fluffed it
   fails the objective outright.
5. **How does a talent with no corpus get a speech profile?** David's 11.5-word breath group came
   from 45 takes; a new talent has none.
6. **The FliHub contract — checked, and mostly better than assumed.** Verified against FliHub's
   source rather than left as an assumption:
   - ✅ **The push mechanism exists.** FliHub runs socket.io throughout, and its `WatcherManager`
     already runs a transcripts watcher that emits **`transcripts:changed`**.
   - ✅ **Transcript retrieval exists** — a transcriptions route module with
     `GET /transcript/:filename`, `GET /status/:filename` and `POST /queue`.
   - ⚠️ **But "transcribe on landing" is a change to FliHub, not to Teletubby.** Transcription is
     *queued* (`POST /queue`); nothing observed makes it fire automatically when a take arrives.
     requirements §8 reads as though FliHub simply does this — **it does not yet.** Something has to
     call the queue on arrival, and that work lands in FliHub's repo.
   - ⚠️ **Cross-repo dependency, and FliHub is slated for a ground-up rebuild.** Building against
     today's routes may be building against a surface that is about to change.

   **Open**: is criterion 16 in this spec at all, or does it wait for the FliHub rebuild? Specifying
   a contract across a repo that is about to be rewritten is how you get two wrong contracts.
