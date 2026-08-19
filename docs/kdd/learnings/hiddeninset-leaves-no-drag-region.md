---
learning: hiddeninset-leaves-no-drag-region
category: electron
severity: high
date: 2026-08-19
status: fixed
upstream: appytron
---

# `titleBarStyle: hiddenInset` leaves the window with nothing to drag

**The one-line version**: removing the native title bar removes the drag region with it — the page
must declare its own, or the window cannot be moved at all and dragging the header selects text.

## What happened

Reported by David against the running app: *"I cannot drag the window around. When I go to drag it
and select text, there is no drag toolbar sort of thing going on."*

`WindowManager` sets `titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'`.
On macOS that hides the title bar, and Electron then draws **no** draggable area of its own. Without
a `-webkit-app-region: drag` element the window is stuck where it opened.

**This was not a Teletubby bug.** It was inherited from the AppyTron template, which means *every*
app scaffolded from it has shipped undraggable. The rule was already written down in the template's
`nav-shell` recipe — but the template itself never shipped it, so it only ever helped people who
happened to apply that recipe.

## The fix

A drag strip at the top of the window, with 78px of left padding to clear the traffic lights that
float over the content:

```css
.tt-drag { -webkit-app-region: drag; padding-left: 78px; }
.tt-no-drag { -webkit-app-region: no-drag; }
```

Fixed here **and upstream** in the AppyTron template, with the symptom recorded in its CONTEXT.md
gotchas.

## The general rule

Anything inside a drag region that a user needs to click must opt back out with `no-drag`, or the
drag handler swallows the click. And more broadly: **a rule that lives only in an optional recipe
is not shipped** — if every scaffolded app needs it, it belongs in the template.
