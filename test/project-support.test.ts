import { beforeEach, describe, expect, it } from 'vitest';
import { KYBERNESIS_PHASE_1, TALENTS } from '@shared/script-set';
import { createCore, MemoryRepository, type Core } from '@core/index';

/**
 * Project support — create / switch / rename (David, 2026-09-02, plaud 0729).
 *
 * The contract these tests pin (docs/design-project-support.md):
 * `project` is the FliHub folder name VERBATIM — one string, never parsed into
 * code+name. It is IDENTITY and immutable through the app: `rename_set`
 * changes the TITLE (FliHub's FR-157 counterpart), may ATTACH null→value, and
 * refuses value→different in David's own words — a code change is a move, not
 * a rename, and moves are unbuilt in both apps.
 */

const SET = 'kybernesis-phase-1';
const D01 = 'd01-kybernesis-12-videos';

let core: Core;

const call = (capability: string, input: unknown = {}) =>
  core.invoke(capability, input, { principal: 'agent' });

const unwrap = <T = Record<string, unknown>>(result: Awaited<ReturnType<Core['invoke']>>): T => {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.data as T;
};

beforeEach(() => {
  core = createCore({
    repository: new MemoryRepository({
      version: 1,
      sets: [JSON.parse(JSON.stringify(KYBERNESIS_PHASE_1))],
      talents: JSON.parse(JSON.stringify(TALENTS)),
    }),
  });
});

describe('the identity guard BITES — the refusals, before the happy paths', () => {
  it('refuses changing an attached project — value→different is a move', async () => {
    await call('rename_set', { setId: SET, project: D01 });
    const result = await call('rename_set', { setId: SET, project: 'e01-something-else' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('invalid_input');
    // David's distinction, verbatim, where the caller will actually read it.
    expect(result.error.message).toContain('a move, not a rename');
    expect(result.error.message).toContain(D01);

    // And the store is untouched.
    const sets = unwrap<{ sets: { id: string; project: string | null }[] }>(
      await call('list_sets'),
    );
    expect(sets.sets.find((s) => s.id === SET)?.project).toBe(D01);
  });

  it('refuses a non-kebab project name on rename_set AND create_set', async () => {
    for (const bad of ['D01-Kybernesis', 'd01 kybernesis', 'd01--double', '-leading']) {
      const renamed = await call('rename_set', { setId: SET, project: bad });
      expect(renamed.ok, `rename_set accepted "${bad}"`).toBe(false);
      const created = await call('create_set', { id: 'x', title: 'X', project: bad });
      expect(created.ok, `create_set accepted "${bad}"`).toBe(false);
    }
  });

  it('refuses a rename_set with nothing to do', async () => {
    const result = await call('rename_set', { setId: SET });
    expect(result.ok).toBe(false);
  });
});

describe('create', () => {
  it('creates a set attached to a FliHub project, and one without', async () => {
    unwrap(await call('create_set', { id: 'd02-set', title: 'Video Two', project: 'd02-video-two' }));
    unwrap(await call('create_set', { id: 'loose', title: 'Unattached' }));

    const { sets } = unwrap<{ sets: { id: string; project: string | null }[] }>(
      await call('list_sets'),
    );
    expect(sets.find((s) => s.id === 'd02-set')?.project).toBe('d02-video-two');
    expect(sets.find((s) => s.id === 'loose')?.project).toBeNull();
  });
});

describe('rename and attach', () => {
  it('attaches null→value — the backfill path for the real set', async () => {
    const result = unwrap<{ set: { project: string | null }; previous: { project: string | null } }>(
      await call('rename_set', { setId: SET, project: D01 }),
    );
    expect(result.set.project).toBe(D01);
    expect(result.previous.project).toBeNull();

    // Attaching the SAME value again is a no-op, not a refusal.
    unwrap(await call('rename_set', { setId: SET, project: D01 }));
  });

  it('renames the TITLE and leaves identity alone', async () => {
    await call('rename_set', { setId: SET, project: D01 });
    const result = unwrap<{ set: { title: string; project: string | null } }>(
      await call('rename_set', { setId: SET, title: 'Kybernesis Phase 1 (12 shorts)' }),
    );
    expect(result.set.title).toBe('Kybernesis Phase 1 (12 shorts)');
    expect(result.set.project).toBe(D01);
  });

  it('supports a dry run that changes nothing', async () => {
    unwrap(await call('rename_set', { setId: SET, title: 'Preview only', dryRun: true }));
    const { sets } = unwrap<{ sets: { id: string; title: string }[] }>(await call('list_sets'));
    expect(sets.find((s) => s.id === SET)?.title).toBe(KYBERNESIS_PHASE_1.title);
  });
});

describe('the field survives into every read', () => {
  it('list_sets carries project for ALL sets, attached or not', async () => {
    unwrap(await call('create_set', { id: 'p1', title: 'One', project: 'd02-one' }));
    unwrap(await call('create_set', { id: 'p2', title: 'Two' }));
    const { sets } = unwrap<{ sets: { id: string; project: string | null }[] }>(
      await call('list_sets'),
    );
    for (const s of sets) expect(s).toHaveProperty('project');
    expect(sets.find((s) => s.id === SET)?.project).toBeNull(); // legacy set, pre-backfill
  });

  it('get_set returns the project on the full set', async () => {
    await call('rename_set', { setId: SET, project: D01 });
    // get_set answers with the set itself, not an envelope.
    const set = unwrap<{ project?: string | null }>(await call('get_set', { setId: SET, full: true }));
    expect(set.project).toBe(D01);

    // And the summary form (full omitted) carries it too — the field must
    // survive into EVERY read shape, not just the one the renderer uses.
    const summary = unwrap<{ project?: string | null }>(await call('get_set', { setId: SET }));
    expect(summary.project).toBe(D01);
  });
});
