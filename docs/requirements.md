# Teletubby — Requirements

**Status:** open, and expected to grow. Seeded 2026-08-19 from rulings given during the North
Star interview that were **requirements-level rather than direction-level**.

**What belongs here vs the Star.** [north-star.md](north-star.md) says what Teletubby is *for*
and settles feature arguments. This file says what gets **built**. If fixing something needs no
decision, it is work and it belongs here. If someone still has to *choose*, and the choice
changes what the thing should be, it belongs in the Star's open items.

Everything below is measured against the Star's test: **does it put more of the talent's
attention on the camera, and less on the screen?**

> ⚠️ The shipped proof of concept implements a fixed three-column layout. The zone model in §1
> is where it is going, not what it currently does. Nothing here has been built yet.

---

## 1. The zone model

The talent chooses **which zones are on screen**. There are four:

| Zone | What it holds |
|---|---|
| **Major topic** | the section heading — where you are in the script |
| **Minor topic** | the sub-point under it |
| **Paragraph** | the transcript for the beat you are on |
| **Full transcript** | the whole script, as a skim surface |

**The first three are the recording set** — they are what you drive while talking. **The full
transcript is not part of that set**: it is a skim surface that **slides out from a left or right
edge**, for finding your place, not for reading from mid-take.

### Valid combinations are the talent's choice

There is no fixed layout and no "correct" arrangement. All of these are legitimate:

- major + minor
- minor + paragraph
- minor + full transcript
- any single zone alone
- all three of the recording set

The app does not decide this and does not have a default it defends. **Adding a mode the talent
has to learn fails the test; adding an arrangement they can choose does not.**

### Two rules the zones must always obey

1. **Zones stay aligned as the talent moves.** Whatever is on screen refers to the same place in
   the script at all times. A zone that drifts out of step is worse than a zone that is absent,
   because it is believed.
2. **There must be a clear visual indication of which zone is being driven.** This is the
   already-proven rule from the prior prompter: the driven zone carries the strong marker, any
   follower a quieter one. Two equally-loud markers read as two competing claims about where you
   are.

## 2. Layout is subordinate to camera position

**This is the constraint everything else in the UI bends to.**

The zone the talent is focused on **must be placeable nearest the camera**, because that is what
keeps their eyes on lens. If the camera is on the left and the text is on the right, the eyeline
is wrong and the take looks wrong — no amount of good typography fixes it.

It follows that **both the window position and the zone arrangement are flexible, and the talent
controls both**. The app must not assume a fixed side for anything, and must not force a layout
that only works with a centred or right-hand camera.

## 3. Transcript navigation

- A **list of the transcripts in the set**, reachable quickly.
- **Keyboard control for moving between them.**

This is a change from the shipped proof of concept, where script switching is deliberately
click-only. That decision came from a real bug — a single key that meant both "next beat" and
"next script" caused the talent to cross a boundary without noticing. **The rule that survives is
"one key means one scale of movement", not "no keyboard".** Transcript navigation may have keys of
its own, provided they cannot be confused with stepping, and provided every crossing still
announces itself.

## 4. Provenance and cadence transcripts are distinct things

Two different documents, both first-class, **both viewable**:

- **Provenance transcript** — the original. The script as written by whoever originated it.
- **Cadence transcript** — the one shaped for the talent: same meaning, re-voiced into how they
  actually speak.

The Star's rule governs the relationship: **meaning belongs to provenance, voice belongs to the
talent.** A cadence transcript may differ from its provenance in wording and rhythm; it may not
differ in what it means.

## 5. All three trigger styles are derived — the talent picks

Column-2 content is generated in **three styles, all of them, every time**:

1. **Near-verbatim** — phrases lifted from the paragraph
2. **Compressed concept** — the idea reduced to a few words
3. **Loose keywords** — hooks that may appear nowhere in the paragraph

**All three are valid. All three get generated. Which one is on screen is the talent's choice, per
scenario.** There is no single correct style to be discovered and hard-coded.

> This is deliberately kept out of the North Star. *Which* style works best is settled by the
> talent recording takes — never by argument — and that ruling lives in the Star. That all three
> get derived and are switchable is a build detail, and it lives here.

---

## Open — requirements-level

These need answers before the relevant thing gets built. They are **not** Star open items: none of
them changes what Teletubby is for.

1. **How does the full-transcript surface behave on the way out?** Slide from left or right is
   specified; whether it overlays the recording set or displaces it is not, and that matters
   because displacing it moves the driven zone away from the camera.
2. **What are the keys for transcript navigation**, given they must not be confusable with
   stepping, and every crossing must still announce itself.
3. **Does switching trigger style mid-take keep the beat position?** Switching styles is meant to
   be cheap; losing your place while doing it is not.
4. **Where the cadence transcript is stored, and how it is versioned.** Scripts are editable and a
   changelog is likely needed — but the editing is done by an agent through the app's tools, not
   by controls inside Teletubby.
5. **Whether the zone arrangement persists per talent, per project, or per take.**

*Nothing in this file has been implemented. It records what was ruled, so the build has something
to be measured against.*
