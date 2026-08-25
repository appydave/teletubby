import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { Rig } from '@shared/rig';
import { useProm } from '../store';
import { Chip } from './Controls';

/**
 * RENAMING AND REMOVING A RIG — administration, kept out of the way.
 *
 * It lives inside the tuning drawer rather than on the rig row because nobody
 * renames a rig with a camera running, and every control that is visible during
 * a take is a control the talent's eye has to skip past.
 *
 * Removing goes preview → confirm → execute, the same path an agent takes. The
 * first call returns what would actually go, the human reads THAT rather than
 * their own intent, and only then is anything spent. A confirm dialog written
 * from the click alone would be asking about an intent, not a consequence.
 */
export default function RigAdmin(): JSX.Element {
  const rigs = useProm(useShallow((s) => s.rigs));
  const rigId = useProm((s) => s.rigId);
  const adoptRig = useProm((s) => s.adoptRig);
  const forgetRig = useProm((s) => s.forgetRig);

  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<{ id: string; label: string; inUse: boolean } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const applied = rigs.find((rig) => rig.id === rigId);

  if (!applied)
    return (
      <span className="font-body text-xs text-muted">
        Pick a rig above to rename or remove it. Nothing here changes what is on screen.
      </span>
    );

  const rename = async (): Promise<void> => {
    const label = draft.trim();
    if (!label) {
      setError('A rig needs a name to be pickable.');
      return;
    }
    const result = await window.appytron.invoke<{ rig: Rig }>({
      capability: 'rename_rig',
      input: { id: applied.id, label },
    });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    adoptRig(result.data.rig);
    setRenaming(false);
    setError(null);
  };

  /** Step one: ask what would happen. Nothing is spent by this. */
  const propose = async (): Promise<void> => {
    const result = await window.appytron.invoke<{
      pendingId: string;
      preview: { wouldRemove: string; inUse: boolean };
    }>({ capability: 'delete_rig', input: { id: applied.id } });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setError(null);
    setPending({
      id: result.data.pendingId,
      label: result.data.preview.wouldRemove,
      inUse: result.data.preview.inUse,
    });
  };

  /** Steps two and three: the human approved, so spend it and act. */
  const remove = async (): Promise<void> => {
    if (!pending) return;
    const approved = await window.appytron.invoke({
      capability: 'approve_pending',
      input: { pendingId: pending.id },
    });
    if (!approved.ok) {
      setError(approved.error.message);
      setPending(null);
      return;
    }
    const done = await window.appytron.invoke({
      capability: 'delete_rig',
      input: { id: applied.id, confirmationId: pending.id },
    });
    if (!done.ok) {
      setError(done.error.message);
      setPending(null);
      return;
    }
    forgetRig(applied.id);
    setPending(null);
    setError(null);
  };

  if (pending)
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-body text-xs text-ink">
          Remove <span className="font-semibold">{pending.label}</span>?
          {pending.inUse && ' The arrangement on screen stays exactly as it is.'}
        </span>
        <Chip on onClick={() => void remove()}>
          Remove
        </Chip>
        <Chip on={false} onClick={() => setPending(null)}>
          Cancel
        </Chip>
      </div>
    );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="font-display text-[0.65rem] uppercase tracking-[0.18em] text-muted">
        {applied.label}
      </span>

      {renaming ? (
        <form
          className="flex items-center gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            void rename();
          }}
        >
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setRenaming(false);
              // The stage listens on window for space and the arrows.
              event.stopPropagation();
            }}
            className="w-52 rounded border border-edge-strong bg-canvas px-2 py-0.5 font-body text-xs text-ink outline-none"
          />
          <Chip on onClick={() => void rename()}>
            Rename
          </Chip>
          <Chip on={false} onClick={() => setRenaming(false)}>
            Cancel
          </Chip>
        </form>
      ) : (
        <>
          <Chip
            on={false}
            onClick={() => {
              setDraft(applied.label);
              setRenaming(true);
              setError(null);
            }}
          >
            Rename…
          </Chip>
          <Chip on={false} onClick={() => void propose()}>
            Remove…
          </Chip>
        </>
      )}

      {error && <span className="font-body text-xs text-sequence">{error}</span>}
    </div>
  );
}
