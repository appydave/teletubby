---
learning: an-occluded-electron-window-cannot-be-screenshotted-for-proof
category: tooling
severity: medium
date: 2026-08-30
status: open
---

# An occluded Electron window cannot be screenshotted for proof

**The one-line version**: `screencapture -l <windowId>` of a window buried under a terminal
returned the **same pixels** before and after a hot-reload that changed the page. That is not
evidence the change failed — and it is not evidence it worked. On a static page a stale frame and
a fresh frame of unchanged content are indistinguishable.

## What happened

Two UI fixes went in via HMR (vite logged the update at 10:52:40). The window was found by CG
window number and captured at 10:56 and 10:59; both captures showed the top rail empty, and the
two files were byte-identical. Three explanations fit equally: the render genuinely failed; the
compositor had not repainted an occluded window; or the page simply had nothing else to change.

Bringing the window forward for a fresh frame steals focus from the talent mid-session and was
blocked by the permission classifier — correctly. There is no CDP port on the app, and the
renderer cannot be opened in a browser because `window.appytron` only exists under the preload.

## What proves a renderer change, in this app

- **Eyes on the window.** The CLAUDE.md gotcha already says it: nothing automated catches a
  renderer that painted nothing. This learning adds: nothing automated catches a renderer that
  painted *the old thing* either.
- `ui`-principal calls in `.logs/app.log` prove React **mounted**, not what it painted.
- A `screencapture` proves something only if the window was **frontmost and focused** at
  capture time — and the traffic-light measurement in `App.tsx` already had to learn the same
  lesson for a different reason.

## The general rule

**When a check would return the same answer for "worked" and "didn't run", it is not a check.**
Say which of the three explanations you could not rule out, and hand the verification to the
person who is looking at the screen — that is what David's "done = I have run it in the app"
bar means in practice.
