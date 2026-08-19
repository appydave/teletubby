---
learning: an-artifact-url-is-not-durable-storage
category: process
severity: high
date: 2026-08-19
status: open
---

# An artifact URL is not durable storage

**The one-line version**: the original Kybernesis prompter — the only working prior art, driven
live the day before — could not be recovered. It was never committed, and its artifact URL now
returns 404.

## What happened

`docs/prior-art-kybernesis-prompter.md` records the prompter's source as
`~/dev/video-projects/v-kybernesis/phase-1/prompter.html`, with a live artifact URL beside it, and
states that *"the source files on disk are the durable copies — the artifacts are republished from
them."*

Neither held:

- The file **does not exist** in that repo and never has — two commits, neither contains it.
- The artifact URL returns *"artifact not found — it may have been deleted."* The doc had already
  warned that a *different* artifact URL for the same project had 404'd. It happened again.

Lost with it: the authored bullet sets for all twelve scripts and, more importantly, the
**bullet→paragraph maps**, which the same document describes as authored data that cannot be
reconstructed positionally.

## What saved it

Partly. `briefs-and-draft-scripts.html` *was* committed, and carries the twelve scripts plus Tom's
verbatim takeaway lines — so the paragraphs were recoverable verbatim and only the trigger sets had
to be re-authored. One bullet set survives exactly, because it had been **quoted into a committed
markdown document** rather than merely linked.

## The general rule

**If it is not in git, it does not exist.** A hosted artifact is a rendering, not a copy. When
something matters, quote it into a committed document — the surviving script-08 bullet set is proof
that quoting beats linking.
