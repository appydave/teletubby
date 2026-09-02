import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { CAMERA_SIDES, RECORDING_SET, TEXT_PRESETS } from '@shared/rig';
import { ZONE_LABEL, layoutOf, rigModified, setupEdge, useProm } from '../store';
import { Chip } from './Controls';
import RigAdmin from './RigAdmin';
import type { Rig } from '@shared/rig';

const PRESET_LABEL: Record<string, string> = {
  standard: 'Standard',
  large: 'Large',
  stage: 'Stage',
};

/**
 * THE SETUP PANEL — everything that BUILDS an arrangement, in one place.
 *
 * It replaces six stacked toolbar rows that ate roughly a third of the window
 * before a word of script appeared. What is left above the stage is one 42px
 * strip carrying only what changes DURING a take.
 *
 * Three properties are the design, not decoration:
 *
 *   1. **It is not a modal.** No scrim, no dim, nothing covered. The reason it
 *      exists is to watch the stage respond as the values change, and a veil
 *      over the stage defeats the only thing it is for.
 *   2. **It DISPLACES rather than overlays.** The lanes give up width and keep
 *      rendering. That is the opposite of the transcript drawer's ruling, and
 *      deliberately so: the transcript is glanced at mid-take and must not
 *      shove the driven zone away from the lens, while this is used between
 *      takes and has to leave the stage visible.
 *   3. **It enters from the edge FURTHEST from the lens.** Same rule as
 *      `transcriptEdge`. A panel between the talent and the driven zone is the
 *      failure mode, whichever panel it is.
 *
 * ⚠️ **It must never write the lane weights.** The lanes narrow because a flex
 * sibling took width, and they spring back when it closes — nothing recomputes
 * `weights`. Lane widths are a saved rig property, so a panel that "helpfully"
 * rebalanced them would quietly rewrite the talent's rig every time it opened.
 */
