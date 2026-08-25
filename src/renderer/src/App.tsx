import { Fragment, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { ScriptSet, TriggerStyle } from '@shared/domain';
import { TRIGGER_STYLE_LETTER } from '@shared/domain';
import type { Rig, Workspace } from '@shared/rig';
import {
  CAMERA_SIDES,
  RECORDING_SET,
  TEXT_PRESETS,
  ZONE_LABEL,
  activeTriggers,
  currentMajor,
  currentMinor,
  currentParagraph,
  currentParagraphId,
  nextParagraph,
  currentScript,
  currentTranscript,
  layoutOf,
  rankOf,
  useProm,
  zoneOrder,
  type RecordingZone,
  type TextPreset,
} from './store';
import {
  MajorZone,
  MinorZone,
  ParagraphZone,
  TranscriptDrawer,
  TriggerZone,
} from './components/Zones';
import CueOverlay from './components/CueOverlay';
import Divider from './components/Divider';
import CadencePanel from './components/CadencePanel';

const PRESET_LABEL: Record<TextPreset, string> = {
  standard: 'Standard',
  large: 'Large',
  stage: 'Stage',
};

/**
 * How long the arrangement has to hold still before it is written down.
 *
 * Dragging a divider changes the layout on every animation frame; the store is
 * one atomic JSON document, and there is no reason to rewrite it sixty times a
 * second to record a gesture that has not finished.
 */
const REMEMBER_DELAY_MS = 400;

export default function App(): JSX.Element {
  const set = useProm((s) => s.set);
  const load = useProm((s) => s.load);
  const refresh = useProm((s) => s.refresh);
  const loadRigs = useProm((s) => s.loadRigs);
  const setRigs = useProm((s) => s.setRigs);
  const [failure, setFailure] = useState<string | null>(null);

  /**
   * The renderer is a CLIENT of the capability core, exactly like an agent —
   * it just arrives with the `ui` principal over the IPC bridge instead of over
   * HTTP. It does not import the script data.
   *
   * That is the whole point of session 1: if the UI read a bundled constant,
   * an agent's edit would be invisible here, and "the app is drivable" would be
   * a claim with nothing behind it.
   */
  useEffect(() => {
    let cancelled = false;

    const fetchSet = async (apply: (set: ScriptSet) => void): Promise<void> => {
      const result = await window.appytron.invoke<{ sets: { id: string }[] }>({
        capability: 'list_sets',
      });
      if (cancelled) return;
      if (!result.ok) {
        setFailure(result.error.message);
        return;
      }
      const first = result.data.sets[0];
      if (!first) {
        setFailure('No script sets in the store.');
        return;
      }
      const full = await window.appytron.invoke<ScriptSet>({
        capability: 'get_set',
        input: { setId: first.id, full: true },
      });
      if (cancelled) return;
      if (!full.ok) {
        setFailure(full.error.message);
        return;
      }
      setFailure(null);
      apply(full.data);
    };

    const fetchRigs = async (
      apply: (data: { rigs: Rig[]; workspace: Workspace }) => void,
    ): Promise<void> => {
      const result = await window.appytron.invoke<{ rigs: Rig[]; workspace: Workspace }>({
        capability: 'list_rigs',
      });
      if (cancelled || !result.ok) return;
      apply(result.data);
    };

    // Rigs FIRST, and awaited. The stage does not mount until the set arrives,
    // so getting the arrangement in before that is what stops the talent
    // watching their layout snap from the built-in default into their own.
    void (async () => {
      await fetchRigs(({ rigs, workspace }) => loadRigs(rigs, workspace));
      await fetchSet(load);
    })();

    // An agent writing through the control API lands here. `refresh` swaps the
    // data without moving the talent — the alternative is that someone editing
    // a trigger word yanks the person on camera back to the top of script 01.
    //
    // Rigs take the same treatment: a rig an agent authored appears as a new
    // chip, and the arrangement on screen is left exactly where it is.
    const unsubscribe = window.appytron.onControlChanged(() => {
      void fetchRigs(({ rigs }) => setRigs(rigs));
      void fetchSet(refresh);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [load, refresh, loadRigs, setRigs]);

  if (failure) return <Waiting message={failure} failed />;
  if (!set) return <Waiting message="Loading the set…" />;
  return <Stage />;
}

function Waiting({ message, failed }: { message: string; failed?: boolean }): JSX.Element {
  return (
    <div className="flex h-screen flex-col bg-canvas text-ink">
      <div className="tt-drag h-10 shrink-0 border-b border-edge bg-panel" />
      <div className="flex flex-1 items-center justify-center px-10 text-center">
        <p className={['font-body text-script', failed ? 'text-ink' : 'text-muted'].join(' ')}>
          {message}
        </p>
      </div>
    </div>
  );
}

function Stage(): JSX.Element {
  const [cadenceOpen, setCadenceOpen] = useState(false);
  const script = useProm(currentScript);
  const transcript = useProm(currentTranscript);
  const paragraph = useProm(currentParagraph);
  const upcoming = useProm(nextParagraph);
  const minor = useProm(currentMinor);
  const major = useProm(currentMajor);
  const triggers = useProm(activeTriggers);
  const paragraphId = useProm(currentParagraphId);
  // zoneOrder builds a new array every call; compare by value or the
  // component re-renders forever. See the note on activeTriggers.
  const order = useProm(useShallow(zoneOrder));

  const set = useProm((s) => s.set);
  const step = useProm((s) => s.step);
  const style = useProm((s) => s.style);
  const visible = useProm((s) => s.visible);
  const driven = useProm((s) => s.driven);
  const camera = useProm((s) => s.camera);
  const weights = useProm(useShallow((st) => st.weights));
  const resizeZones = useProm((st) => st.resizeZones);
  const transcriptOpen = useProm((s) => s.transcriptOpen);
  const transcriptEdge = useProm((s) => s.transcriptEdge);
  const mirror = useProm((s) => s.mirror);
  const focus = useProm((s) => s.focus);
  const text = useProm((s) => s.text);
  const rigId = useProm((s) => s.rigId);
  const rigsLoaded = useProm((s) => s.rigsLoaded);

  const selectScript = useProm((s) => s.selectScript);
  const selectTranscript = useProm((s) => s.selectTranscript);
  const selectStyle = useProm((s) => s.selectStyle);
  const toggleZone = useProm((s) => s.toggleZone);
  const setDriven = useProm((s) => s.setDriven);
  const setCamera = useProm((s) => s.setCamera);
  const toggleTranscript = useProm((s) => s.toggleTranscript);
  const toggleMirror = useProm((s) => s.toggleMirror);
  const toggleFocus = useProm((s) => s.toggleFocus);
  const setText = useProm((s) => s.setText);
  const stepNext = useProm((s) => s.stepNext);
  const stepPrev = useProm((s) => s.stepPrev);

  // The text preset is a root-level data attribute so one CSS variable rescales
  // every zone at once.
  useEffect(() => {
    document.documentElement.dataset.text = text;
  }, [text]);

  /**
   * REMEMBER HOW THIS ENDED — the whole reason rigs exist.
   *
   * Every launch used to reset the arrangement, so four controls got re-set
   * before every take. Now the layout is written down whenever it settles, and
   * the next launch opens on it.
   *
   * ⚠️ Gated on `rigsLoaded`. The app writes the live layout back on every
   * change, so if a failed `list_rigs` let it start writing anyway, one
   * transient error would overwrite the talent's saved arrangement with the
   * built-in default. Nothing is remembered until something has been recalled.
   *
   * `layoutOf` is read from `getState()` and never as a selector — it builds a
   * fresh object every call, which as a selector is the infinite re-render that
   * blanks the window.
   */
  useEffect(() => {
    if (!rigsLoaded) return undefined;
    const timer = setTimeout(() => {
      const state = useProm.getState();
      void window.appytron.invoke({
        capability: 'remember_layout',
        input: { layout: layoutOf(state), rigId: state.rigId },
      });
    }, REMEMBER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [rigsLoaded, visible, driven, weights, camera, text, mirror, focus, rigId]);

  /**
   * One key means one scale of movement:
   *   ↑ ↓ Space  step the beat — clamped inside the script, always
   *   T          the full-transcript skim surface
   *   click      which script, which corpus, which style
   *
   * ← → are deliberately NOT bound any more. They used to walk a fixed lane
   * track; with the zone model there is no single axis for them to mean, and a
   * key that means something different depending on the arrangement is exactly
   * the confusion the prior-art rule exists to prevent.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          stepNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          stepPrev();
          break;
        case 't':
        case 'T':
          toggleTranscript();
          break;
        case 'd':
        case 'D':
          toggleFocus();
          break;
        case 'm':
        case 'M':
          toggleMirror();
          break;
        case 'f':
        case 'F':
          if (document.fullscreenElement) void document.exitFullscreen();
          else void document.documentElement.requestFullscreen();
          break;
        default:
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stepNext, stepPrev, toggleTranscript, toggleFocus, toggleMirror]);

  if (!script || !transcript || !set) return <Waiting message="No script selected." />;

  const zoneNode = (zone: RecordingZone): JSX.Element => {
    const rank = rankOf(driven, zone);
    switch (zone) {
      case 'major':
        return (
          <MajorZone key={zone} transcript={transcript} current={major} rank={rank} focus={focus} />
        );
      case 'minor':
        return (
          <MinorZone key={zone} transcript={transcript} current={minor} rank={rank} focus={focus} />
        );
      case 'triggers':
        return <TriggerZone key={zone} triggers={triggers} step={step} rank={rank} focus={focus} />;
      case 'paragraph':
        return <ParagraphZone key={zone} paragraph={paragraph} next={upcoming} rank={rank} />;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-canvas text-ink">
      {/* ---------------- chrome: never mirrored, always readable ---------------- */}
      <header className="shrink-0 border-b border-edge bg-panel">
        {/* The title strip IS the drag handle — see .tt-drag in index.css.
            It deliberately holds no controls, so nothing here needs to opt out. */}
        <div className="tt-drag flex select-none items-baseline gap-3 py-3 pr-5">
          <span className="font-display text-lg font-bold uppercase tracking-[0.2em] text-ink">
            Teletubby
          </span>
          <span className="font-body text-xs text-muted">
            {set.title} · glance, don&apos;t read
          </span>
        </div>

        {/* Script selection — click only. */}
        <div className="flex flex-wrap gap-1.5 px-5 py-3">
          {set.scripts.map((s) => (
            <Chip
              key={s.id}
              on={s.id === script.id}
              onClick={() => selectScript(s.id)}
              title={s.title}
              mono
            >
              {String(s.n).padStart(2, '0')}
            </Chip>
          ))}
          <span className="ml-3 self-center font-display text-sm uppercase tracking-wide text-ink">
            {String(script.n).padStart(2, '0')} · {script.title}
          </span>
        </div>

        {/* Corpus + trigger style — the two axes of the experiment. */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-edge px-5 py-2">
          <Group label="Corpus">
            {script.transcripts.map((t) => (
              <Chip key={t.id} on={t.id === transcript.id} onClick={() => selectTranscript(t.id)}>
                {t.kind === 'provenance' ? 'Provenance' : 'Cadence'}
                <span className="ml-1.5 font-mono text-[0.6rem] opacity-70">{t.corpus}</span>
              </Chip>
            ))}
          </Group>

          <Group label="Style">
            {(['near-verbatim', 'compressed-concept', 'loose-keywords'] as TriggerStyle[]).map(
              (candidate) => {
                const has = transcript.triggerSets.some((t) => t.style === candidate);
                return (
                  <Chip
                    key={candidate}
                    on={style === candidate}
                    disabled={!has}
                    onClick={() => selectStyle(candidate)}
                    title={has ? candidate : `${candidate} — not authored yet`}
                  >
                    {TRIGGER_STYLE_LETTER[candidate]}
                  </Chip>
                );
              },
            )}
          </Group>
        </div>

        {/* Zones, driven zone, and the camera edge everything bends to. */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-edge px-5 py-2">
          <Group label="Zones">
            {RECORDING_SET.map((zone) => (
              <Chip key={zone} on={visible.includes(zone)} onClick={() => toggleZone(zone)}>
                {ZONE_LABEL[zone]}
              </Chip>
            ))}
          </Group>

          <Group label="Driving">
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
          </Group>

          <Group label="Camera">
            {CAMERA_SIDES.map((side) => (
              <Chip key={side} on={camera === side} onClick={() => setCamera(side)}>
                {side === 'left' ? '◀ Left' : 'Right ▶'}
              </Chip>
            ))}
          </Group>
        </div>

        {/* Presentation. */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-edge px-5 py-2">
          <Group label="Text">
            {TEXT_PRESETS.map((preset) => (
              <Chip key={preset} on={text === preset} onClick={() => setText(preset)}>
                {PRESET_LABEL[preset]}
              </Chip>
            ))}
          </Group>

          <Chip on={cadenceOpen} onClick={() => setCadenceOpen((open) => !open)}>
            Cadence
          </Chip>
          <Chip on={transcriptOpen} onClick={toggleTranscript}>
            Transcript <span className="font-mono text-[0.65rem] opacity-60">T</span>
          </Chip>
          <Chip on={mirror} onClick={toggleMirror}>
            Mirror <span className="font-mono text-[0.65rem] opacity-60">M</span>
          </Chip>
          <Chip on={focus} onClick={toggleFocus}>
            Focus <span className="font-mono text-[0.65rem] opacity-60">D</span>
          </Chip>

          <span className="ml-auto font-mono text-[0.7rem] text-muted">
            ↑ ↓ space step · T transcript · F fullscreen
          </span>
        </div>
      </header>

      {/* ---------------- stage: mirrorable ---------------- */}
      <main className="relative flex-1 overflow-hidden">
        <div className={['flex h-full', mirror ? 'tt-mirror' : ''].join(' ')}>
          {order.map((zone, i) => (
            <Fragment key={zone}>
              {i > 0 && <Divider onResize={(dx) => resizeZones(order[i - 1], zone, dx)} />}
              <div className="h-full min-w-0" style={{ flex: weights[zone] }}>
                {zoneNode(zone)}
              </div>
            </Fragment>
          ))}
        </div>
        <TranscriptDrawer
          transcript={transcript}
          currentParagraphId={paragraphId}
          edge={transcriptEdge}
          open={transcriptOpen}
          onClose={toggleTranscript}
        />
        {cadenceOpen && transcript.talentId && (
          <CadencePanel
            scriptId={script.id}
            transcriptId={transcript.id}
            corpus={transcript.corpus}
            talentId={transcript.talentId}
            onClose={() => setCadenceOpen(false)}
          />
        )}
        {cadenceOpen && !transcript.talentId && (
          <div
            className="absolute inset-0 z-30 flex items-start justify-center bg-veil pt-16"
            onClick={() => setCadenceOpen(false)}
            role="presentation"
          >
            <div className="w-[38rem] rounded-lg border border-edge-strong bg-panel px-7 py-6">
              {/* A provenance transcript belongs to no talent — meaning is not
                  voiced — so there is no envelope to judge it against. Say that
                  rather than silently scoring it against somebody's numbers. */}
              <p className="font-body text-sm text-ink">
                This is the <span className="font-semibold">provenance</span> transcript. It belongs
                to no talent, so there is no cadence envelope to measure it against — switch to a
                cadence transcript to see the numbers.
              </p>
            </div>
          </div>
        )}
        <CueOverlay />
      </main>

      <footer className="shrink-0 border-t border-edge bg-panel px-5 py-1.5">
        <span className="font-mono text-[0.7rem] text-muted">
          beat {triggers.length === 0 ? 0 : step + 1}/{triggers.length} · {transcript.corpus} ·
          driving {ZONE_LABEL[driven]} · lens {camera} · {script.takeaway}
        </span>
      </footer>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-display text-[0.65rem] uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

function Chip({
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
