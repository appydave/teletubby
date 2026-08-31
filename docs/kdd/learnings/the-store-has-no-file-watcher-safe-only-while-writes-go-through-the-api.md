---
learning: the-store-has-no-file-watcher-safe-only-while-writes-go-through-the-api
category: architecture
severity: medium
date: 2026-08-31
status: open
files:
  - src/core/repository.ts
  - src/main/index.ts
---

# The store has no file watcher — safe only while every write goes through the API

**The one-line version**: the running app never re-reads `teletubby.json` on its own. Live
updates reach the window only because `core.onChange` fires *inside the process that wrote* —
so a change made directly to the file on disk is invisible to a running app until relaunch,
and nothing errors.

## What holds it up today — a convention, not an enforcement

Every writer currently funnels through `core.invoke`: the renderer over IPC, an agent over
loopback HTTP, the CLI over the same HTTP. Main is then the only process touching the file,
`@appydave/core`'s Store serialises every read/write/update through one `SerialQueue`, and
writes are tmp+rename atomic — so there is **no concurrent-write hazard** (verified
2026-08-31, down to the queue in `store.js`).

But nothing *enforces* that funnel. The file is `0600` on a personal machine; any script,
sync tool, or well-meaning session that edits `teletubby.json` directly gets a perfectly
valid write that the running app never sees. The talent then reads from data the store no
longer contains — or their next `remember_layout` debounce write clobbers the manual edit
wholesale, because main's read-modify-write starts from its own last state of the world.

Both directions are the **silent divergence** class this repo keeps paying for: nothing
fails, the two copies just stop being the same thing, and whichever you look at seems fine.

## The condition, stated

**Safe while — and only while — all writes go through `core.invoke`.** The moment a second
write path exists (a file-sync tool, a cross-machine copy, a "quick fix" with a text editor),
this stops being a note and becomes a live bug.

## If it ever bites

The fix is a design decision, not a patch — options on record from the 2026-08-31 review:
a file watcher feeding the same `onChange` relay, or a version stamp checked on each
`repository.update` that refuses to clobber a file it did not last write. Neither built,
deliberately: today the convention holds and a watcher would be machinery defending against
a writer that does not exist.

## The general rule

**When one process owns a file, say so where the file lives, and say what breaks the day it
stops being true.** An invariant that exists only as everyone's shared habit is one new tool
away from a silent-divergence bug.
