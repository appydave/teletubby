# Open Questions

Things genuinely unresolved as of the seed (2026-08-19). These are lifted from the
source brainstorm, not invented — each one was flagged as uncertain at the time.

## Q1. What *is* a trigger word? 🔴 blocking

The single hardest and most important question. Column 2 is the product, and the rule
for generating it is unknown.

Stated directly in the source: *"it's really difficult to figure out what a trigger word
should be. I don't fully understand the best way to think of the trigger word."*

Candidate framings, none validated:
- Literal words pulled verbatim from the paragraph
- The *concept* the paragraph is making, compressed to a word
- A memory hook (unusual/vivid word) that isn't necessarily in the paragraph at all
- Whatever survives when you try to say the paragraph from memory and see what you drop

Only two or three per topic. Not one — one is just the topic restated.

**How to resolve:** empirically. Record with different trigger styles and see which
produces the most natural take.

## Q2. Auto-scrolling — yes or no?

Deliberately parked: *"I don't know that we need to have auto scrolling but we will come
back to that."* Three-column glance-based reading may make scrolling unnecessary or even
harmful. If the live-listening AI lands, sync-to-voice replaces auto-scroll entirely.

## Q3. Waffle response — flag or rewrite?

When waffle is detected, the source says it's *one or the other*:
- Tell David he's waffling and let him fix it, or
- Silently rewrite the paragraph on the fly

Mid-take rewriting may be more disruptive than the waffle. Untested.

## Q4. Who else is this for?

*"I don't know what other people need tools like this for."* The open-source ambition
needs a second user profile. Specifically worth researching: **what deficiencies do
different people have with teleprompters?** David's is memory for recited sentences —
other failure modes (pacing, gaze, nerves, reading speed) may need different tools.

## Q5. Scope boundary with FliHub ✅ answered 2026-08-19

The old assumption here — *"FliHub owns capture, storage and stitching"* — was wrong, and so
was the same claim in concept.md §3. Checked against FliHub itself:

**Ecamm Live owns capture**, driven by David personally (foot pedal to start/stop, Stream Deck
for scenes). When he stops, a file lands in a folder. **FliHub is a watcher** on that folder:
it routes each take into a queue of takes for that video, creating the queue if none exists,
and holds every attempt — record, dislike, record again is the normal loop, and holding all of
them is what FliHub does well. When David is ready he **promotes** one and it becomes the
project video, moved to its final subfolder and filename.

So Teletubby sits *before* the chain and never records, never touches a file, and never
stitches. Nothing about the prompter needs FliHub's inbox API, which is a document drop, not
a video path.

## Q6. Where do scripts come from?

The three-column view assumes a script already exists. First real-world source is Tom's
scripts. Script *authoring* is currently out of scope — but "rewrite toward David's voice"
implies Teletubby edits scripts too, which quietly pulls authoring back in.

---

## Not yet decided (no stated preference in source)

- Tech stack and platform (desktop app? browser? overlay near the camera?)
- Whether live transcription is local or API-based
- Port allocation (see `~/.config/appydave/apps.json` when it becomes a running app)
