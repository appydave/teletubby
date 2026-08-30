---
name: teletubby
description: Start, stop, check or restart the Teletubby prompter app so it keeps running after the session that launched it ends. Use when asked to "start Teletubby", "open the app", "launch the prompter", "run the app", "is Teletubby running", "restart the app", "stop Teletubby", "show me the app logs", or when a change needs to be seen in the real window. Launches DETACHED via overmind — never as a session-bound background task.
---

# Running Teletubby

## The rule

**Never launch this app with `npm run dev` from an agent session.** It attaches the
Electron process to the session's process group: quitting Codex or Claude Code then prompts
*"move to background"*, and whatever you pick, the app's lifetime is tied to a
terminal David is trying to close. He hit this once already.

Use the detached path. One command:

```bash
npm run app
```

That is idempotent — if the app is already up it says so and does nothing.

| Want | Command |
|---|---|
| Start (detached, idempotent) | `npm run app` |
| Is it up? | `npm run app:status` |
| Stop | `npm run app:stop` |
| Restart (after a main-process change) | `npm run app:restart` |
| Follow logs (blocks — Ctrl-C to leave) | `npm run app:logs` |
| Log snapshot (returns immediately) | `bash scripts/app.sh tail` |

⚠️ **Agents: use `tail`, never `app:logs`.** The Procfile tees into `.logs/app.log` so a
bounded read is possible. `overmind echo` — the obvious-looking way to read logs —
follows the stream forever, and this machine has no `timeout` to bound it, so it hangs
the session until it is killed. That already cost one two-minute stall.

## How the detachment works

`Procfile` declares one process, `app: npm run dev`. `scripts/app.sh start` runs
`overmind start -D -N`, which supervises it inside a **tmux server that reparents to
launchd (PID 1)**. Nothing in the launching session's process group can take it down;
only `npm run app:stop` does.

```
launchd (1)
└── tmux -L overmind-teletubby-…        ← detached here
    └── sh …/app
        └── npm run dev
            └── electron-vite dev  →  renderer 7110 · control API 7111
```

Verify detachment by **walking the ancestry to PID 1**, not by assuming it:

```bash
ps -o ppid=,command= -p "$(pgrep -f "$PWD/node_modules/.bin/electron-vite dev" | head -1)"
```

⚠️ **Scope that pattern to this repo.** A bare `pgrep -f 'electron-vite dev'` also
matches every *other* AppyTron app on the machine — flicut runs the identical command
line, and it is the one that answered first when this was written. Reading a sibling
app's process tree and reporting it as Teletubby's is a silent wrong answer, not an
error.

`-N` stops overmind injecting `$PORT=5000`; this app pins 7110/7111 with `strictPort`
and an injected port would be a silent mismatch.

## Readiness — what proves it is up

**Only `teletubby health` (rc 0) proves the app is running.** Three things that look
like proof and are not:

- **`~/Library/Application Support/teletubby/control.json` exists.** It is written per
  launch and left behind on exit, so a dead app leaves a file with a dead `pid` in it.
- **`overmind ps` says `running`.** That is the *supervisor's* view of `npm run dev`.
  npm can be alive while the Electron window failed to mount.
- **`npm run app` printed "Starting…".** The script waits for health for that reason;
  if it times out it says so explicitly and leaves the process up rather than
  reporting a clean failure. A slow boot and a broken boot are different, and the
  script must not flatten them.

The script's own start/status output already distinguishes these — read what it prints
rather than re-deriving it.

## Then look at the window

`docs/` and CLAUDE.md both carry this and it still bites: a green build, a clean
typecheck and 285 passing tests are all compatible with a renderer that painted
nothing (the Zustand-selector blanking bug). **After a UI change, look at the actual
window** — health only proves main is alive, and it will happily report UP over a
blank white renderer.

## Stopping and stale state

`npm run app:stop` runs `overmind quit` and removes `.overmind.sock`. If David quits
the Electron window himself the single process dies, overmind quits with it, and the
socket is cleaned up the same way.

A leftover `.overmind.sock` with no daemon behind it makes a bare `overmind start`
refuse with *"it looks like Overmind is already running"* — misleading, since it is
not. `scripts/app.sh` detects that case and clears it before starting; don't delete
the socket by hand as a reflex, because doing so while the app IS running orphans the
daemon with no way to address it.

## Hot reload vs restart

`npm run dev` under the hood, so the **renderer** hot-reloads on save with the app
left running. Changes to `src/main/`, `src/core/` or `src/shared/` need
`npm run app:restart`.

Live data edits through the control API need **neither** — `core.onChange` pushes to
open windows on `control:changed`, which is the loop this app exists for. Check the
app is up (`npm run app:status`), then drive it:

```bash
node bin/teletubby.mjs capabilities
node bin/teletubby.mjs call list_rigs
```

⚠️ Input always goes in `--input '{"…":"…"}'`; a bare positional JSON is refused.
