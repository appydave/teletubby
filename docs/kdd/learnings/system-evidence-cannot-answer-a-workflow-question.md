---
learning: system-evidence-cannot-answer-a-workflow-question
category: process
severity: high
date: 2026-09-02
status: open
---

# System evidence cannot answer a workflow question

**The one-line version**: a full day of project-support work — data model, guards,
published shapes, a chip-row UI, a grain contract, a registry ruling — was designed
entirely from what SYSTEMS said (FliHub's code, folders on disk, API counts, measured
artifacts) and shipped without once asking David how he works with video projects. His
verdict: *"the worst user experience I've seen — it has no relevance to how I do video
projects. Why aren't you guys listening to me?"*

## What happened

The ask, made four times, was small: **create three projects.** What got delivered was
an architecture. Every input was rigorous and none of it was the right kind: flihub-dev
verified the naming grammar against code and disk; the registry was measured live (62
real projects); the grain collision across three apps was mapped with per-line
provenance; scope was managed, gates were enforced, refusals were demonstrated at
runtime. The evidence chain was excellent — **and it was all downstream of systems**,
so it could only ever describe what the software does today, not what the human does.

The orchestrator owned the miss: David has a standing rule against exactly this —
*the code is a stale snapshot; interview the human first* (it is why
`compass:set-north-star` opens by interviewing before reading any code) — and the day
ran the other way round.

What survived his verdict, and why: the **plumbing** (identity = FliHub folder name
verbatim, the attach/move guard, published input shapes, defaults). Those answer
questions systems CAN answer — what is unique, what drifts, what a caller needs to
know. The **interface** died, because "how do you pick and create projects mid-work"
is a workflow question, and no amount of disk-reading answers it.

## The general rule

**Match the evidence type to the question type.** Code, folders and APIs are authority
for CONTRACT questions (identity, uniqueness, grammar, what exists). They are not
evidence AT ALL for WORKFLOW questions (what the human reaches for, when, in what
order, under what pressure) — for those, the human is the primary source and everything
else is a stale snapshot. A design review should ask of every input: *could this fact,
however verified, tell me what the person actually does?* If no such input exists, the
design is speculation wearing provenance.

Corollary for the fix: do not redesign from the same inputs — a second design from
system evidence will be wrong the same way. The next input has to be the human.
