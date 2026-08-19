# Teletubby — Requirements

**Status:** open, and expected to grow.

**Sources.** Seeded 2026-08-19 from the North Star interview, then filled out from the three
Captain's Log recordings of that morning — **B421** (the concept, 11m), **B422** (the build and the
cadence analysis, 77m) and **B424** (the pipeline session with Jan, 39m). Where those disagree,
B422's measurements win over B421's assumptions; §4 records the one place they did.

**What belongs here vs the Star.** [north-star.md](north-star.md) says what Teletubby is *for*
and settles feature arguments. This file says what gets **built**. If fixing something needs no
decision, it is work and it belongs here. If someone still has to *choose*, and the choice
changes what the thing should be, it belongs in the Star's open items.

Everything below is measured against the Star's test: **does it put more of the talent's
attention on the camera, and less on the screen?**

> ⚠️ The shipped proof of concept implements a fixed three-column layout. The zone model in §1
> is where it is going, not what it currently does. Nothing here has been built yet.

---

## 0. Where Teletubby sits

Teletubby is one station in a pipeline, and most of its requirements only make sense from that
position.

```
  idea ──► research / fact-gathering ──► content plan ──► transcript(s)
                                                               │
                                                               ▼
                                                          TELETUBBY
                                                    (shape it · prompt it)
                                                               │
                                                               ▼
                                        Ecamm  ──►  a file lands in a folder
                                     (foot pedal,          │
                                      Stream Deck)         ▼
                                                        FliHub
                                              queue of takes · promote one
                                                           │  │
                                    transcript of the take │  └──► edit · hyperframes ──► export
                                                           ▼
                                                       TELETUBBY
                                             (compare said vs intended — §8)
```

Research feeding the content plan comes from three places: **conversations already in Captain's
Log, Claude Code sessions, and plain conversation with a human** who says "go and research this."

**Note the shape: it is a loop, not a line.** Teletubby sits before the recording and also receives
the result of it. That return edge is what "learn from every fumbled take" means in practice.

### 🔴 Open seam — does Teletubby hold the idea?

Flagged in B424 and left unresolved in the same breath: *"I think Teletubby has to hold the idea
coming in… this is where there's a little bit of confusion — it's a seam."*

The question is whether an incoming **idea** (not yet a transcript) belongs to Teletubby or to
whatever does the research and content planning. **It decides whether Teletubby is a prompter or a
content tool**, so it is the largest unanswered scope question in this document. It is deliberately
recorded here and not in the Star, because the Star's answer — *a shape they can talk to* — holds
either way.

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

### What "cadence" actually means here — it is measured, not felt

This is the part that was vague and is now specific. A Jaccard-similarity analysis over 45 takes
against Tom's scripts found the defect is **rhythm, not vocabulary**:

| | Tom writes | David speaks |
|---|---|---|
| breath group | ~7 words | **~11.5 words** |

So the transformation is a **cadence rewrite, not a rewording** — David's own summary to Tom:
*"they're not rewritten so that the words change, they're rewritten so that the cadence changes."*
The measured constraint on it: **every word dropped must be a function word or a synonym — no
content term is lost.**

### The re-cadenced scripts already exist

Three scripts have been rewritten against the gate and are committed as
`phase-1-scripts/v0N-rewrite.txt`, each paired with its `v0N-tom-original.txt`. Measured:

| | Tom's originals | Re-cadenced | David native |
|---|---|---|---|
| mean breath group | 7.30 | **11.17** | 11.5 |
| breaks / 100 words | 7.89 | **3.58** | 3.27 |
| Tom's word types retained | (baseline) | **91–96%** | improvising kept **17%** |

**So the provenance/cadence pair in this section is not hypothetical** — three real pairs exist and
can be loaded today. The build currently ships only Tom's originals.

⚠️ **The acceptance test exists; the generator does not.** Those three were rewritten **by hand
against the gate**, not produced by it. Treat cadence rewriting as *scored, not automated*.

### The finding that reframes the problem

The same analysis overturned the assumption the concept was built on. **Reading was David's
strongest mode**, landing in one or two takes. **Improvising is what failed** — it dropped 20 of
Tom's 24 signature terms and overran by two to four times.

Two consequences, and both matter for what gets built:

1. **The goal was never to stop reading. It is to stop *looking* like reading.** A requirement
   that removes the transcript because "reading is bad" would be building for a defect that was
   measured and found not to exist.
