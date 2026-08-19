---
adr: 001
title: Rebuild on AppyTron rather than extend the working artifact
status: accepted
date: 2026-08-19
---

# ADR-001 — Rebuild on AppyTron rather than extend the working artifact

## Context

A single self-contained HTML prompter already existed and had been **driven live on camera**. It
reached "usable on camera" in one sitting with no build step, no dependencies and no server.

The alternative was to keep extending it.

## Decision

Scaffold a fresh Electron app from `create-appytron`, matched to ImageDrip's structure, and lift the
concepts and data across rather than the file.

## Why

- **The value is not in the shell.** The prior-art write-up says it plainly: a single HTML file got
  to usable in one sitting, so *"the bar for the recording surface is low; the value is in columns
  1–2 and the AI layer."*
- **The roadmap needs a process boundary.** Reading local files, receiving FliHub events, and being
  driven by an external agent all need something a sandboxed page cannot do.
- **Consistency with the ecosystem.** Same stack as ImageDrip, same registry slot, same brand
  tokens, same upgrade path.

## Consequences

**Accepted:**
- npm-only, Electron toolchain, and a real install step where there was none.
- Inherited the AppyTron drag-region defect on day one — see
  [the learning](../learnings/hiddeninset-leaves-no-drag-region.md). Fixed here and upstream.
- The renderer dev server takes a registered port (7110) instead of Vite's default.

**Rejected alternative — keep the artifact**: cheap and already working, but it can never record,
never be driven, and cannot hold the data pipeline. It remains valuable as **evidence**, not as a
base.

**Note**: the artifact was subsequently lost (never committed, URL 404s), which the decision did
not anticipate and which strengthens it only by accident — see
[an-artifact-url-is-not-durable-storage](../learnings/an-artifact-url-is-not-durable-storage.md).
