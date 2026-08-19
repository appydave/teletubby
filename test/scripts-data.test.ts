import { describe, expect, it } from 'vitest';
import { SCRIPTS } from '@shared/scripts';

/**
 * The bullet→paragraph map is authored data, not derived — so it can be wrong
 * in ways a positional scheme cannot. These are the three checks that caught
 * real errors while the maps were being written (prior-art §5), plus the
 * boundary invariant the navigation model depends on.
 */
describe('the twelve Kybernesis scripts', () => {
  it('ships all twelve', () => {
    expect(SCRIPTS).toHaveLength(12);
    expect(SCRIPTS.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it.each(SCRIPTS)('$n · $title', (script) => {
    const paragraphs = script.sections.length;

    // Column 1 has exactly one heading per spoken beat.
    expect(script.sections.every((s) => s.heading.trim().length > 0)).toBe(true);
    expect(script.sections.every((s) => s.paragraph.trim().length > 0)).toBe(true);

    // A hook, 4–6 points, and a landing line.
    expect(script.bullets.length).toBeGreaterThanOrEqual(6);

    // Length matches step count.
    expect(script.map).toHaveLength(script.bullets.length);

    // No index past the last paragraph, and none before the first.
    for (const p of script.map) {
      expect(p).toBeGreaterThanOrEqual(1);
      expect(p).toBeLessThanOrEqual(paragraphs);
    }

    // Monotonically non-decreasing — the transcript may dwell, never rewind.
    for (let i = 1; i < script.map.length; i++) {
      expect(script.map[i]).toBeGreaterThanOrEqual(script.map[i - 1]);
    }

    // The map spans the whole script: first beat opens it, last beat closes it.
    expect(script.map[0]).toBe(1);
    expect(script.map[script.map.length - 1]).toBe(paragraphs);
  });

  it('holds the landing line to Tom’s approved takeaway', () => {
    const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    for (const script of SCRIPTS) {
      const landing = script.bullets[script.bullets.length - 1];
      expect(norm(script.takeaway).length).toBeGreaterThan(0);
      // The landing line is the takeaway, allowing for the display-case rewrite.
      const a = norm(landing);
      const b = norm(script.takeaway);
      const overlap = b.split(' ').filter((w) => w.length > 3 && a.includes(w)).length;
      expect(overlap).toBeGreaterThanOrEqual(3);
    }
  });
});