export default function SetupPanel(): JSX.Element | null {
  const open = useProm((s) => s.setupOpen);
  const edge = useProm(setupEdge);
  const closeSetup = useProm((s) => s.closeSetup);

  const set = useProm((s) => s.set);
  const scriptId = useProm((s) => s.scriptId);
  const selectScript = useProm((s) => s.selectScript);
  const sets = useProm((s) => s.sets);
  const requestSet = useProm((s) => s.requestSet);

  const visible = useProm(useShallow((s) => s.visible));
  const driven = useProm((s) => s.driven);
  const camera = useProm((s) => s.camera);
  const text = useProm((s) => s.text);
  const toggleZone = useProm((s) => s.toggleZone);
  const setDriven = useProm((s) => s.setDriven);
  const setCamera = useProm((s) => s.setCamera);
  const setText = useProm((s) => s.setText);

  const transcriptOpen = useProm((s) => s.transcriptOpen);
  const mirror = useProm((s) => s.mirror);
  const focus = useProm((s) => s.focus);
  const toggleTranscript = useProm((s) => s.toggleTranscript);
  const toggleMirror = useProm((s) => s.toggleMirror);
  const toggleFocus = useProm((s) => s.toggleFocus);

  if (!open) return null;

  return (
    <aside
      aria-label="Setup"
      className={[
        'tt-no-drag flex h-full w-[23rem] shrink-0 flex-col overflow-y-auto bg-panel',
        // The border faces the stage, so the seam reads as the panel's edge
        // rather than as a lane divider.
        edge === 'left'
          ? 'order-first border-r border-edge-strong'
          : 'order-last border-l border-edge-strong',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 border-b border-edge px-4 py-2.5">
        <span className="font-display text-xs uppercase tracking-[0.18em] text-ink">Setup</span>
        <span className="font-mono text-[0.65rem] text-muted">S</span>
        <button
          type="button"
          onClick={closeSetup}
          aria-label="Close setup"
          className="ml-auto text-muted transition hover:text-ink"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M2.5 2.5 L9.5 9.5 M9.5 2.5 L2.5 9.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        {/* The 12-chip grid lives here now. The strip's stepper walks to the
            neighbouring script; jumping to 07 is what this is for. */}
        {set && (
          <Field label="Script">
            <div className="flex flex-wrap gap-1.5">
              {set.scripts.map((s) => (
                <Chip
                  key={s.id}
                  on={s.id === scriptId}
                  onClick={() => selectScript(s.id)}
                  title={s.title}
                  mono
                >
                  {String(s.n).padStart(2, '0')}
                </Chip>
              ))}
            </div>
          </Field>
        )}

        {/* PROJECT — which script set is on stage. Chips show the FliHub code
            prefix (display slice only; the stored identity is the full folder
            name, never parsed) plus the set's title. Switching is UI-ONLY:
            the agent surface has no verb for it, because an agent must never
            move the talent. */}
        {sets.length > 1 && (
          <Field label="Project">
            {sets.map((entry) => (
              <Chip
                key={entry.id}
                on={entry.id === set?.id}
                title={entry.project ?? `${entry.title} — no FliHub project attached yet`}
                onClick={() => {
                  if (entry.id !== set?.id) requestSet(entry.id);
                }}
              >
                {entry.project && (
                  <span className="mr-1.5 font-mono normal-case tracking-normal">
                    {entry.project.split('-', 1)[0].toUpperCase()}
                  </span>
                )}
                {entry.title}
              </Chip>
            ))}
          </Field>
        )}

        <Field label="Rig">
          <RigChips />
        </Field>

        <Field label="Zones">
          {RECORDING_SET.map((zone) => (
            <Chip key={zone} on={visible.includes(zone)} onClick={() => toggleZone(zone)}>
              {ZONE_LABEL[zone]}
            </Chip>
          ))}
        </Field>

        <Field label="Driving">
          {RECORDING_SET.map((zone) => (
            <Chip
              key={zone}
              on={driven === zone}
              disabled={!visible.includes(zone)}
              onClick={() => setDriven(zone)}
            >
              {ZONE_LABEL[zone]}
            </Chip>
          ))}
        </Field>

        <Field label="Camera">
          {CAMERA_SIDES.map((side) => (
            <Chip key={side} on={camera === side} onClick={() => setCamera(side)}>
              {side === 'left' ? '◀ Left' : 'Right ▶'}
            </Chip>
          ))}
        </Field>

        <Field label="Text">
          {TEXT_PRESETS.map((preset) => (
            <Chip key={preset} on={text === preset} onClick={() => setText(preset)}>
              {PRESET_LABEL[preset]}
            </Chip>
          ))}
        </Field>

        <Field label="Panels">
          <Chip on={transcriptOpen} onClick={toggleTranscript}>
            Transcript <span className="font-mono text-[0.65rem] opacity-60">T</span>
          </Chip>
          <Chip on={mirror} onClick={toggleMirror}>
            Mirror <span className="font-mono text-[0.65rem] opacity-60">M</span>
          </Chip>
          <Chip on={focus} onClick={toggleFocus}>
            Focus <span className="font-mono text-[0.65rem] opacity-60">D</span>
          </Chip>
        </Field>

        <div className="border-t border-edge pt-3">
          <RigAdmin />
        </div>
      </div>
    </aside>
  );
}

/** Label above, chips below — the panel is tall and narrow, not a wide row. */
function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-display text-[0.65rem] uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

/**
 * The rig chips and the two ways to keep one. Renaming and removing stay in
 * `RigAdmin` at the foot of the panel — administration, below the fold, because
 * nobody renames a rig with a camera running.
 */
function RigChips(): JSX.Element {
  const rigs = useProm(useShallow((s) => s.rigs));
  const rigId = useProm((s) => s.rigId);
  const modified = useProm(rigModified);
  const applyRig = useProm((s) => s.applyRig);
  const adoptRig = useProm((s) => s.adoptRig);
  const applied = rigs.find((rig) => rig.id === rigId);

  const save = async (label: string, id: string): Promise<void> => {
    const result = await window.appytron.invoke<{ rig: Rig }>({
      capability: 'save_rig',
      input: { id, label, layout: layoutOf(useProm.getState()) },
    });
    if (result.ok) adoptRig(result.data.rig);
  };

  return (
    <>
      {rigs.length === 0 && (
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
            <span
              className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-sequence align-middle"
              title="modified since it was saved"
            />
          )}
        </Chip>
      ))}
      {applied && modified && (
        <Chip on={false} onClick={() => void save(applied.label, applied.id)}>
          Update
        </Chip>
      )}
      <SaveAs onSave={save} />
    </>
  );
}

function SaveAs({ onSave }: { onSave: (label: string, id: string) => Promise<void> }): JSX.Element {
  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState('');

  if (!naming)
    return (
      <Chip
        on={false}
        onClick={() => {
          setDraft('');
          setNaming(true);
        }}
      >
        + Save as
      </Chip>
    );

  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        const id = slugify(draft);
        if (!id) return;
        void onSave(draft.trim(), id).then(() => setNaming(false));
      }}
    >
      <input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setNaming(false);
          // The stage listens on window for space, the arrows, and now S.
          // Typing a rig name must not also walk the script or shut this panel.
          event.stopPropagation();
        }}
        placeholder="name this arrangement"
        className="w-40 rounded border border-edge-strong bg-canvas px-2 py-0.5 font-body text-xs text-ink outline-none"
      />
      <Chip on onClick={() => void 0}>
        Save
      </Chip>
    </form>
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
