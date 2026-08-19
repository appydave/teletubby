# Teletubby

An open-source teleprompter that you **glance at**, not read from.

Standard teleprompters make you recite. Teletubby is built on the opposite bet: the
words that come out of your mouth should be *yours*, and the screen's job is only to
keep you on track. It does that with three columns instead of one scrolling wall of text.

```
┌──────────────┬─────────────────────┬────────────────────────────┐
│ 1. TOPIC     │ 2. TRIGGERS         │ 3. TRANSCRIPT              │
│              │                     │                            │
│ Intro        │ • memory fades      │ "Most teleprompters make   │
│ The problem  │ • not my voice      │  you recite someone else's │
│ The 3 cols   │ • glance not read   │  sentences. That's the     │
│ Close        │                     │  part that breaks..."      │
│              │                     │                            │
│ where you    │ where your EYES     │ the safety net you read    │
│ are          │ live while talking  │ BEFORE you hit record      │
└──────────────┴─────────────────────┴────────────────────────────┘
```

**Column 2 is the product.** Everything else is context.

## Why it exists

David's own constraint, stated plainly: *"my memory is going — I can't hold recited
sentences in my head."* Scripts written by someone (or something) else don't come out
naturally, because they aren't in his voice. Reading verbatim looks like reading
verbatim. The fix isn't a better script — it's needing less of it on screen.

## Status

🌱 **Seed.** No code yet. This repo currently holds the concept, the source
brainstorm, and the open questions.

## Docs

| Doc | What's in it |
|---|---|
| [docs/concept.md](docs/concept.md) | The three-column model, the AI layer, FliHub integration |
| [docs/open-questions.md](docs/open-questions.md) | What's genuinely unresolved — trigger words, scrolling, scope |
| [docs/source/b421-2026-08-19-plaud.md](docs/source/b421-2026-08-19-plaud.md) | Raw origin brainstorm (Captain's Log B421) |
| [docs/prior-art-kybernesis-prompter.md](docs/prior-art-kybernesis-prompter.md) | A working two-column prompter built the day before — what it settled, what it didn't |

## Related

- **Kybernesis** — the video channel this was conceived to serve
- **FliHub** (`~/dev/ad/flivideo/flihub`) — per-section recordings get captured and stitched there
