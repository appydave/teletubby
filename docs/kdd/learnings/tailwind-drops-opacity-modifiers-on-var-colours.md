---
learning: tailwind-drops-opacity-modifiers-on-var-colours
category: frontend
severity: high
date: 2026-08-19
status: fixed
---

# Tailwind silently drops an opacity modifier on a `var()` colour

**The one-line version**: `bg-canvas/92` where `canvas` resolves to `var(--tt-canvas)` compiles to
**nothing at all** — no rule is emitted, the element renders with no background, and nothing errors.

## What happened

The design tokens are CSS custom properties, and `tailwind.config.js` maps colour names onto them
(`canvas: 'var(--tt-canvas)'`). Components then used the ordinary opacity syntax for translucent
surfaces: `bg-canvas/92` for the cue-card backdrop, `bg-panel/40` for the transcript lane,
`border-ink/25` and `border-ink/15` on buttons.

Tailwind cannot compute an alpha channel from an opaque `var()` reference, so it does not generate
the utility. **It does not warn.** The class stays in the markup, looks correct in review, and the
element paints with no background and no border.

Caught by grepping the built CSS for the class names rather than by looking at the app —
`grep -c "bg-canvas\\/92" out/renderer/assets/*.css` returned `0`.

## The fix

Declare a real token for every translucent surface instead of deriving one:

```css
--tt-veil: #faf5ecf0;   /* cue-card backdrop */
--tt-lane-alt: #f7f2e8; /* transcript lane */
--tt-border-strong: #b9ad9c;
```

## The general rule

**A design-token colour cannot take an opacity modifier.** If a surface needs alpha, it needs its
own token. And when a utility class is doing something invisible, **check the built CSS, not the
component** — the class being present in the JSX proves nothing.