2. **Some of "I'm bad at teleprompters" was furniture, not skill** — the script was on a monitor
   to the *left* of the lens, which is precisely the problem a teleprompter exists to remove. This
   is why §2 is a requirement and not a preference.

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

### Each style has a scenario it is right for

The choice is not a preference setting — it tracks **how well the talent knows the subject and how
good the transcript is**. This is what makes all three worth deriving:

| Style | Use it when | The trade you are accepting |
|---|---|---|
| **A** near-verbatim | You are cast as the expert but **do not know the topic well**. You have to read. | You will look somewhat like you are reading. Accepted deliberately. |
| **B** compressed concept | The transcript is **good and you want to say it**, you just need the words in the right order. | The middle ground — something to read that does not read as reading. |
| **C** loose keywords | You **know the topic cold** and only need keeping on track. Fits best when there is no real transcript — it is a guideline, not a script. | You must be able to phrase it live; if you blank, it gives you nothing to recover with. |

David's own split across his two contexts: *"from Tom's transcript I'd love style A, because I
don't know the subject matter too much. With my own videos I might want B or C."*

**The same talent needs different styles on different jobs**, which is why the choice is per
scenario and cannot be a one-time setup question.

## 6. The set view — orienting on a batch of scripts

Recorded from Captain's Log B418 (2026-08-17), two days before the Teletubby concept was named.
The trigger was not a feature idea, it was a problem:

> *"There's a bunch of scripts that Tom told me to go and make videos around, and I'm sitting with
> a bit of fear because I don't understand what he's asking me to do."*

**Fear of a batch you have not read is the first thing Teletubby has to solve** — before any
prompting happens, the talent has to be able to take in what they have been handed.

- **A summary per script**, brief, so a set of twelve is scannable in one sitting.
- **All of them reachable in one place** — the set is the unit, not the individual script.
- **One script on screen at a time.** Stated flatly: *"I only ever want to look at one script at a
  time."* Two scripts side by side is not a feature, it is the thing to avoid.
- **Easy movement between them** — this is the same requirement as §3, arrived at independently.
- **Visual, and low effort to read.** *"Don't give me too much brain drain on this, keep it
  simple."*

### Provenance and voice — the rule in his own words

The same passage contains the provenance/voice split that the North Star later ratified, stated
before anyone had a term for it:

> *"Read the voice document for AppyDave. I need you to understand how I think about transcripts
> and videos. **You shouldn't use it to rewrite his scripts, but you could use it to have variations
> of these scripts.**"*

That is exactly *meaning belongs to provenance, voice belongs to the talent* — the provenance script
is not rewritten; variations of it are produced. Recorded here because it is corroboration from a
separate occasion, which makes the ruling harder to drift away from.

**"The voice document"** is his own name for it. The prescriptive rules live in AppyDave's
verbal-style document, with a descriptive voice profile and a large voice corpus behind it. There
is no file literally named `VOICE.md`, and one should not be created — see North Star open item 4.

## 7. Teletubby serves more than one talent

Not a future nicety — it is the second real use case and it sharpens the provenance rule.

**The AITLDR / sponsor case**: a sponsor supplies "this is how you should say it", and Alex has his
own voice and does not want to say it that way. **Teletubby is what brings the two together** —
the sponsor's meaning, the talent's cadence. That is the same provenance/voice split as Tom's
scripts, in a commercial relationship where the provenance owner has a contractual stake.

The consequence for the build: **nothing may assume one talent's speech profile.** The 11.5-word
breath group is David's measurement, not a constant. Every talent gets their own.

## 8. The FliHub feedback loop — direction only, NOT buildable

> 🚧 **Ruled 2026-08-19: you cannot rely on FliHub for this yet. It is all future.**
> The queue-and-promote model below is where David thinks FliHub *should go*, from one conversation
> with someone else — it is **not a contract**, and FliHub is slated for a ground-up rebuild.
> Nothing in this section may be built against today, and no acceptance criterion may depend on it.
> It is recorded so the shape is not lost, not so it can be implemented.

Teletubby still owns no video and no file. What it would gain is an **event**, and this is the return
edge of the loop in §0.

**On each take landing in the queue** — not on promotion — FliHub transcribes it and tells
Teletubby: a take exists, and here is what was actually said. Teletubby compares that against what
was meant to be said.

- **Transcription must move earlier.** Today it happens only when a take is promoted into the
  project. That is too late to be useful, because the comparison is what should *inform* the
  promotion.
