import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { Rig } from '@shared/rig';
import { layoutOf, rigModified, useProm } from '../store';
import { Chip, Group } from './Controls';

/**
 * THE RIG ROW — pick an arrangement before the take, and get on with it.
 *
 * Chips rather than a dropdown, for the same reason as every other control in
 * this toolbar: before a take the talent has to READ which rig is live, and a
 * dropdown hides its own value behind a click. Past about five rigs you are
 * browsing rather than choosing, which is a signal to delete some, not a
 * signal to add a menu.
 *
 * What is deliberately NOT here: renaming and deleting. They live in the tuning
 * drawer, closed during a take, because they are administration — nobody
 * renames a rig with a camera running.
 */
export default function RigBar({ onOpenTune }: { onOpenTune: () => void }): JSX.Element {
  const rigs = useProm(useShallow((s) => s.rigs));
  const rigId = useProm((s) => s.rigId);
  const modified = useProm(rigModified);
  const applyRig = useProm((s) => s.applyRig);
  const adoptRig = useProm((s) => s.adoptRig);

  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const applied = rigs.find((rig) => rig.id === rigId);

  const save = async (label: string, id?: string): Promise<void> => {
    const rigIdentifier = id ?? slugify(label);
    if (!rigIdentifier) {
      setError('That name has no letters or numbers in it.');
      return;
    }
    const result = await window.appytron.invoke<{ rig: Rig }>({
      capability: 'save_rig',
      input: { id: rigIdentifier, label: label.trim(), layout: layoutOf(useProm.getState()) },
    });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    adoptRig(result.data.rig);
    setNaming(false);
    setDraft('');
    setError(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-edge px-5 py-2">
      <Group label="Rig">
        {rigs.length === 0 && !naming && (
          <span className="font-body text-xs text-muted">
            none saved — the layout is remembered anyway
          </span>
        )}
        {rigs.map((rig) => (
          <Chip
            key={rig.id}
            on={rig.id === rigId}
            onClick={() => applyRig(rig.id)}
            title={describe(rig)}
          >
            {rig.label}
            {rig.id === rigId && modified && (
              // A dot, not a dark chip. The rig is still the one in play; the
              // talent has just moved away from it, and a chip that went dark
              // on a nudged divider would say they had left it.
              <span
                className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-sequence align-middle"
                title="modified since it was saved"
              />
            )}
          </Chip>
        ))}
      </Group>

      {naming ? (
        <form
          className="flex items-center gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            void save(draft);
          }}
        >
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setNaming(false);
                setError(null);
              }
              // The stage listens for space and the arrows on window. Typing a
              // rig name must not also walk the script.
              event.stopPropagation();
            }}
            placeholder="name this arrangement"
            className="w-52 rounded border border-edge-strong bg-canvas px-2 py-0.5 font-body text-xs text-ink outline-none"
          />
          <Chip on onClick={() => void save(draft)}>
            Save
          </Chip>
          <Chip
            on={false}
            onClick={() => {
              setNaming(false);
              setError(null);
            }}
          >
            Cancel
          </Chip>
        </form>
      ) : (
        <div className="flex items-center gap-1.5">
          {applied && modified && (
            // The common case, and it costs one click: you tuned your rig, keep
            // it. Typing the name again would be a worse way to say the same
            // thing.
            <Chip on={false} onClick={() => void save(applied.label, applied.id)}>
              Update {applied.label}
            </Chip>
          )}
          <Chip
            on={false}
            onClick={() => {
              setDraft('');
              setNaming(true);
            }}
          >
            + Save as
          </Chip>
        </div>
      )}

      {error && <span className="font-body text-xs text-sequence">{error}</span>}

      <button
        type="button"
        onClick={onOpenTune}
        className="ml-auto font-display text-[0.7rem] uppercase tracking-wide text-muted transition hover:text-ink"
      >
        Tune ⌄
      </button>
    </div>
  );
}

/** A rig id the domain will accept: starts alphanumeric, kebab thereafter. */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** What the chip is, in one hover — so nobody has to apply a rig to find out. */
export function describe(rig: Rig): string {
  const zones = rig.layout.visible.join(' · ');
  return `${zones} — driving ${rig.layout.driven}, lens ${rig.layout.camera}, ${rig.layout.text} text`;
}
