# Teletubby

## North Star

> **Put the words in front of the talent in a shape they can talk to rather than read from —
> and learn from every fumbled take so the next one comes out better.**

Interviewed and ratified by David, 2026-08-19. Full document — including who this is for,
whether it edits scripts, what Teletubby is NOT, and the test that settles feature arguments:
**[docs/north-star.md](docs/north-star.md)**.

The corollary that follows from it: three columns instead of one scrolling wall of text —
topic headings · trigger words · full transcript. **Column 2 is the product**, everything else
is context.

**The test, when a feature argument comes up:** *does it put more of the talent's attention on
the camera, and less on the screen?* If it adds something to read, or a control to learn, it
does not fit.

⚠️ **"Prompting" in this repo always means teleprompter craft — never LLM prompt engineering.**

What gets built — the zone model, the camera-position constraint, trigger styles:
**[docs/requirements.md](docs/requirements.md)**.

Background: [docs/concept.md](docs/concept.md) · origin brainstorm
[Captain's Log B421](docs/source/b421-2026-08-19-plaud.md).

---

## Current state

**Sessions 1 and 2 have landed, and the renderer is now a client of the capability core.**

1. **The capability core + control API** (session 1) — the domain model, and a loopback HTTP
   surface on **7111** that lets an agent read and write scripts, transcripts and trigger sets.
2. **The zone model** (session 2) — four selectable zones, the driven zone placeable nearest
   the lens, and both corpora switchable. The renderer loads everything through
   `window.appytron.invoke` with the `ui` principal; it imports no script data.

**The legacy flat `src/shared/scripts.ts` is gone**, along with its test. One generated shape,
one authoring source.

⚠️ **The trigger words are CANDIDATES, not an answer.** The North Star rules that what a trigger
word actually is gets settled by the talent recording takes, and never by argument. Every set in
`scripts/authored-domain.mjs` is there to be tested and thrown out cheaply.

3. **The A/B/C experiment** (session 3) — script 01 carries all three styles on **both**
   corpora, so the talent can move one variable at a time: which cadence, and which trigger
   style. Six combinations, six takes.

⚠️ **Scripts 02–12 still carry only the style-B specimen**, and their re-cadenced transcripts
have no trigger set. That is deliberate — six takes answers the blocking question and 72
trigger sets nobody shoots does not. Author more only once script 01 has been recorded.

⚠️ **The renderer loads once, at startup.** An agent writing a trigger set through the API does
NOT appear in a running window — the store changed, the UI did not. Restart to pick it up. This
is the Event primitive being earned: a client reduced to polling (or restarting) is the signal
that it is time to add one.

**Explicitly NOT built, and not to be added without asking:**
the AI layer (live listening, waffle detection, sync-to-voice, trigger *generation*),
any recording or clip capture, and human editing controls for scripts. Column 1 is a display
column — nothing generates those headings automatically.

Recording is not ours and never will be: the talent drives Ecamm, FliHub watches the folder
and queues the takes. Script editing arrives by making the app **drivable** by an agent, not
by growing an editor — see the North Star.

---

## The capability core — read this before adding any feature

**One API, N clients, none privileged.** Every verb lives in `src/shared/capabilities.ts` and
is implemented once in `src/core/`. The renderer reaches it over IPC with the `ui` principal;
an agent reaches it over loopback HTTP with the `agent` principal. Adapters hold **no**
business logic.

```
  renderer ── control:invoke ──┐
  agent    ── POST /api/invoke ┼──►  core.invoke  ──►  [GATE]  ──►  handler  ──►  repository
  CLI      ── bin/teletubby ───┘
```

**The rule that keeps it true:** a capability reachable from the UI and not headlessly **is a
regression**, and both land in the same PR. "I'll do the API later" is not a reason. A
capability that lives in the renderer is not externally reachable no matter what the catalog
says — that is how Open Design shipped an export verb that can never succeed.

**Before exposing anything new**, both gates in `docs/spec.md` apply, and
`test/capability-surface.test.ts` **pins the published set**. If it fails, do not edit the list
to make it pass — decide deliberately that the verb belongs on the surface it claims.

Three verbs are **UI-only, permanently**: `approve_pending`, `list_pending` and
`set_active_context`. The mechanism that satisfies a control must never be reachable through
the surface that control constrains, and the talent's selection is not the agent's to forge.

Destructive verbs are **preview → confirm → execute**. A `dryRun`, or a call with no approval,
returns a preview and a `pendingId`; a human approves it in the UI; only then does the verb
act, and only for the exact input that was approved.

```bash
teletubby health           # is the app up? (no token needed)
teletubby capabilities     # every verb, with its contract
teletubby call get_set
```

The app must be running — the surface lives in its process. Port and token come from
`~/Library/Application Support/teletubby/control.json`, written per launch.

## Running it

```bash
npm install        # npm ONLY — packageManager is pinned; pnpm blocks Electron's postinstall
npm run dev        # Electron app; renderer on 7110, control API on 7111 (registered slots)
npm test           # 153 tests
npm run typecheck
```

## The rules this app is built on

These come from `docs/prior-art-kybernesis-prompter.md` — a working two-column prompter
David drove live the day before this repo existed. They are **requirements, not
preferences**; each one is a bug that already happened once.

1. **Stepping is clamped inside its unit. One key means one scale of movement.**
   `↑ ↓ Space` step triggers and can *never* cross into the next script. In the original,
   down-arrow past the last beat silently advanced the script and David got lost mid-take.
2. **Every boundary crossing announces itself** — an end card at the edge that turns yellow
   and names what's next, and a cue card on *every* script change whatever triggered it.
3. **The trigger→paragraph map is authored data, never derived positionally.** It ships
   beside the triggers in `scripts/build-scripts-data.mjs` and is validated at build time.
   Proportional mapping was considered and rejected — a wrong sync is worse than none.
4. **The driven column carries the strong marker, the follower a quieter one.** Two
   equally-loud markers read as two competing claims about where you are.
5. **Mirror mode is v1**, not deferred — it's one `scaleX(-1)` and prompter glass needs it.
6. **Text size is three named presets**, never a ±stepper. One decision before the take.

## Styling — AppyDave, light only

**This is a light-only brand.** `color-scheme: light` is pinned on `:root`, Tailwind's
`dark:` variant is disabled outright in `tailwind.config.js`, and there is no OS-theme
media query anywhere. Ghost-check before shipping:

```bash
grep -rc "prefers-color-scheme" src/   # every line must be :0
```

All colour lives as CSS custom properties in `src/renderer/src/index.css`; components
consume tokens via Tailwind names (`bg-canvas`, `text-ink`, `border-driven`). **No component
may contain a raw hex value.**

⚠️ **Tailwind cannot apply an opacity modifier to a `var(--x)` colour.** `bg-canvas/92`
compiles to *nothing* — the utility is silently dropped and the element renders with no
background at all. This already cost one round of invisible cue-card backdrop. If you need
a translucent surface, declare a real token for it (`--tt-veil`, `--tt-lane-alt`).

## The data

**Two generated files, one authoring source.** Both come from `npm run build:data`; neither
may be hand-edited.

- `src/shared/script-set.ts` — **the domain model.** The Kybernesis set as `ScriptSet` +
  `TALENTS`. Shapes and rules live in `src/shared/domain.ts`.

⚠️ **`domain.ts` must stay dependency-free.** The renderer imports it, and `@appydave/core`
reaches `node:fs` through its config loader — which has no browser equivalent and breaks the
renderer bundle outright. The Zod schemas live in `src/shared/domain-schema.ts`, imported only
by the core in main. That is also where they belong: validation happens where writes happen.

Authoring lives in two places, both by hand:
`scripts/build-scripts-data.mjs` (per-paragraph headings, the one trigger set) and
`scripts/authored-domain.mjs` (major-topic groupings, the re-cadenced corpus, talents).

**Paragraphs are verbatim, always** — Tom's originals from
`src/shared/data/kybernesis-phase-1.source.json`, the re-cadenced versions quoted from
`~/dev/ad/brains/kybernesis/phase-1-scripts/v0N-rewrite.txt`. Retyping either is a provenance
bug.

### Three things the domain model gets right that the flat shape could not

1. **Two heading levels** — major and minor topic. Requirements §1 needs both; the zone model
   cannot be built without them.
2. **The map belongs to the trigger set, not the script.** Each of the three styles has its own
   step count over the same paragraphs, so each has its own map — and it binds to paragraph
   **ids**, never indices, because `write_transcript` is a published verb.
3. **Corpus is modelled.** Tom's originals and the re-cadenced rewrites are different corpora
   of the same script and both are loadable. Scripts 1–3 carry both today.

⚠️ **The generated set is the SEED, not the live copy.** The store lives at
`~/Library/Application Support/teletubby/teletubby.json` and seeding **never overwrites** — an
agent's trigger set written yesterday must survive today's rebuild.

⚠️ **The app never invents a trigger.** Styles A and C are deliberately absent from the shipped
data; they arrive through `write_trigger_set`. The one set that ships is honestly labelled
style **B** (compressed concept).

### The cadence gate

`src/core/cadence.ts` is a port of `~/dev/ad/brains/kybernesis/phase-1-scripts/score.py` —
eight deterministic threshold rules, no model, no listening, no FliHub. It scores the **script
before the take**; scoring a *take* needs a transcript and is blocked (requirements §8).

Thresholds live on `Talent` and are **never ported between talents** — David's envelope was
measured from his own corpus, and applying it to Alex makes the gate meaningless.
`test/cadence-gate.test.ts` pins per-document numbers straight from the Python; if one changes,
re-run the Python rather than editing the table.

Script 08's bullet set is the one specimen that survives from the original prompter,
quoted verbatim in the prior-art doc. Treat it as the reference point for the trigger-word
experiment, **not** as a settled rule — see `docs/open-questions.md` Q1, which is still the
blocking unknown for this whole product.

## Gotchas

- **A Zustand selector that builds an array blanks the window.** `useProm(zoneOrder)` re-renders
  forever because the array is a new reference each call — and the build, the typecheck and all
  151 tests stay green while the window paints nothing. Any selector containing `[...]`, `.map`,
  `.filter` or `?? []` needs `useShallow`. See `docs/kdd/learnings/`.
- **Look at the window before claiming a UI change works.** Nothing in the automated checks
  catches a renderer that failed to mount.

- **The window has no native title bar.** `titleBarStyle: 'hiddenInset'` means the page must
  supply the drag region — `.tt-drag` on the title strip in `App.tsx`. Without it the window
  cannot be moved at all. (Fixed upstream in the AppyTron template too.)
- **Preload is `.mjs`, not `.js`** — electron-vite emits `out/preload/index.mjs`.
- **Renderer dev server is pinned to 7110** (`strictPort`), not Vite's default 5173.
