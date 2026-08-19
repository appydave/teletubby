# Teletubby — Concept

**Source:** Captain's Log capture [B421](source/b421-2026-08-19-plaud.md), 2026-08-19 07:13 (Plaud, 11 min)
**Origin context:** North Star framing session before recording 10 Kybernesis videos

---

## 1. The problem being solved

The chain is: *video → needs a script → script needs a teleprompter → teleprompter has to
be pleasant to use.* The last link is where it breaks, and it breaks in three specific ways.

| Failure | What actually happens |
|---|---|
| **Not my voice** | The script was written by someone/something else. Reading it aloud produces sentences that don't sit right, so delivery stalls. |
| **Can't hold the line** | Memory won't retain a recited sentence long enough to say it while looking at camera. |
| **Looks like reading** | Eyes track a scrolling wall of text. Viewers can see it. The knowledge reads as *recited*, not *learned*. |

The insight: a teleprompter that shows you **fewer words** is more useful than one that
shows you better words.

## 2. The three-column model

After the script exists, it decomposes into three views shown **side by side**, not in sequence.

### Column 1 — Topic headings
The bullet points you're going to cover. Scripts are short (~1 minute), so expect
**four or five** headings total. This column answers *"where am I?"*

### Column 2 — Trigger words ⭐
Per topic, **two or three** ideas — deliberately not one, because one idea *is* the topic
and tells you nothing new. These are words lifted from (or distilled out of) the original
paragraph. This column answers *"what must I actually cover?"*

This is where the eyes live during recording. You glance, you don't read. This column is
the whole reason the tool would be worth using.

> Open problem: what makes a good trigger word is genuinely not understood yet. See
> [open-questions.md](open-questions.md).

### Column 3 — Transcript
The full paragraph for the section you're on. You read this **before** recording so you
know what's meant to be said. During recording it's a safety net, not the focus.

## 3. Recording flow — and where FliHub comes in

Recording is **not** one continuous take, and you rarely keep the first attempt. You say a
section, dislike it, say it again — that retrying *is* the workflow:

```
  Ecamm Live ──► a file lands in a folder      David drives this himself:
      ▲                    │                   foot pedal to start/stop,
   you speak               ▼                   Stream Deck for scenes
                      FliHub watches
                           │
                           ▼
                   queue of takes for this video
                   (creates the queue if none exists)
                           │
                     ┌─────┴─────┐
                  take 1 · take 2 · take 3 …
                           │
                           ▼
                    you PROMOTE one
                           │
                           ▼
              the project video — moved to its
              final subfolder and filename
```

**Ecamm Live owns capture. FliHub is a watcher**: it watches the folder Ecamm writes into,
routes each take into that video's queue, and holds every attempt — holding all of them is
the thing it does well. When you're ready you promote one, and that becomes the project
video. Other tabs in FliHub do other jobs.

Teletubby sits before all of it. It never records and never touches a file.

## 4. The AI layer

Everything above is v1 and works with static text. The AI layer is what makes it more
than a fancy text panel — and it's built on a blunt premise: **you will fuck up, and the
fuck-ups are the training data.**

### Learn how David speaks
Compare what was scripted against what was actually said. Over time the system learns
his phrasing, and scripts get rewritten *toward* his voice rather than away from it.

### Detect and flag waffle
When he waffles at a given point, the system notices. Two possible responses — and it's
one or the other, not both:
1. **Flag it** — "David, you waffle here" (no script change; the human adjusts)
2. **Rewrite it** — regenerate that paragraph on the fly

### Rearrange triggers from failure
If certain column-2 words keep getting forgotten or skipped, **reorder them**. The trigger
set is not fixed — it adapts to what actually falls out of his head.

### Live listening (advanced)
The stretch goal: the AI listens live and works alongside him during the take.

- Scrollable transcript (column 2 or column 3) stays **in sync with his voice**
- Script rewrites and suggestions happen mid-flow
- Highlighting shifts as he speaks

Note: auto-scrolling is explicitly *not* assumed for v1 — see open questions.

## 5. Human factors worth studying

Teleprompter delivery fails for reasons that aren't technical. Worth understanding
before designing the UI:

- **Where are the eyes looking** — does the gaze read as natural?
- **Learned vs recited** — the viewer can tell the difference; the tool should push toward "learned"
- **Individual deficiencies** — different people fail at teleprompters in different ways.
  David's is memory for recited sentences. Others will differ, and the tool should probably
  adapt per person rather than assume one model of failure.

## 6. Positioning

Intended as an **open-source teleprompter system**. The personal need is concrete and
well understood; the general need is not yet — *"I don't know what other people need
tools like this for."* That gap is a research task, not a blocker.
