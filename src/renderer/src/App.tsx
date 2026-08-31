import { Fragment, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { ScriptSet, TriggerStyle } from '@shared/domain';
import { TRIGGER_STYLE_LETTER } from '@shared/domain';
import type { Rig, Workspace } from '@shared/rig';
import {
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
  nextScript,
  prevScript,
  rankOf,
  useProm,
  zoneOrder,
  type RecordingZone,
} from './store';
import {
  MajorZone,
  MinorZone,
  ParagraphZone,
  TranscriptDrawer,
  TriggerZone,
} from './components/Zones';
import { Chip } from './components/Controls';
import SetupPanel from './components/SetupPanel';
import CueOverlay from './components/CueOverlay';
import Divider from './components/Divider';
import CadencePanel from './components/CadencePanel';

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
      <div className="tt-drag h-7 shrink-0 border-b border-edge bg-panel" />
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

  const selectTranscript = useProm((s) => s.selectTranscript);
  const selectStyle = useProm((s) => s.selectStyle);
  const toggleTranscript = useProm((s) => s.toggleTranscript);
  const toggleMirror = useProm((s) => s.toggleMirror);
  const toggleFocus = useProm((s) => s.toggleFocus);
  const stepNext = useProm((s) => s.stepNext);
  const stepPrev = useProm((s) => s.stepPrev);
  const toggleSetup = useProm((s) => s.toggleSetup);
  const closeSetup = useProm((s) => s.closeSetup);
  const setupOpen = useProm((s) => s.setupOpen);
  const goToNextScript = useProm((s) => s.goToNextScript);
  const goToPrevScript = useProm((s) => s.goToPrevScript);
  const hasNext = useProm((st) => nextScript(st) !== undefined);
  const hasPrev = useProm((st) => prevScript(st) !== undefined);

  /**
   * On a machine that has never run this there is an arrangement to build, so
   * the panel opens itself once. Every launch after that the workspace has one
   * already, and a panel in the way is the opposite of what rigs bought.
   */
  useEffect(() => {
    if (!useProm.getState().restoredLayout) useProm.setState({ setupOpen: true });
  }, []);

  // The text preset is a root-level data attribute so one CSS variable rescales
  // every zone at once.
  useEffect(() => {
    document.documentElement.dataset.text = text;
  }, [text]);

  /**
   * THE RECLAIMED STATE — and it is `focus` (D), not a new binding.
   *
   * The camera is ABOVE the screen, so the band between the top of the display
   * and the live line is dead weight: it pulls the talent's eyes down and away
   * from the lens. Reclaiming it needs a way in and a way out, and there were
   * only two acceptable shapes — collapse on its own once a take starts, or one
   * keystroke consistent with the bare-letter bindings.
   *
   * Auto-collapse was rejected: the only signal available is "the talent
   * stepped a beat", and lining a beat up before rolling is exactly when they
   * step. Chrome that appears and vanishes on a guess is worse than chrome that
   * is simply tall.
   *
   * ⚠️ A NEW letter was rejected too, and for the reason rigs exist. Nothing is
   * remembered unless it is a rig property, and a rig's contents are settled —
   * so a new key would have to be re-pressed before every single take, which is
   * the exact chore rigs were built to end. `focus` is already bound to D,
   * already stored in the rig, and already meant "everything except the live
   * beat gets out of the way". Collapsing the lane's own chrome and pulling the
   * reading line to the top is that same sentence one altitude up; dimming the
   * neighbouring rows was only ever half of it.
   *
   * What it does NOT touch is the footer. Moving the strip to the foot is what
   * made that possible: reclaiming the top band no longer costs the talent the
   * corpus and style chips, so nothing they flip mid-session is behind D.
   *
   * The state is published as a root data attribute, like `data-text`, so one
   * CSS rule restyles every lane at once rather than every zone learning it.
   */
  const reclaimed = focus;
  useEffect(() => {
    document.documentElement.dataset.reclaim = reclaimed ? 'on' : 'off';
  }, [reclaimed]);

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
        input: {
          layout: layoutOf(state),
          rigId: state.rigId,
          // The talent's place rides along with the layout — same store, same
          // debounce, same rigsLoaded gate. The paragraph is stored by ID
          // (style step counts differ); `load` resolves it on the way back in.
          position: {
            setId: state.set?.id ?? null,
            scriptId: state.scriptId,
            transcriptId: state.transcriptId,
            style: state.style,
            paragraphId: currentParagraphId(state),
          },
        },
      });
    }, REMEMBER_DELAY_MS);
    return () => clearTimeout(timer);
    // `step` stands in for the paragraph: the paragraph only changes when the
    // step does, and subscribing to the derived id would be a new-object
    // selector — the blanking bug. Script and transcript ids are deps in their
    // own right: a script change lands on step 0, and a corpus flip can keep
    // the step — either would otherwise change the position without writing it.
  }, [
    rigsLoaded,
    visible,
    driven,
    weights,
    camera,
    text,
    mirror,
    focus,
    rigId,
    step,
    style,
    script?.id,
    transcript?.id,
  ]);

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
   *
   * ⌘← ⌘→ walk the SCRIPTS — the keyboard twin of the footer's ◀ ▶, asked for
   * by name on the recording day ("I got 12 of them. I should be able to move
   * backwards and forwards", 2026-08-31). Same store actions as the arrows, so
   * one clamp rule: they STOP at 01 and 12, matching the footer's disabled
   * state — the key that does nothing at the end is explained by the greyed
   * arrow on screen. This is the one modifier chord in the app, and it is the
   * exception that proves the bare-letter rule: bare ← → are unbindable here
   * (see above), and ⌘-arrows is what "jump by a bigger unit" already means
   * system-wide.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      // ⌘← / ⌘→ — but never inside an editable field, where they mean
      // line-start / line-end and stealing them breaks text editing.
      if (e.metaKey && !e.ctrlKey && !e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        )
          return;
        e.preventDefault();
        if (e.key === 'ArrowLeft') goToPrevScript();
        else goToNextScript();
        return;
      }
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
        // A bare letter, like every other key here. No modifier: ⌘K was drawn
        // in the mock, but every binding this app has is a single unmodified
        // letter, and a modifier chord would be the odd one out — and would
        // collide with a command palette the day one arrives.
        case 's':
        case 'S':
          toggleSetup();
          break;
        case 'Escape':
          closeSetup();
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
  }, [
    stepNext,
    stepPrev,
    goToPrevScript,
    goToNextScript,
    toggleTranscript,
    toggleFocus,
    toggleMirror,
    toggleSetup,
    closeSetup,
  ]);

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
      {/* ---------------- the drag rail ----------------

          The narrowest top band this window can have, and it is measured, not
          guessed. `titleBarStyle: 'hiddenInset'` makes macOS float the traffic
          lights over the page whether or not the page draws anything up here.

          ⚠️ MEASURE THEM ON A FOCUSED WINDOW. Unfocused, the buttons render as
          faint grey discs that a colour threshold clips at the edges — that is
          how this rail first shipped at 24px with the lights spilling 1.5px
          past the border. Focused, they are chromatic and span logical
          y 13.0-24.5. The floor is 25px; the rail is 28px, which leaves 3.5px
          under them.

          Below the floor needs `setWindowButtonVisibility(false)` from the main
          process, which is a real option and deliberately not taken: losing
          close and minimise to the mouse is a bigger surprise than 0.7cm is a
          win, and there is nothing this band is competing with.

          ⚠️ THIS IS THE ONLY DRAG REGION THE WINDOW HAS. `hiddenInset` means
          the page supplies it or the window cannot be moved at all. Nothing in
          it may be clickable and nothing can collapse it away.

          It carries ONE thing: the script title. Reviewing script 06 from the
          chair, the title in the footer strip (14px, bottom-left) was
          unreadable, and "which script am I on" is a glance at the start of a
          take, not a thing read mid-take. 18px fits inside the 28px with zero
          growth — the lights only occupy x 0–78 and the rest of the band was
          empty. It is muted so it never competes with the driven marker, and
          the rail sits outside `.tt-mirror` so it stays readable on glass.
          Ruled 2026-08-30. Do NOT grow `h-7` for a bigger title.
      */}
      <div className="tt-drag flex h-7 shrink-0 items-center border-b border-edge bg-panel">
        <span className="truncate font-display text-[18px] uppercase leading-none tracking-wide text-muted">
          {script.title}
        </span>
      </div>

      {/* ---------------- stage: mirrorable ---------------- */}
      <main className="relative flex flex-1 overflow-hidden">
        {/* The setup panel is a FLEX SIBLING of the lanes, not a layer over
            them: it takes width and the lanes give it back, so the stage stays
            lit and the talent can watch it respond as they change values.

            ⚠️ It sits OUTSIDE `.tt-mirror` on purpose. Mirror mode flips the
            stage for prompter glass; chrome must stay readable, and a mirrored
            control panel is unusable.

            ⚠️ Nothing here writes `weights`. The lanes narrow because a sibling
            took width and they spring back when it closes — lane widths are a
            saved rig property, and a panel that rebalanced them would rewrite
            the talent's rig every time it opened. */}
        <SetupPanel />
        <div className={['flex h-full min-w-0 flex-1', mirror ? 'tt-mirror' : ''].join(' ')}>
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

      {/* ---------------- the strip, at the FOOT ----------------

          It used to be at the top, and being at the top was the whole problem:
          the camera sits ABOVE the screen, so a strip up there is not merely
          chrome, it is centimetres of distance between the lens and the first
          word. Down here it costs the talent nothing — nobody's eyes travel
          BELOW the script on their way to the camera.

          It carries only what changes DURING a take: where you are, which
          corpus, which style, Cadence, and the way in to Setup. Everything that
          BUILDS an arrangement is still behind S.

          This is also what dissolved the tension in the reclaimed state. When
          the strip lived at the top, reclaiming the band meant hiding it, which
          meant putting corpus and style behind a gesture — the exact thing that
          nearly disqualified the setup panel. At the foot there is nothing to
          hide: reclaim takes the lane chrome and the reading line, and the two
          axes of the A/B/C experiment stay on screen and stay live. */}
      <footer className="tt-no-drag shrink-0 border-t border-edge bg-panel">
        <div className="flex items-center gap-3.5 px-4 py-1.5">
          {/* The stepper walks to the NEIGHBOURING script. Jumping to 07 is what
              the grid in the setup panel is for. Both are clamped by the store,
              so neither can roll off the end of the set. */}
          <div className="flex items-center gap-1">
            <StepButton label="Previous script" disabled={!hasPrev} onClick={goToPrevScript}>
              ◀
            </StepButton>
            <span className="rounded bg-driven px-1.5 font-mono text-xs text-ink">
              {String(script.n).padStart(2, '0')}
            </span>
            <StepButton label="Next script" disabled={!hasNext} onClick={goToNextScript}>
              ▶
            </StepButton>
          </div>
          <span className="truncate font-display text-sm uppercase tracking-wide text-ink">
            {script.title}
          </span>

          <span className="h-4 w-px shrink-0 bg-edge" />

          {/* Corpus and style are the two axes of the A/B/C experiment and the
              talent flips them mid-session, so they are never behind a gesture —
              not the setup panel's, and not the reclaimed state's either. */}
          <div className="flex shrink-0 gap-1.5">
            {script.transcripts.map((t) => (
              <Chip key={t.id} on={t.id === transcript.id} onClick={() => selectTranscript(t.id)}>
                {t.corpus}
              </Chip>
            ))}
          </div>
          <div className="flex shrink-0 gap-1.5">
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
          </div>

          <span className="h-4 w-px shrink-0 bg-edge" />

          <Chip on={cadenceOpen} onClick={() => setCadenceOpen((open) => !open)}>
            Cadence
          </Chip>

          {/* Where you are, in words. The set title and the takeaway that used to
              sit here are gone: neither changes during a take, and the takeaway
              is a note about the script rather than a thing to read while
              talking. */}
          {/* Where you are, in words. The set title and the takeaway that used
              to sit here are gone: neither changes during a take. The corpus is
              gone too — the chips three inches to the left already say it, and
              a status line that repeats a control is a line nobody reads. */}
          <span className="ml-auto shrink-0 whitespace-nowrap font-mono text-[0.7rem] text-muted">
            beat {triggers.length === 0 ? 0 : step + 1}/{triggers.length} · driving{' '}
            {ZONE_LABEL[driven]} · lens {camera}
            {reclaimed ? ' · reclaimed' : ''}
          </span>

          {/* The key legend is the first thing to go when the window narrows —
              it is a reminder, and the chips beside it are controls. */}
          <span className="hidden truncate font-mono text-[0.7rem] text-muted xl:inline">
            ↑ ↓ space step · ⌘← ⌘→ script · D reclaim · T · M · F
          </span>

          <span className="shrink-0">
            <Chip on={setupOpen} onClick={toggleSetup}>
              Setup <span className="font-mono text-[0.65rem] opacity-60">S</span>
            </Chip>
          </span>
        </div>
      </footer>
    </div>
  );
}

/**
 * A stepper arrow. Disabled at the ends of the set rather than wrapping —
 * rolling from script 12 back to 01 is the silent-advance bug the prior-art
 * rule exists to prevent, one level up.
 */
function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={[
        'rounded px-1 text-[0.6rem] text-muted transition',
        disabled ? 'cursor-not-allowed opacity-25' : 'hover:text-ink',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
