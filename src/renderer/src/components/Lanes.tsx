import { useEffect, useRef } from 'react';
import type { PrompterScript } from '@shared/scripts';
import EndCard from './EndCard';

/**
 * Column ranking. The lane you are driving gets the strong yellow marker; a
 * lane that merely follows gets the quieter gold one. Two equally-loud markers
 * read as two competing claims about where you are — prior-art §5.
 */
export type Rank = 'driven' | 'follower';

const markerBar = (rank: Rank, active: boolean): string => {
  if (!active) return 'border-l-2 border-transparent';
  return rank === 'driven'
    ? 'border-l-4 border-driven bg-driven-wash'
    : 'border-l-4 border-follower bg-follower-wash';
};

/** Scrolls the active row to the centre of its lane whenever it changes. */
function useCentre(active: boolean, deps: unknown[]) {
  const ref = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    if (active && ref.current) {
      ref.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/* ------------------------------------------------------------------ */
/* Column 1 — topic headings. Orientation: "where am I?"               */
/* ------------------------------------------------------------------ */

export function TopicRail({
  script,
  sectionIndex,
}: {
  script: PrompterScript;
  sectionIndex: number;
}): JSX.Element {
  return (
    <nav
      aria-label="Topics"
      className="tt-lane-scroll h-full w-56 shrink-0 border-r border-edge bg-panel px-4 py-6"
    >
      <p className="mb-4 font-display text-[0.65rem] uppercase tracking-[0.2em] text-muted">
        1 · Topic
      </p>
      <ol className="space-y-1">
        {script.sections.map((section, i) => {
          const active = i === sectionIndex;
          return (
            <li key={i}>
              <div
                className={[
                  'rounded-r px-3 py-2 transition-colors duration-150',
                  markerBar('follower', active),
                ].join(' ')}
              >
                <span className="mr-2 font-mono text-[0.7rem] text-sequence">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={[
                    'font-display text-topic uppercase tracking-wide',
                    active ? 'text-ink' : 'text-muted',
                  ].join(' ')}
                >
                  {section.heading}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Column 2 — the triggers. This is the product: glance, don't read.   */
/* ------------------------------------------------------------------ */

export function BulletLane({
  script,
  step,
  rank,
  focus,
}: {
  script: PrompterScript;
  step: number;
  rank: Rank;
  focus: boolean;
}): JSX.Element {
  const last = script.bullets.length - 1;

  return (
    <section className="tt-lane-scroll h-full flex-1 px-8 py-6" aria-label="Triggers">
      <p className="mb-4 font-display text-[0.65rem] uppercase tracking-[0.2em] text-muted">
        2 · Triggers
      </p>
      <ol className="space-y-2">
        {script.bullets.map((bullet, i) => {
          const active = i === step;
          const isEdge = i === 0 || i === last;
          return (
            <BulletRow
              key={i}
              index={i}
              step={step}
              active={active}
              isEdge={isEdge}
              rank={rank}
              focus={focus}
              text={bullet}
            />
          );
        })}
      </ol>
      <EndCard />
    </section>
  );
}

function BulletRow({
  index,
  step,
  active,
  isEdge,
  rank,
  focus,
  text,
}: {
  index: number;
  step: number;
  active: boolean;
  isEdge: boolean;
  rank: Rank;
  focus: boolean;
  text: string;
}): JSX.Element {
  const ref = useCentre(active, [step]);

  return (
    <li ref={ref}>
      <div
        className={[
          'rounded-r px-4 py-2 transition-all duration-150',
          markerBar(rank, active),
          active ? 'opacity-100' : focus ? 'opacity-25' : 'opacity-55',
        ].join(' ')}
      >
        <span
          className={[
            'text-bullet leading-snug',
            // Hook and landing lines are display type — the middle points are
            // the things you actually glance at mid-sentence.
            isEdge
              ? 'font-display font-semibold uppercase tracking-wide text-ink'
              : 'font-body text-ink',
          ].join(' ')}
        >
          {!isEdge && <span className="mr-3 text-follower">▪</span>}
          {text}
        </span>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Column 3 — the transcript. Read before the take; a net during it.   */
/* ------------------------------------------------------------------ */

export function ScriptLane({
  script,
  sectionIndex,
  rank,
  focus,
}: {
  script: PrompterScript;
  sectionIndex: number;
  rank: Rank;
  focus: boolean;
}): JSX.Element {
  return (
    <section
      className="tt-lane-scroll h-full flex-1 border-l border-edge bg-lane-alt px-8 py-6"
      aria-label="Transcript"
    >
      <p className="mb-4 font-display text-[0.65rem] uppercase tracking-[0.2em] text-muted">
        3 · Transcript
      </p>
      <ol className="space-y-4">
        {script.sections.map((section, i) => (
          <ScriptRow
            key={i}
            index={i}
            sectionIndex={sectionIndex}
            active={i === sectionIndex}
            rank={rank}
            focus={focus}
            paragraph={section.paragraph}
          />
        ))}
      </ol>
    </section>
  );
}

function ScriptRow({
  index,
  sectionIndex,
  active,
  rank,
  focus,
  paragraph,
}: {
  index: number;
  sectionIndex: number;
  active: boolean;
  rank: Rank;
  focus: boolean;
  paragraph: string;
}): JSX.Element {
  const ref = useCentre(active, [sectionIndex]);

  return (
    <li ref={ref}>
      <div
        className={[
          'rounded-r px-4 py-2 transition-all duration-150',
          markerBar(rank, active),
          active ? 'opacity-100' : focus ? 'opacity-25' : 'opacity-60',
        ].join(' ')}
      >
        <span className="mr-3 font-mono text-[0.7rem] text-sequence">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="font-body text-script leading-relaxed text-ink">{paragraph}</span>
      </div>
    </li>
  );
}
