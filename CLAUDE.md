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

### Rigs — the app opens the way you left it

Every launch used to reset the arrangement, so four controls got re-set before
every take. A **rig** is a named layout: which zones are on screen, which one is
driven, the camera edge, the text preset. Two separate things, deliberately:

- **The workspace** — the layout you last had on screen, restored on launch
  whether or not you ever named anything. Nobody should have to name a rig to
  stop re-configuring.
- **A rig** — a named arrangement you pick from the chips. Worth it only if you
  swap between physical setups.

⚠️ **A rig carries layout ONLY — never script, corpus or trigger style.** Those
are the axes of the A/B/C experiment and the talent flips them *during* a
session; baking them in would mean picking a rig silently moves the person on
camera to a different corpus. Same reason the restore brings back the layout and
not the beat: a prompter that reopens mid-script has decided where you are.

**The surface split is the design.** `save_rig` / `rename_rig` / `delete_rig`
are on the agent surface — an agent may **author** an arrangement the talent can
then choose. `remember_layout` is **UI-only**, like `set_active_context`: it
decides what appears in front of a person at the moment a take starts.

**Deleting a rig drops the name and leaves the stage alone.** Only the
attribution to a rig that no longer exists is cleared. Both the core and the
store enforce that, because either one alone would leave the other free to move
the talent.

### The setup panel — one strip, and everything else slides out

The toolbar was six stacked rows eating roughly a third of the window before a
word of script appeared. Now there is **one strip** carrying only what changes
DURING a take — where you are, the corpus, the style, Cadence — and everything
that BUILDS an arrangement lives in a **setup panel** on `S`.

> The strip has since moved from the top of the window to the **footer**, because
> the lens is above the screen — see *The top band* below. Everything in this
> section still holds; only which edge the strip sits on changed.

Four properties are the design, not decoration:

1. **It is not a modal.** No scrim, no dim, nothing covered. The point of it is
   watching the stage respond as you change values; a veil defeats the only
   thing it is for.
2. **It DISPLACES rather than overlays.** The lanes give up width and keep
   rendering. That is the *opposite* of the transcript drawer's ruling, and
   deliberately: the transcript is glanced at mid-take and must not shove the
   driven zone away from the lens, while this is used between takes.
3. **It enters from the edge FURTHEST from the lens** — same rule as
   `transcriptEdge`. A panel between the talent and the driven zone is the
   failure mode, whichever panel it is.
4. **Corpus and style stay on the strip**, live, while the panel is open. They
   are the axes of the A/B/C experiment and get flipped mid-session; putting
   them behind a gesture nearly disqualified this whole direction. The same rule
   is why the reclaimed state (`D`) leaves the footer strip alone.

⚠️ **The panel must never write the lane weights.** They narrow because a flex
sibling took width and spring back when it closes. Lane widths are a saved rig
property, so a panel that "helpfully" rebalanced them would rewrite the talent's
rig every time it opened.

⚠️ **`setupOpen` is not part of a rig and is not remembered.** A rig is what the
stage looks like; whether a config drawer happened to be open when you quit is
not, and reopening on it would put a panel between the talent and their first
take. It opens itself once, on a machine that has never run the app.

The key is a bare `S`, with `Escape` to close. `D` is the same shape — one bare letter. The mock drew ⌘K; every binding
this app has is a single unmodified letter, and a chord would be the odd one out
— and would collide with a command palette the day one arrives.

The script chips moved into the panel; the strip has a **stepper** for the
neighbouring script, disabled at both ends rather than wrapping. Rolling from 12
back to 01 is the silent-advance bug of rule 1, one level up.

⚠️ **Nothing is remembered until something has been recalled** (`rigsLoaded`).
The app writes the live layout back on every change, so a failed `list_rigs`
that let it start writing anyway would overwrite a saved arrangement with the
built-in default.

### The top band — the strip is at the FOOT, and `D` reclaims the rest

