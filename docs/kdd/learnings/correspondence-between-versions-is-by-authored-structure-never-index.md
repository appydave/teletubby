---
learning: correspondence-between-versions-is-by-authored-structure-never-index
category: domain
severity: high
date: 2026-08-30
status: fixed
files:
  - src/renderer/src/store.ts
  - test/prompter-navigation.test.ts
  - scripts/authored-domain.mjs
---

# Correspondence between two versions of a text is by authored structure, never by index

**The one-line version**: when two versions of the same document have to be lined up — Tom's
original against the cadence rewrite — the honest mapping is the **authored grouping** (which
topic owns which paragraph), never the paragraph number. Index-mapping lines up by accident on
1:1 scripts and lands on the wrong topic, silently, the moment a rewrite redraws paragraphs.

## What happened

David A/B'd script 04 paragraph by paragraph, flipping `TOM-ORIGINAL` ↔ `V04-REWRITE` in the
footer to judge whether the rewrite read better. Every flip dropped him to paragraph 1:

> "I need to be able to switch between them really quickly so I can see the change… when I
> switch from Tom to David, it takes me back to the beginning, so I can't just switch backwards
> and forwards and see them visually at the right location."

The reset was a **decision**, not an oversight — `selectTranscript` documented it: *"a cadence
transcript is a different document, not a translation — v02 re-cadences four of Tom's paragraphs
into three, so no honest correspondence exists, and a wrong sync is worse than none."* The
premise was wrong. A correspondence does exist; it is just not the paragraph index.

Paragraph ids (`p1`…`pN`) are positional and mean nothing across corpora: Tom's `p3` on script
02 is the rewrite's `p2`. Topic ids (`t2.1`) are positional too — but over the grouping the
author wrote in `scripts/authored-domain.mjs`, beside the text, where "four become three" is
recorded as *which* beats folded. That grouping is the author's own claim about structure. Rule 3
of this app says the trigger→paragraph map is authored data, never derived positionally; the
same rule applies to version↔version.

## The fix

```ts
// wrong way — the reset, and the index-mapping it was avoiding
set({ transcriptId, style: defaultStyle(transcript), step: 0 });
// (an index map would have done: paragraphsOf(to)[indexOf(from, paragraphId)])

// right way — by topic, with a stated ragged edge
export const correspondingParagraphId = (from, paragraphId, to) => {
  const owner = ownership(from).get(paragraphId);          // { minor, major }
  // 1. same MINOR topic in `to`  → its first paragraph
  // 2. else same MAJOR topic     → its first paragraph (the minor was folded)
  // 3. else                      → the LAST paragraph, so the end card lights
};
```

Pinned for the ragged case (02, 4→3): `p1→p1`, `p2→p1` (folded via major `t1`), `p3→p2`,
`p4→p3`, and the reverse `p2→p3`.

## The general rule

**Line up versions by the structure a human authored, and say out loud what happens at the
ragged edge.** Two corollaries:

- The fallback must be **visible**, never a silent reset to the top. Landing on the last
  paragraph lights the end card — the screen states that the target has nowhere for this beat
  to go. A silent drop to paragraph 1 read to the talent as "the rewrite is missing".
- "No honest correspondence exists" is a claim to check against the authored data, not to
  assert. Here it was false, and the false claim cost the only mechanism the talent has for
  judging a rewrite by eye.

Cross-app: any tool that holds two versions of a text — transcript vs edit, draft vs rewrite,
source vs translation — hits this the first time the paragraph counts diverge.
