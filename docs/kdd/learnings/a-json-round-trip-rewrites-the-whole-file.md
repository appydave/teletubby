---
learning: a-json-round-trip-rewrites-the-whole-file
category: tooling
severity: medium
date: 2026-08-19
status: fixed
---

# Editing shared JSON by round-trip rewrites lines you never touched

**The one-line version**: adding one entry to `~/.config/appydave/*.json` with
`json.load` → `json.dumps` produced a 22-line diff of files nobody edited, in **both** directions.

## What happened

Twice, on the same shared config repo:

1. **apps.json** — written with the default `ensure_ascii=True`, which escaped every em-dash in the
   file to `\u2014`. A 14-line addition arrived as *26 insertions, 12 deletions*.
2. **locations.json** — corrected with `ensure_ascii=False`, which then *un*-escaped 22 em-dashes
   that were already stored escaped. Same problem, opposite direction.

The values are identical after parsing either way. The diff is not: it buries the real change and
makes the file's history unreadable for anyone reviewing it later.

## The fix

For a one-entry addition to a shared JSON file, **do a surgical text insert** against a known
anchor rather than a parse-and-dump:

```python
anchor = '    {\n      "key": "video-shared",'
p.write_text(s.replace(anchor, entry + anchor, 1))
```

Then parse the result once to prove it is still valid JSON. The locations.json change landed as
13 insertions, all of them mine.

## The general rule

**A formatter is not a no-op on a file you do not own the formatting of.** This applies to any
shared, hand-maintained, git-tracked config — the cost is not correctness, it is that a reviewer
can no longer see what actually changed.
