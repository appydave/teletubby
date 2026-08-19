---
learning: an-idle-agent-is-not-a-finished-agent
category: process
severity: high
date: 2026-08-19
status: open
---

# An idle notification is not a completed task

**The one-line version**: two background agents went idle three times between them without ever
returning their report or saying they could not — and an idle notification looks exactly like
completion.

## What happened

Two capture-mining agents were spawned with an explicit output shape. Each signalled
`idle_notification … "available"`. Neither delivered findings. Both were messaged directly asking
for the report, or for an admission that the read had not happened; both went idle again without
answering.

## Why it is dangerous rather than merely annoying

The failure is silent and it lands on a decision point. The caller has:

- a notification that reads as success,
- a prompt they wrote themselves, which usually contains a **summary of the material** for scoping,
- and no output.

The tempting move is to write up findings from that summary. They would read as real, cite a real
capture, and be **entirely fabricated**. Absence and success look identical, which is exactly the
condition this project treats as the most expensive kind of bug.

## What was done instead

Stopped after the second ping, said plainly that the delegation had failed, and read both
transcripts in the main session. Slower and costlier in context, but the findings are traceable to
text that was actually read.

## The general rule

**Do not treat an idle signal as a result.** If delegated work must be trusted, have the agent
write its output to a named path and check the file exists — a return channel that can fail silently
is not evidence. And never reconstruct a delegated finding from the prompt you wrote for it.
