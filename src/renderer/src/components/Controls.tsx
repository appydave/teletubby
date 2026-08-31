/**
 * The toolbar primitives, shared by every control group.
 *
 * A chip, not a dropdown. Every control in this app is a chip because the
 * talent has to READ the state of the toolbar at a glance before a take — a
 * dropdown hides its own value behind a click, which is the one thing a
 * prompter's chrome may never do.
 */

export function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-display text-[0.65rem] uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

export function Chip({
  on,
  disabled,
  onClick,
  title,
  mono,
  source,
  children,
}: {
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
  mono?: boolean;
  /**
   * A SOURCE, not a thing to perform. The domain has known the difference all
   * along (`kind: 'provenance'` — "meaning is not voiced") and the chip row
   * threw it away: David spent an hour focused on tom-original believing the
   * rewrite hadn't arrived, because both kinds rendered as identical grey
   * chips ("The Tom original has absolutely no meaning to me other than it
   * was the original source… it should be clearly coloured differently so I
   * know that it's a source", 2026-08-31).
   *
   * The vocabulary: unselected source = dashed ghost. SELECTED source = dark
   * ink, never yellow — being on the source is exactly the state that must
   * announce itself, and yellow stays reserved for "a corpus you perform".
   * Ink is the quiet-and-other choice: yellow is driven, gold is follower,
   * amber is sequence, and a second loud colour would compete.
   */
  source?: boolean;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={on}
      className={[
        'rounded border px-2.5 py-0.5 uppercase tracking-wide transition',
        mono ? 'font-mono text-xs normal-case' : 'font-display text-[0.7rem]',
        source
          ? on
            ? 'border-ink bg-ink text-ink-invert'
            : 'border-dashed border-edge-strong bg-transparent text-muted hover:text-ink'
          : on
            ? 'border-edge-strong bg-driven text-ink'
            : 'border-edge bg-card text-muted hover:text-ink',
        disabled ? 'cursor-not-allowed opacity-35 hover:text-muted' : '',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
