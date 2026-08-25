import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DEFAULT_LAYOUT, type RigLayout } from '@shared/rig';
import { FileRepository, MemoryRepository, createCore, type Core } from '@core/index';

/**
 * THE RIG VERBS.
 *
 * The whole feature exists to stop the talent re-configuring the app before
 * every take, so the acceptance test that matters is the boring one: a layout
 * survives a restart. Everything else here guards the ways that could go wrong
 * loudly — an agent choosing the arrangement, a rig that drives a hidden zone,
 * a delete that repaints a screen someone is talking to.
 */

let core: Core;

const asUi = (capability: string, input: unknown = {}) =>
  core.invoke(capability, input, { principal: 'ui' });
const asAgent = (capability: string, input: unknown = {}) =>
  core.invoke(capability, input, { principal: 'agent' });

const unwrap = <T = Record<string, unknown>>(result: Awaited<ReturnType<Core['invoke']>>): T => {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.data as T;
};

const layout = (patch: Partial<RigLayout> = {}): RigLayout => ({
  ...DEFAULT_LAYOUT,
  visible: [...DEFAULT_LAYOUT.visible],
  weights: { ...DEFAULT_LAYOUT.weights },
  ...patch,
});

/** David's actual rig, from the screenshot that started this. */
const STAGE_LEFT = layout({
  visible: ['triggers', 'paragraph'],
  driven: 'paragraph',
  camera: 'left',
  text: 'stage',
});

beforeEach(() => {
  core = createCore({ repository: new MemoryRepository() });
});

describe('a store with no rigs in it', () => {
  it('answers with an empty list and an empty workspace, never an error', async () => {
    // First launch has to be a normal answer. A query that fails when there is
    // nothing yet forces every caller to special-case day one.
    const data = unwrap<{ rigs: unknown[]; workspace: { layout: null; rigId: null } }>(
      await asUi('list_rigs'),
    );
    expect(data.rigs).toEqual([]);
    expect(data.workspace).toEqual({ layout: null, rigId: null });
  });
});

