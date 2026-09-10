---
learning: chrome-inside-the-loaded-branch-makes-every-empty-state-a-dead-end
category: frontend
severity: high
date: 2026-09-10
status: fixed
files:
  - src/renderer/src/App.tsx
commits:
  - 2f65ebc
---

# Chrome inside the loaded branch makes every empty state a dead end

**The one-line version**: the drag rail, the setup panel and the footer were rendered inside
`Stage`'s script-loaded branch, so selecting a project with no scripts unmounted **every
control the app has** and painted one line of centred text — a screen with nothing clickable.
And because the remember-effect ran *above* that early return, the empty set was persisted
into `workspace.position`, so **every relaunch reopened INTO the dead end**.

## What happened

David clicked the `cutty-presenter-tracking` project (d03, a real Teletubby set with 0
scripts) and got a full window of cream with "No script selected." — no title bar content, no
back control, no CTA. His words: *"you can't do anything, and… when you're on a teletubby
that is configured, you still can't go back and have a look at the project list."* The dead
end was live in the store at fix time: `position.setId` pointed at the empty set with
`scriptId: null`.

The mechanism was one line — `if (!script || !transcript || !set) return <Waiting …/>` —
sitting **above** the shell in the JSX but **below** the hooks. Two consequences, one worse
than the other:

1. The empty state had no exits because the exits were children of the guarded branch. The
   `S` key still toggled `setupOpen` in the store; the panel just never mounted to show it.
2. The remember-effect (a hook, so above any return) kept writing the empty set into the
   workspace position — the app **remembered its way back into its own dead end**.

## The fix (structural, not a back button on one screen)

```tsx
// wrong way — the shell exists only when a script does
if (!script || !transcript || !set) return <Waiting message="No script selected." />;
return <div>…rail…<SetupPanel/>…lanes…footer…</div>;

// right way — the shell renders in EVERY state; only the lanes need a script
if (!set) return <Waiting message="Loading the set…" />;
const stage = script && transcript ? <Lanes…/> : <EmptyStage …/>;
return <div>…rail…<SetupPanel/>{stage}…footer…</div>;
```

Plus: Setup **auto-opens** when a set arrives empty (the panel is both the way out — project
chips — and the way forward — "+ New project"; nobody should need to know the `S` key to
leave), and the `EmptyStage` names its absence precisely — "no scripts yet" vs "no transcript
yet" are two different absences and must not share a message.

## The general rule

**Persistent chrome belongs to the shell, never to the happy-path branch.** The test for any
`return <SomeMessage/>` above the main render: *what can the user click on this screen, and
does the state that led here get persisted so the app reopens on it?* If the answers are
"nothing" and "yes", the guard has built a self-restoring trap — the empty state did not
cause the bug, it only removed everything else there was to look at (the navigation was
one-way in every state; loaded screens just had content that hid it).