The camera sits **above** the screen. A strip at the top of the window is therefore
not chrome, it is centimetres of distance between the lens and the first word — the
talent's eyes go down to read and have to come back up. Measured on a 1440×900 window
(script 01, `stage` text, 36 logical px/cm on the 32" display):

| band | before |
|---|---|
| title strip — existed only to be the drag region | 52px |
| control strip | 31px |
| lane `py-6` + the zone-label row | 58px |
| beat block padding + half-lead | 25px |
| **top of window → first word, PARAGRAPH driven** | **167px · 4.6cm** |
| the reading line (26vh) on top of that, LIST zone at beat 1 | **336px · 9.3cm** |

Two moves, and they are different in kind:

1. **Always, no mode: the strip moved to the FOOTER** and the title strip is gone
   (the set title it carried is already in the footer; "TELETUBBY" is a thing to read).
   What is left at the top is a **24px drag rail**. Nobody's eyes travel *below* the
   script on the way to a lens above it, so the strip costs nothing down there.
2. **`D` — the reclaimed state.** Lane padding collapses, the zone-label row hides,
   and the reading line moves to the top. First word at **44px · 1.2cm** with the
   paragraph driven, **57px · 1.6cm** with a list zone (its rows carry their own
   `py-2`; the row's box starts at 32px).

⚠️ **28px, and the floor under it is measured.** `titleBarStyle: 'hiddenInset'` makes
macOS float the traffic lights over the page whether or not the page draws anything
there. **Measure them on a FOCUSED window** — unfocused they render as faint grey discs
that a colour threshold clips at the edges, which is how this rail first shipped at 24px
with the lights spilling past the border and cutting the line. Focused, they are
chromatic and span logical **y 13–24.5**, so the floor is 25px and the rail is 28,
leaving 3px of panel under them. Going below needs `setWindowButtonVisibility(false)`
from main, which costs close/minimise by mouse — a bigger surprise than 0.7cm is a win,
and this band competes with nothing.

⚠️ **The rail is the ONLY drag region the window has**, so it carries `.tt-drag`
itself, holds nothing in any state, and can never be collapsed. Verified by dragging
it and reading the window position back, not by reading the CSS.

⚠️ **Reclaim is `focus` (D), deliberately not a new key.** Nothing is remembered
unless it is a rig property, so a new binding would have to be re-pressed before every
take — the exact chore rigs exist to end. `focus` is already bound, already stored,
and already meant "everything except the live beat gets out of the way"; dimming the
neighbouring rows was only ever half of that sentence.

⚠️ **Reclaim does not touch the footer.** Moving the strip down is what made that
possible: corpus and style — the two axes of the A/B/C experiment — stay on screen and
stay live, so nothing the talent flips mid-session is behind `D`. When the strip was at
the top, reclaiming meant hiding them, which is the flaw that nearly disqualified the
setup panel.

⚠️ **The reading line is MOVED, never deleted.** Rule 7 says the beat holds a *fixed*
height and the script moves up underneath it; it does not say that height is 26vh. The
26vh was there to leave two or three already-said lines above the live one — and with
the lens above the screen, those said lines sit physically between the talent and the
camera. Reclaimed, the value is in **rem, not vh**: the target is an absolute distance
from the top of the display, and 26vh is 234px in a window and 374px fullscreen. The
`.tt-reading-list` spacer stays non-zero so the first beat can still reach the line.
`focus` is in the `useReadingLine` deps because moving the line has to re-seat the
lane — otherwise the live beat lands where the old line used to be, half off the top.

### The driven-beat highlight — a marker that was painting the whole zone

Every other zone applies `markerBar` to **one row of a list**, so the wash is the width
of its claim: *of these, you are on this one*. `ParagraphZone` renders exactly one
paragraph and hardcodes `markerBar(rank, true)`, so the wash paints the entire zone.

On script 01 beat 11 that measured **516px — 66% of the stage height**. The cause,
in order of contribution:

- **Authoring, and unfixable by rule.** Paragraph 3 is the long one in *both* corpora —
  375 chars in `v01-rewrite` against a 212 mean, 338 in `tom-original`. Switching corpus
  buys 11%. Paragraphs are verbatim; the fix is layout, never the words.
- **Measure.** 375 chars at the `stage` preset into a 454px lane is ~33 characters per
  line, below the 45–75 readable range — so the *line count* is inflated by the column,
  not by the writing.
- **Rhythm.** `leading-relaxed` gave a 45px line box.

Fixed what could be fixed without touching text or `weights`: `leading-snug` (the
rhythm the trigger rows already use) and `py-1.5`. Like-for-like, same beat, same panel
state: **516px → 390px, the same 11 lines**. The height came out of the rhythm; the
line count is still authoring × measure.

⚠️ **Widening the driven lane is the remaining lever and it is the talent's, not
ours.** `weights` is a saved rig property and the panel already may not write it; the
same rule applies here. Widening the paragraph lane to ~65 characters per line would
take paragraph 3 from 11 lines to about 6 — but it comes straight out of the trigger
lane, and column 2 is the product.

### The hot zone — the camera is NOT on an edge

`camera` is still two edges, and that is wrong in kind, not in coverage. The camera is a
physical object on a **vertical pole**, about an inch in front of the screen, free to
move in two axes, and it **occludes a strip of the display**. So the thing to model is
not *where the camera is* — it is **where the hot zone sits in relation to it**: the
~10cm-wide region that must fall inside the sight line to the lens.

⚠️ **Rows vs columns is DERIVED and must never be asked.** A vertical pole blocks a
vertical strip. With columns that eats a sliver of ONE lane and the layout has somewhere
to put it; with rows it eats every row at the same x and there is nowhere to move it to.
Columns, permanently, at any camera height.

⚠️ **Occlusion is acceptable, not a bug.** Today the body clips a couple of letters off
each line and David reads through it. Prefer to keep load-bearing text out of the strip;
never contort the layout to guarantee zero occlusion.

⚠️ **The app cannot know centimetres.** Electron gives DIPs and a scale factor, never
physical size. A hot zone in cm has to arrive as a screen fraction the talent sets. On
David's 32" display, 36.2 px/cm — 10cm is 362px, 14.1% of the width.

The reclaimed state is not replaced by this: it is the right answer for today's camera
height reached by hand, and generalises to **the reading line tracks `lens.y`**.

Also recorded there, not acted on: **four zones is too many**. One lane is already 1.8×
wider than the hot zone, so every zone but the driven one is outside the sight line by
construction — a look-away surface, not a glance surface.

Full proposal, with the next step (a single `hotZone()` derivation seam, no behaviour
change, no rig change): **[docs/camera-direction.md](docs/camera-direction.md)**. Read it
before touching `CAMERA_SIDES`.

### Live edits reach the window — the loop this app exists for

An agent writing through the control API shows up **in front of the talent immediately**, with no
restart. `core.onChange` fires on a real change, main pushes it to every window on
`control:changed`, and the renderer re-fetches.

**The rule that matters more than the mechanism: a refresh must never move the talent.** Someone
rewriting a trigger word must not yank the person on camera to a different script, corpus or
beat. `store.refresh()` keeps every part of the selection that still exists, clamps the step
rather than resetting it, and raises a cue card **only** if the refresh genuinely moved them —
a cue announces a boundary the talent crossed, and data changing underneath is not a crossing.

The event fires on a real change to the **data** only: never on a query, a dry run, a preview,
or a refused call. Waking every client for those trains them to ignore it.

Nor does a command that records only the **human's own working state** —
`announces: false` in the catalog, today `remember_layout` and `set_active_context`. Otherwise
every window re-fetches the whole set each time the talent nudges a divider, which is a busy
loop wearing an event's clothes.

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

Four verbs are **UI-only, permanently**: `approve_pending`, `list_pending`,
`set_active_context` and `remember_layout`. The mechanism that satisfies a control must never
be reachable through the surface that control constrains, and neither the talent's selection
nor the arrangement they open on is the agent's to forge.

Destructive verbs are **preview → confirm → execute**. A `dryRun`, or a call with no approval,
returns a preview and a `pendingId`; a human approves it in the UI; only then does the verb
act, and only for the exact input that was approved.

```bash
teletubby health           # is the app up? (no token needed)
teletubby capabilities     # every verb, with its contract — GENERATED from the catalog
teletubby call list_rigs   # saved arrangements + the workspace
teletubby call get_set --input '{"setId":"kybernesis-phase-1","full":true}'
```

⚠️ **Input ALWAYS goes in `--input`.** A bare positional JSON used to be parsed as a
second positional and silently dropped, and the call then returned
`not_found: no set specified` — which reads like *that set does not exist*, so you go
hunting for missing data instead of your own vanished argument. The CLI now **refuses**
a stray positional and names the right form. Absence and failure must never look alike.

⚠️ **`capabilities` is the authority; this file is not.** It is generated from
`src/shared/capabilities.ts` — the same catalog the gate enforces and
`test/capability-surface.test.ts` pins — so it cannot drift from the app. Prose here
can, and just did.

⚠️ **What `capabilities` does NOT yet publish: per-verb INPUT shapes.** It returns
`kind`, `sideEffects`, `principals`, `idempotent`, `confirmationRequired`,
`supportsDryRun`, `announces` and `failureModes` — everything about *how* a verb
behaves and nothing about *what fields it takes*. So an agent can discover that
`get_script` exists and is a read-only query, then has to guess `scriptId` or read
`src/core/handlers.ts`. The Zod schemas in `domain-schema.ts` validate domain OBJECTS
(a set, a rig, a talent), not the verb's input envelope, so there is nothing to derive
this from today — it has to be authored per verb and published. That is the real fix,
and it is the first thing that makes this surface self-teaching.

The app must be running — the surface lives in its process. Port and token come from
`~/Library/Application Support/teletubby/control.json`, written per launch.

## Running it

```bash
npm install        # npm ONLY — packageManager is pinned; pnpm blocks Electron's postinstall
npm run app        # start DETACHED — renderer on 7110, control API on 7111 (registered slots)
npm run app:status # is it up? (health, not a guess)
npm run app:stop
npm test           # 287 tests
npm run typecheck
```

⚠️ **An agent must never launch this with `npm run dev`.** That binds the Electron
process to the session's process group, so quitting Claude Code prompts *"move to
background"* and the prompter's lifetime is tied to a terminal David is closing.
`npm run app` runs the same `npm run dev` under overmind, which supervises it in a
tmux server that reparents to **launchd** — nothing in the launching session can take
it down, and `npm run app:stop` is the only thing that does. `npm run dev` by hand in
a terminal you intend to keep open is still fine.

⚠️ **`overmind echo` hangs a session** — it follows the stream with no bound, and this
machine has no `timeout`. The Procfile tees to `.logs/app.log` so a snapshot is
possible: `bash scripts/app.sh tail`.

⚠️ **`pgrep -f "electron-vite dev"` is ambiguous on this machine** — flicut runs the
identical command line and answered first the one time it mattered. Scope it to
`$PWD/node_modules/.bin/`.

Full detail — what does and does not prove the app is up, the detachment tree, and
driving the control API — lives in the **`teletubby` skill**
(`~/.claude/skills/teletubby/SKILL.md`, invoked as `/teletubby`).

⚠️ **That skill is the single owner of launching this app, and it lives OUTSIDE the
repo on purpose** — beside `flihub` and `flideck`, which are the same thing for their
apps (FliHub already runs under overmind for the same reason). Do not add a repo-local
`.claude/skills/teletubby/`; two skills answering "start teletubby" is the failure
state, and that duplicate existed briefly in `9fd3a25`.

⚠️ **An eve agent is ALSO called teletubby** (`~/dev/agents/teletubby` — *"an agent for
column 2"*, untested, Arcana memory parked). It is owned by `fleet:manage-agents`, not
by this repo. Starting the app and starting that agent are different acts.

## The rules this app is built on

These come from `docs/prior-art-kybernesis-prompter.md` — a working two-column prompter
David drove live the day before this repo existed. They are **requirements, not
preferences**; each one is a bug that already happened once.

1. **Stepping is clamped inside its unit. One key means one scale of movement — and the
   DRIVEN ZONE sets the scale.** `↑ ↓ Space` move by one paragraph when driving Paragraph, one
   major topic when driving Major, one trigger when driving Triggers, and can *never* cross
   into the next script. In the original prompter, down-arrow past the last beat silently
   advanced the script and David got lost mid-take. On the first real take (B437) the arrows
   ignored the driven zone entirely — five presses to advance one paragraph.
2. **Every boundary crossing announces itself** — an end card at the edge that turns yellow
   and names what's next, and a cue card on *every* script change whatever triggered it.
   ⚠️ **A corpus switch is NOT a boundary crossing** and must stay silent: it is an A/B
   comparison, and a card over the top hides the very difference you flipped across to see
   (B437). Style switching has never had one, and that is why it feels right.
3. **The trigger→paragraph map is authored data, never derived positionally.** It ships
   beside the triggers in `scripts/build-scripts-data.mjs` and is validated at build time.
   Proportional mapping was considered and rejected — a wrong sync is worse than none.
4. **The driven column carries the strong marker, the follower a quieter one.** Two
   equally-loud markers read as two competing claims about where you are.
5. **Mirror mode is v1**, not deferred — it's one `scaleX(-1)` and prompter glass needs it.
6. **Text size is three named presets**, never a ±stepper. One decision before the take.
7. **The beat you are on holds a fixed height; the script moves up underneath it.** Jan,
   watching David's eyes on the first take: the old centre-scrolling let him read *down* a 32"
   screen instead of the page coming to him. `--tt-reading-line` + `scroll-padding-top` +
   the `.tt-reading-list` spacers are what hold the line — the spacers are load-bearing, since
   without them the first and last beats cannot reach it.
   ⚠️ **The rule is the FIXED HEIGHT, not the number.** 26vh was chosen to leave two or three
   already-said lines above the live one; the reclaimed state (`D`) moves the line to 0.5rem
   because with the lens ABOVE the screen those said lines sit between the talent and the
   camera. The mechanism is untouched — still a fixed height, still the script coming to you.
   What it costs is real and worth naming: at 0.5rem there is *more* unsaid script visible
   below the line, which is the direction of the B437 failure. What holds it back is that
   reclaimed **is** `focus`, so every row that is not the live one is at `opacity-25` — the
   text below the line is present but not legible at a glance. If that mitigation is ever
   unpicked, the reclaimed reading line has to be revisited with it.

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
  `TALENTS`. Shapes and rules live in `src/shared/domain.ts`; the arrangement vocabulary
  (recording zones, camera sides, text presets) lives in `src/shared/rig.ts`, because a
  vocabulary the main process has to enforce cannot be defined in the window.

⚠️ **`domain.ts` and `rig.ts` must stay dependency-free.** The renderer imports it, and `@appydave/core`
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

- **`.agents/skills/recipe/` is NOT stray — do not untrack it.** It is the Codex-facing
  mirror of `.claude/skills/recipe/`, the AppyTron scaffold's recipe skill, and the two
  differ by exactly one word on one line ("Codex reads" vs "Claude reads"). It looks like
  debris because it entered in a rigs commit via `git add -A`, and because there is no
  installed plugin by that name to compare against. It is byte-identical to samantha's
  copy, and `captains-log` tracks 25 files under `.agents/` on the same convention. One
  session has already proposed deleting it on a name collision alone.

- **`AGENTS.md` is a POINTER to this file, not a copy.** It was a copy, and by 2026-08-26
  it was six days and 241 lines behind — briefing Codex on a toolbar that no longer
  existed. Do not re-expand it. If the brief is wrong, fix it here.

- **The window has no native title bar.** `titleBarStyle: 'hiddenInset'` means the page must
  supply the drag region — `.tt-drag` on the title strip in `App.tsx`. Without it the window
  cannot be moved at all. (Fixed upstream in the AppyTron template too.)
- **Preload is `.mjs`, not `.js`** — electron-vite emits `out/preload/index.mjs`.
- **Renderer dev server is pinned to 7110** (`strictPort`), not Vite's default 5173.
