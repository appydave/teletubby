import { useCallback, useEffect, useRef } from 'react';

/**
 * A drag handle between two zones.
 *
 * David asked for this twice in one take, from two directions: "I don't have
 * any way of resizing them like dragging them left to right" and, on the take
 * Jan liked least, "we can see your eyes moving left and right." On a 32"
 * screen the zones are too wide and the eyeline travels horizontally, which
 * costs exactly what the vertical reading line just bought. He worked around it
 * by shrinking the whole window (B437).
 *
 * It is a control, and the Star's test is suspicious of those — but this one is
 * set once before a take, like the text preset, and it removes something to
 * read rather than adding it.
 */
export default function Divider({
  onResize,
}: {
  /** Called with the pointer delta in pixels while dragging. */
  onResize: (deltaX: number) => void;
}): JSX.Element {
  const last = useRef<number | null>(null);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    last.current = event.clientX;
    // Capture on the window, not the handle: the pointer routinely outruns a
    // 6px target mid-drag, and without this the divider stops following.
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (last.current === null) return;
      const delta = event.clientX - last.current;
      last.current = event.clientX;
      if (delta !== 0) onResize(delta);
    },
    [onResize],
  );

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    last.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  useEffect(() => () => void (last.current = null), []);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      // A keyboard user gets the same control, and it cannot be confused with
      // stepping: the arrows only reach it while it holds focus.
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          event.stopPropagation();
          onResize(-24);
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          event.stopPropagation();
          onResize(24);
        }
      }}
      className="group relative w-1.5 shrink-0 cursor-col-resize bg-edge transition-colors hover:bg-follower focus:bg-follower focus:outline-none"
    >
      {/* A wider invisible hit area than the visible line, so the handle is
          grabbable without making the seam between zones look heavy. */}
      <span className="absolute inset-y-0 -left-2 -right-2" aria-hidden="true" />
    </div>
  );
}
