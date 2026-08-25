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
  children,
}: {
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
  mono?: boolean;
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
        on
          ? 'border-edge-strong bg-driven text-ink'
          : 'border-edge bg-card text-muted hover:text-ink',
        disabled ? 'cursor-not-allowed opacity-35 hover:text-muted' : '',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
