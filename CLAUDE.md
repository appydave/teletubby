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

Background: [docs/concept.md](docs/concept.md) · origin brainstorm
[Captain's Log B421](docs/source/b421-2026-08-19-plaud.md).

---

## Current state — proof of concept

The three-column reading surface with working keyboard navigation over the twelve real
Kybernesis Phase 1 scripts. That is all it is, deliberately.

**Explicitly NOT built, and not to be added without asking:**
the AI layer (live listening, waffle detection, sync-to-voice, trigger rewriting),
any recording or clip capture, and script editing. Column 1 is a display column — nothing
generates those headings automatically.

Recording is not ours and never will be: the talent drives Ecamm, FliHub watches the folder
and queues the takes. Script editing arrives by making the app **drivable** by an agent, not
by growing an editor — see the North Star.

## Running it

```bash
npm install
npm run dev        # Electron app; renderer dev server on 7110 (registered slot)
npm test           # 38 tests — data invariants + navigation rules
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

`src/shared/scripts.ts` is **generated — do not edit by hand**. Regenerate with
`npm run build:data`.

- **Paragraphs** come verbatim from `src/shared/data/kybernesis-phase-1.source.json`
  (Tom Lane's Phase 1 handover) so they never drift or get retyped.
- **Headings, bullets and the map** are authored by hand in `scripts/build-scripts-data.mjs`.

Script 08's bullet set is the one specimen that survives from the original prompter,
quoted verbatim in the prior-art doc. Treat it as the reference point for the trigger-word
experiment, **not** as a settled rule — see `docs/open-questions.md` Q1, which is still the
blocking unknown for this whole product.

## Gotchas

- **The window has no native title bar.** `titleBarStyle: 'hiddenInset'` means the page must
  supply the drag region — `.tt-drag` on the title strip in `App.tsx`. Without it the window
  cannot be moved at all. (Fixed upstream in the AppyTron template too.)
- **Preload is `.mjs`, not `.js`** — electron-vite emits `out/preload/index.mjs`.
- **Renderer dev server is pinned to 7110** (`strictPort`), not Vite's default 5173.