- **It upgrades take selection from deterministic to content-aware.** Take scoring today is
  mechanical — recency, length, and the grey/green/yellow that follows from it. With a transcript,
  an agent can read the content: David's own example is that saying *"fuck"* mid-take is a reliable
  signal the take is dead, and it can be tagged the moment it lands.
- **The comparison is the Jaccard score from §4.** Roughly: at 0.9 or higher you said the
  transcript in your own words; at 0.5 you said something else. Below the line is a mode detector,
  not a grade.
- **Over time it learns the stumbles**: *"he keeps falling over this same word — I suggest we
  change this word."* That suggestion is the payoff of the whole loop.

### The split that keeps this honest

> **The Teletubby application receives the event. The Teletubby agent decides what to do with it.**

The application does not get smart. It exposes the event and the comparison; judgement — rewrite
the line, reorder the triggers, flag the stumble — belongs to the agent, consistent with the Star's
ruling that Teletubby edits nothing itself and instead makes itself drivable.

## 9. The script gate — the half that is buildable today

There are two ways to score, and they are not equally available.

| | Score the **script**, before the take | Score the **take**, after it |
|---|---|---|
| Needs | nothing but the text | a transcript — i.e. §8, which is future |
| Nature | **deterministic**, ~40 lines of stdlib | depends on an unbuilt loop |
| Status | **buildable now** | blocked |

**A working scorer already exists** at `phase-1-scripts/score.py` in the Kybernesis brain — eight
falsifiable threshold rules: length, breath-group mean, break density, sentence-length standard
deviation, zero em-dash appositives, 100% of mandatory terms retained, zero anti-voice words, and
channel bookends.

**The requirement**: a script that fails the talent's envelope is **visibly flagged** before it is
ever put on screen — or refused. No model, no live listening, no FliHub.

Two things this must not become:

- **It must not interrupt a take.** Scoring happens before, or at a take boundary. Interrupting
  someone mid-sentence to tell them they fluffed it fails the Star's test outright.
- **Thresholds are per talent and are never ported.** David's envelope is ~11.2-word breath groups
  with ≤3.6 breaks per 100 words. Those are *his measurements*. Applying them to Alex makes the gate
  meaningless.

### Where a new talent's envelope comes from

An earlier open item assumed a talent needs 45 takes against a known script. **They do not.** David's
envelope was derived from **318 punctuated transcripts / ~229k words of ordinary published video** —
the 45 takes were the *failure evidence*, not the envelope. `verbal-style-forge` already does this
derivation.

One hard constraint: **the corpus must be punctuated.** Auto-captions carry no terminal punctuation
and mixing them in silently corrupts the result — it pushed mean sentence length from 16.5 to 34.9.
Filter to at least two terminal marks per 100 words.

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
6. **Does Teletubby hold an incoming idea, or only a transcript?** The §0 seam. The largest of
   these, because it decides whether Teletubby is a prompter or a content tool.
7. ~~**What Teletubby does with a poor Jaccard score in the moment.**~~ **Answered.** Score the
   script before the take (deterministic, §9); score the take only at a take boundary, never
   mid-sentence. The mid-take half is blocked on §8 regardless.
   *Superseded detail:* The comparison is specified;
   whether it interrupts the talent mid-session, waits for the end of the take, or only ever
   surfaces to the agent is not — and interrupting someone mid-take to tell them they fluffed it
   fails the Star's test outright.
8. ~~**How a talent's speech profile is established.**~~ **Answered** — see §9. Derived from any
   corpus of the talent's own *punctuated* unscripted speech via `verbal-style-forge`; the 45 takes
   were failure evidence, not the envelope. Remaining work is a one-off measurement per talent
   (AI-TLDR has a verbal style but no measured envelope), not a Teletubby feature.
9. **Which corpus the trigger-style experiment runs against.** Trigger styles derived from Tom's
   7-word breath groups are **not the same experiment** as styles derived from the re-cadenced
   11-word versions. Carrying both and letting the talent switch turns "which trigger style" and
   "which cadence" into one two-axis experiment instead of two sequential ones. Unresolved.
10. **Where the camera actually is.** §2 requires the driven zone to sit nearest the lens, but
   nothing tells the app which edge that is — the talent sets it, it is detected, or it is inferred
   from where they drag the window.

*Nothing in this file has been implemented. It records what was ruled and what was measured, so the
build has something to be checked against.*
