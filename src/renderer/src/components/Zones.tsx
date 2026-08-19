import { useEffect, useRef } from 'react';
import type { MajorTopic, MinorTopic, Paragraph, Transcript } from '@shared/domain';
import { paragraphsOf } from '@shared/domain';
import { ZONE_LABEL, type Rank, type RecordingZone } from '../store';
import EndCard from './EndCard';

/**
 * THE ZONES — requirements §1.
 *
 * Each zone renders the same one position in the script from a different
 * altitude: where you are (major), what you are on (minor), what to say
 * (triggers), and the words themselves (paragraph). None of them holds a
 * cursor; they are all handed the current position by the store.
 *
 * **Ranking is not decided here.** A component may render `rank`; it may not
 * work out which zone is driven — that is the store's job, and keeping it there
 * is what makes "never two strong markers" testable without a DOM.
 */

const markerBar = (rank: Rank, active: boolean): string => {
  if (!active) return 'border-l-2 border-transparent';
  return rank === 'driven'
    ? 'border-l-4 border-driven bg-driven-wash'
    : 'border-l-4 border-follower bg-follower-wash';
};

/** Scrolls the active row to the centre of its zone whenever it changes. */
function useCentre(active: boolean, deps: unknown[]) {
  const ref = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    if (active && ref.current) ref.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

function ZoneShell({
  zone,
  rank,
  wide,
  children,
}: {
  zone: RecordingZone;
  rank: Rank;
  wide?: boolean;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section
      aria-label={ZONE_LABEL[zone]}
      data-zone={zone}
      data-rank={rank}
      className={[
        'tt-lane-scroll h-full border-l border-edge px-6 py-6 first:border-l-0',
        wide ? 'flex-[2]' : 'flex-1',
        rank === 'driven' ? 'bg-canvas' : 'bg-lane-alt',
      ].join(' ')}
    >
      <p className="mb-4 flex items-center gap-2 font-display text-[0.65rem] uppercase tracking-[0.2em] text-muted">
        {ZONE_LABEL[zone]}
        {/* The driven zone says so in words as well as colour — a marker you
            have to decode is a thing to learn, which the Star's test forbids. */}
        {rank === 'driven' && (
          <span className="rounded-sm bg-driven px-1.5 py-0.5 text-[0.6rem] text-ink">driving</span>
        )}
      </p>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Major topic — where you are in the script
 * ------------------------------------------------------------------ */

export function MajorZone({
  transcript,
  current,
  rank,
  focus,
}: {
  transcript: Transcript;
  current: MajorTopic | undefined;
  rank: Rank;
  focus: boolean;
}): JSX.Element {
  return (
    <ZoneShell zone="major" rank={rank}>
      <ol className="space-y-1">
        {transcript.topics.map((major, i) => {
          const active = major.id === current?.id;
          return (
            <Row key={major.id} active={active} dep={current?.id} rank={rank} focus={focus}>
              <span className="mr-2 font-mono text-[0.7rem] text-sequence">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className={[
                  'font-display text-bullet uppercase tracking-wide',
                  active ? 'text-ink' : 'text-muted',
                ].join(' ')}
              >
                {major.heading}
              </span>
            </Row>
          );
        })}
      </ol>
    </ZoneShell>
  );
}

/* ------------------------------------------------------------------ *
 * Minor topic — the sub-point under it
 * ------------------------------------------------------------------ */

export function MinorZone({
  transcript,
  current,
  rank,
  focus,
}: {
  transcript: Transcript;
  current: MinorTopic | undefined;
  rank: Rank;
  focus: boolean;
}): JSX.Element {
  const minors = transcript.topics.flatMap((major) => major.minors);
  return (
    <ZoneShell zone="minor" rank={rank}>
      <ol className="space-y-1">
        {minors.map((minor, i) => (
          <Row
            key={minor.id}
            active={minor.id === current?.id}
            dep={current?.id}
            rank={rank}
            focus={focus}
          >
            <span className="mr-2 font-mono text-[0.7rem] text-sequence">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span
              className={[
                'font-display text-topic uppercase tracking-wide',
                minor.id === current?.id ? 'text-ink' : 'text-muted',
              ].join(' ')}
            >
              {minor.heading}
            </span>
          </Row>
        ))}
      </ol>
    </ZoneShell>
  );
}

/* ------------------------------------------------------------------ *
 * Triggers — the product. Glance, don't read.
 * ------------------------------------------------------------------ */

export function TriggerZone({
  triggers,
  step,
  rank,
  focus,
}: {
  triggers: { text: string; paragraphId: string }[];
  step: number;
  rank: Rank;
  focus: boolean;
}): JSX.Element {
  const last = triggers.length - 1;

  return (
    <ZoneShell zone="triggers" rank={rank} wide>
      {triggers.length === 0 ? (
        // Never invent one. Say plainly that nobody has authored them, so the
        // talent knows this is a gap in the data rather than a broken app.
        <p className="rounded border border-edge bg-card px-4 py-3 font-body text-script text-muted">
          No trigger words authored for this transcript yet. Pick another corpus, or have an agent
          write a set through the control API.
        </p>
      ) : (
        <ol className="space-y-2">
          {triggers.map((trigger, i) => (
            <Row
              key={i}
              active={i === step}
              dep={step}
              rank={rank}
              focus={focus}
              opacity={focus ? 'opacity-25' : 'opacity-55'}
            >
              <span
                className={[
                  'text-bullet leading-snug',
                  // Hook and landing lines are display type — the middle points
                  // are what you actually glance at mid-sentence.
                  i === 0 || i === last
                    ? 'font-display font-semibold uppercase tracking-wide text-ink'
                    : 'font-body text-ink',
                ].join(' ')}
              >
                {i !== 0 && i !== last && <span className="mr-3 text-follower">▪</span>}
                {trigger.text}
              </span>
            </Row>
          ))}
        </ol>
      )}
      <EndCard />
    </ZoneShell>
  );
}

/* ------------------------------------------------------------------ *
 * Paragraph — the transcript for the beat you are on, and only that
 * ------------------------------------------------------------------ */

export function ParagraphZone({
  paragraph,
  rank,
}: {
  paragraph: Paragraph | undefined;
  rank: Rank;
}): JSX.Element {
  return (
    <ZoneShell zone="paragraph" rank={rank} wide>
      <div
        className={[
          'rounded-r px-4 py-3 transition-colors duration-150',
          markerBar(rank, true),
        ].join(' ')}
      >
        {/* One paragraph, not a scrolling wall. The whole script is a separate
            surface you slide out deliberately. */}
        <p className="font-body text-script leading-relaxed text-ink">{paragraph?.text ?? '—'}</p>
      </div>
    </ZoneShell>
  );
}

/* ------------------------------------------------------------------ *
 * The full transcript — a skim surface, and an OVERLAY
 * ------------------------------------------------------------------ */

/**
 * requirements open item 1 asks whether this overlays the recording set or
 * displaces it. It overlays, and that is derived rather than chosen: §2 says
 * the driven zone must sit nearest the lens, and displacing the columns to make
 * room would push it away from the lens the moment the talent went looking for
 * their place. Overlaying leaves the arrangement exactly where it was.
 */
export function TranscriptDrawer({
  transcript,
  currentParagraphId,
  edge,
  open,
  onClose,
}: {
  transcript: Transcript;
  currentParagraphId: string | null;
  edge: 'left' | 'right';
  open: boolean;
  onClose: () => void;
}): JSX.Element | null {
  if (!open) return null;
  const paragraphs = paragraphsOf(transcript);

  return (
    <div className="absolute inset-0 z-20 flex" onClick={onClose} role="presentation">
      <div
        className={[
          'tt-lane-scroll h-full w-[46%] border-edge bg-panel px-7 py-6 shadow-xl',
          edge === 'left' ? 'order-first border-r' : 'order-last ml-auto border-l',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <p className="mb-4 flex items-baseline gap-3 font-display text-[0.65rem] uppercase tracking-[0.2em] text-muted">
          Full transcript
          <span className="font-mono normal-case tracking-normal">{transcript.corpus}</span>
          <span className="ml-auto font-mono text-[0.65rem] normal-case tracking-normal">
            T to close
          </span>
        </p>
        <ol className="space-y-3">
          {paragraphs.map((paragraph, i) => (
            <Row
              key={paragraph.id}
              active={paragraph.id === currentParagraphId}
              dep={currentParagraphId}
              // Always the quiet marker. This is where you are LOOKING, never
              // what you are driving — the driven zone keeps the strong one.
              rank="follower"
              focus={false}
            >
              <span className="mr-3 font-mono text-[0.7rem] text-sequence">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-body text-script leading-relaxed text-ink">
                {paragraph.text}
              </span>
            </Row>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Row({
  active,
  dep,
  rank,
  focus,
  opacity,
  children,
}: {
  active: boolean;
  dep: unknown;
  rank: Rank;
  focus: boolean;
  opacity?: string;
  children: React.ReactNode;
}): JSX.Element {
  const ref = useCentre(active, [dep]);
  return (
    <li ref={ref}>
      <div
        className={[
          'rounded-r px-4 py-2 transition-all duration-150',
          markerBar(rank, active),
          active ? 'opacity-100' : (opacity ?? (focus ? 'opacity-25' : 'opacity-60')),
        ].join(' ')}
      >
        {children}
      </div>
    </li>
  );
}