describe('saving a rig', () => {
  it('creates it, and a second save returns what it replaced', async () => {
    const first = unwrap<{ applied: boolean; previous: unknown }>(
      await asAgent('save_rig', { id: 'stage-left', label: 'Stage left', layout: STAGE_LEFT }),
    );
    expect(first.applied).toBe(true);
    expect(first.previous).toBeNull();

    const second = unwrap<{ previous: { label: string } }>(
      await asAgent('save_rig', {
        id: 'stage-left',
        label: 'Stage left',
        layout: layout({ text: 'large' }),
      }),
    );
    // The previous value is what makes a write auditable and undoable without
    // a second round trip.
    expect(second.previous.label).toBe('Stage left');

    const data = unwrap<{ rigs: { id: string; layout: RigLayout }[] }>(await asUi('list_rigs'));
    expect(data.rigs).toHaveLength(1);
    expect(data.rigs[0].layout.text).toBe('large');
  });

  it('refuses a rig that drives a zone it does not show', async () => {
    // The store refuses this interactively. A rig is a way to reach the same
    // state without clicking, so the verb has to refuse it too.
    const result = await asAgent('save_rig', {
      id: 'broken',
      label: 'Broken',
      layout: layout({ visible: ['paragraph'], driven: 'triggers' }),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('domain_invalid');
  });

  it('stores the zones in canonical order whatever order they arrived in', async () => {
    unwrap(
      await asAgent('save_rig', {
        id: 'wide',
        label: 'Wide',
        layout: layout({ visible: ['paragraph', 'major', 'triggers'], driven: 'major' }),
      }),
    );
    const data = unwrap<{ rigs: { layout: RigLayout }[] }>(await asUi('list_rigs'));
    expect(data.rigs[0].layout.visible).toEqual(['major', 'triggers', 'paragraph']);
  });

  it('previews without storing anything on a dry run', async () => {
    const preview = unwrap<{ applied: boolean }>(
      await asAgent('save_rig', {
        id: 'stage-left',
        label: 'Stage left',
        layout: STAGE_LEFT,
        dryRun: true,
      }),
    );
    expect(preview.applied).toBe(false);
    expect(unwrap<{ rigs: unknown[] }>(await asUi('list_rigs')).rigs).toEqual([]);
  });

  it('is reachable by an agent — authoring an arrangement is not choosing one', async () => {
    const result = await asAgent('save_rig', {
      id: 'agent-made',
      label: 'Agent made',
      layout: STAGE_LEFT,
    });
    expect(result.ok).toBe(true);
  });
});

describe('renaming a rig', () => {
  beforeEach(async () => {
    unwrap(await asUi('save_rig', { id: 'stage-left', label: 'Stage left', layout: STAGE_LEFT }));
  });

  it('changes the name and nothing else', async () => {
    // David: "whatever I come up with first off won't necessarily be what I
    // want later on." The id is the stable handle so a rename cannot orphan the
    // workspace pointer.
    const result = unwrap<{ previous: string; rig: { id: string; layout: RigLayout } }>(
      await asAgent('rename_rig', { id: 'stage-left', label: 'Glass · left' }),
    );
    expect(result.previous).toBe('Stage left');
    expect(result.rig.id).toBe('stage-left');
    expect(result.rig.layout.text).toBe('stage');
  });

  it('says which rigs exist when the id is wrong', async () => {
    // Never make the caller guess an id.
    const result = await asAgent('rename_rig', { id: 'nope', label: 'x' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('not_found');
      expect(result.error.details).toMatchObject({ available: ['stage-left'] });
    }
  });
});

describe('remembering the layout', () => {
  it('is refused to an agent and allowed to the UI', async () => {
    // The split that is the whole design: an agent may AUTHOR an arrangement,
    // and may never decide which one opens in front of the talent.
    const denied = await asAgent('remember_layout', { layout: STAGE_LEFT });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error.code).toBe('permission_denied');

    const allowed = await asUi('remember_layout', { layout: STAGE_LEFT });
    expect(allowed.ok).toBe(true);
  });

  it('comes back on the next read', async () => {
    unwrap(await asUi('remember_layout', { layout: STAGE_LEFT }));
    const data = unwrap<{ workspace: { layout: RigLayout } }>(await asUi('list_rigs'));
    expect(data.workspace.layout).toMatchObject({
      driven: 'paragraph',
      camera: 'left',
      text: 'stage',
    });
  });

  it('refuses a layout the app would not let a human build', async () => {
    const result = await asUi('remember_layout', {
      layout: layout({ visible: ['paragraph'], driven: 'major' }),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('domain_invalid');
  });

  it('drops a pointer to a rig that does not exist', async () => {
    // The layout is still the talent's; the attribution to a rig is not.
    unwrap(await asUi('remember_layout', { layout: STAGE_LEFT, rigId: 'deleted-yesterday' }));
    const data = unwrap<{ workspace: { rigId: string | null } }>(await asUi('list_rigs'));
    expect(data.workspace.rigId).toBeNull();
  });

  it('keeps a pointer to a rig that does exist', async () => {
    unwrap(await asUi('save_rig', { id: 'stage-left', label: 'Stage left', layout: STAGE_LEFT }));
    unwrap(await asUi('remember_layout', { layout: STAGE_LEFT, rigId: 'stage-left' }));
    const data = unwrap<{ workspace: { rigId: string | null } }>(await asUi('list_rigs'));
    expect(data.workspace.rigId).toBe('stage-left');
  });
});

describe('deleting a rig', () => {
  beforeEach(async () => {
    unwrap(await asUi('save_rig', { id: 'stage-left', label: 'Stage left', layout: STAGE_LEFT }));
    unwrap(await asUi('remember_layout', { layout: STAGE_LEFT, rigId: 'stage-left' }));
  });

  it('previews rather than removing, and names what would go', async () => {
    const preview = unwrap<{
      applied: boolean;
      pendingId: string;
      preview: { wouldRemove: string; inUse: boolean };
    }>(await asAgent('delete_rig', { id: 'stage-left' }));

    expect(preview.applied).toBe(false);
    expect(preview.preview.wouldRemove).toBe('Stage left');
    // Consequences, not intent — the human approving it sees that this is the
    // rig currently in play.
    expect(preview.preview.inUse).toBe(true);
    expect(unwrap<{ rigs: unknown[] }>(await asUi('list_rigs')).rigs).toHaveLength(1);
  });

  it('removes it once a human has approved', async () => {
    const preview = unwrap<{ pendingId: string }>(
      await asAgent('delete_rig', { id: 'stage-left' }),
    );
    unwrap(await asUi('approve_pending', { pendingId: preview.pendingId }));
    const done = unwrap<{ applied: boolean; removed: { label: string } }>(
      await asAgent('delete_rig', { id: 'stage-left', confirmationId: preview.pendingId }),
    );
    expect(done.applied).toBe(true);
    expect(done.removed.label).toBe('Stage left');
    expect(unwrap<{ rigs: unknown[] }>(await asUi('list_rigs')).rigs).toEqual([]);
  });

  it('does not disturb the arrangement someone is talking to', async () => {
    // Deleting a NAME must never repaint a stage mid-take. The layout stays;
    // only the attribution to a rig that no longer exists is dropped.
    const preview = unwrap<{ pendingId: string }>(
      await asAgent('delete_rig', { id: 'stage-left' }),
    );
    unwrap(await asUi('approve_pending', { pendingId: preview.pendingId }));
    unwrap(await asAgent('delete_rig', { id: 'stage-left', confirmationId: preview.pendingId }));

    const data = unwrap<{ workspace: { layout: RigLayout; rigId: string | null } }>(
      await asUi('list_rigs'),
    );
    expect(data.workspace.layout).toMatchObject({ camera: 'left', text: 'stage' });
    expect(data.workspace.rigId).toBeNull();
  });

  it('says which rigs exist when the id is wrong', async () => {
    const result = await asAgent('delete_rig', { id: 'nope' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('not_found');
  });
});

describe('the change event', () => {
  it('fires when a rig is saved, and not when one is merely listed', async () => {
    // The renderer re-fetches on this. Waking it for a query would train it to
    // ignore the event.
    const seen: string[] = [];
    core.onChange((event) => seen.push(event.capability));

    await asUi('list_rigs');
    expect(seen).toEqual([]);

    await asAgent('save_rig', { id: 'stage-left', label: 'Stage left', layout: STAGE_LEFT });
    expect(seen).toEqual(['save_rig']);
  });

  it('does not fire on a dry run', async () => {
    const seen: string[] = [];
    core.onChange((event) => seen.push(event.capability));
    await asAgent('save_rig', {
      id: 'x',
      label: 'X',
      layout: STAGE_LEFT,
      dryRun: true,
    });
    expect(seen).toEqual([]);
  });
});

/* ------------------------------------------------------------------ *
 * The acceptance test the whole feature exists for
 * ------------------------------------------------------------------ */

describe('across a restart', () => {
  let directory: string;
  let path: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'teletubby-rigs-'));
    path = join(directory, 'teletubby.json');
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('opens the way the talent left it', async () => {
    const before = createCore({ repository: new FileRepository(path) });
    await before.invoke(
      'save_rig',
      { id: 'stage-left', label: 'Stage left', layout: STAGE_LEFT },
      {
        principal: 'ui',
      },
    );
    await before.invoke(
      'remember_layout',
      { layout: STAGE_LEFT, rigId: 'stage-left' },
      { principal: 'ui' },
    );

    // A brand new core over the same file — which is what a relaunch is.
    const after = createCore({ repository: new FileRepository(path) });
    const data = unwrap<{
      rigs: { id: string }[];
      workspace: { layout: RigLayout; rigId: string };
    }>(await after.invoke('list_rigs', {}, { principal: 'ui' }));

    expect(data.rigs.map((rig) => rig.id)).toEqual(['stage-left']);
    expect(data.workspace.rigId).toBe('stage-left');
    expect(data.workspace.layout).toMatchObject({
      driven: 'paragraph',
      camera: 'left',
      text: 'stage',
    });
  });

  it('reads a store written before rigs existed', async () => {
    // There are real v1 files on real machines — the store is the talent's
    // working copy and it predates this feature. Filling the gaps on READ means
    // there is no upgrade step that can half-run.
    writeFileSync(path, JSON.stringify({ version: 1, sets: [], talents: [] }), { mode: 0o600 });
    const core2 = createCore({ repository: new FileRepository(path) });

    const data = unwrap<{ rigs: unknown[]; workspace: unknown }>(
      await core2.invoke('list_rigs', {}, { principal: 'ui' }),
    );
    expect(data.rigs).toEqual([]);
    expect(data.workspace).toEqual({ layout: null, rigId: null });

    // And it is writable straight away, not merely readable.
    const saved = await core2.invoke(
      'save_rig',
      { id: 'stage-left', label: 'Stage left', layout: STAGE_LEFT },
      { principal: 'ui' },
    );
    expect(saved.ok).toBe(true);
  });
});
