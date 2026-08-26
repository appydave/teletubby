# Teletubby — agent instructions

**Read [CLAUDE.md](CLAUDE.md). It is the whole brief, and it applies to you.**

Everything an agent needs to work on this repo lives there: the North Star and the test
that settles feature arguments, the capability-core rules, the zone model, the rig rules,
the hot-zone frame for camera position, the prior-art rules that are requirements rather
than preferences, the light-only styling constraint, and the gotchas that have each cost a
session once already.

---

## Why this file is a pointer and not a copy

It used to be a copy. On 2026-08-26 it was **six days and 241 lines behind** `CLAUDE.md` —
it still described a toolbar at the top of the window that no longer exists, and a reading
line rule that had since been qualified. Any agent reading it was being briefed on an app
that had moved.

Nothing failed loudly, because a stale mirror never does. That is the same defect this repo
has now been bitten by twice: `CLAUDE.md` documenting a CLI argument form the CLI does not
accept, and this file documenting a layout the app no longer has. **A hand-maintained
duplicate drifts, silently, always.**

So the rule here matches David's knowledge convention — *one canonical file owns each piece
of knowledge; others reference it and never duplicate it.* `CLAUDE.md` owns the brief.

⚠️ **Do not "helpfully" re-expand this file.** Copying the brief back in here recreates
exactly the drift it was written to end. If something is wrong or missing in the brief, fix
it in `CLAUDE.md`.

## The one thing that is not in CLAUDE.md: `.agents/`

`.agents/skills/recipe/` is the **Codex-facing mirror of `.claude/skills/recipe/`**, the
AppyTron scaffold's recipe skill. The two differ by one word on one line ("Codex reads" vs
"Claude reads"). It is tracked deliberately and is the same convention `captains-log` uses
at larger scale. **It is not stray, and it is not to be untracked** — see the note in
`CLAUDE.md` under Gotchas.
