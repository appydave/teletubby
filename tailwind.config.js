/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  // AppyDave is LIGHT-ONLY. `darkMode: []` disables Tailwind's `dark:` variant
  // outright, so a `dark:` class cannot silently reintroduce a second palette.
  darkMode: [],
  theme: {
    extend: {
      // Every colour resolves to a token declared in src/renderer/src/index.css.
      // Nothing here is a raw hex value.
      colors: {
        canvas: 'var(--tt-canvas)',
        panel: 'var(--tt-panel)',
        card: 'var(--tt-card)',
        edge: 'var(--tt-border)',
        chrome: 'var(--tt-chrome)',
        ink: 'var(--tt-text)',
        muted: 'var(--tt-text-muted)',
        'ink-invert': 'var(--tt-text-on-dark)',
        driven: 'var(--tt-driven)',
        'driven-wash': 'var(--tt-driven-wash)',
        follower: 'var(--tt-follower)',
        'follower-wash': 'var(--tt-follower-wash)',
        sequence: 'var(--tt-sequence)',
        veil: 'var(--tt-veil)',
        'lane-alt': 'var(--tt-lane-alt)',
        'edge-strong': 'var(--tt-border-strong)',
      },
      fontFamily: {
        display: 'var(--tt-font-display)',
        body: 'var(--tt-font-body)',
        mono: 'var(--tt-font-mono)',
      },
      fontSize: {
        bullet: 'var(--tt-bullet-size)',
        script: 'var(--tt-script-size)',
        topic: 'var(--tt-topic-size)',
      },
    },
  },
  plugins: [],
};
