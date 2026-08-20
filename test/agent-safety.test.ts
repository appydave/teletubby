import { beforeEach, describe, expect, it } from 'vitest';
import { KYBERNESIS_PHASE_1, TALENTS } from '@shared/script-set';
import { createCore, MemoryRepository, type Core } from '@core/index';
import { ACTIVE_CONTEXT_TTL_MS } from '@core/active-context';
import { CONFIRMATION_TTL_MS } from '@core/safety';

/**
 * Track C, exercised. Every test here corresponds to a rule in
 * `~/dev/ad/brains/agent-first-architecture/agent-safety.md`, and several
 * correspond to a hole another AppyDave app actually shipped.
 *
 * The whole suite runs against a MemoryRepository in a node environment — no
 * Electron, no HTTP, no window. That is the point of putting the gate beneath
 * the adapters rather than inside one.
 */

const SCRIPT = 'kybernesis-phase-1/01';
const SET = 'kybernesis-phase-1';

let now = 1_700_000_000_000;
let core: Core;

const build = (): Core =>
  createCore({
    repository: new MemoryRepository({
      version: 1,
      sets: [JSON.parse(JSON.stringify(KYBERNESIS_PHASE_1))],
      talents: JSON.parse(JSON.stringify(TALENTS)),
    }),
    clock: () => now,
  });

const asAgent = (capability: string, input: unknown = {}) =>
  core.invoke(capability, input, { principal: 'agent' });
const asUi = (capability: string, input: unknown = {}) =>
  core.invoke(capability, input, { principal: 'ui' });

const unwrap = <T = Record<string, unknown>>(result: Awaited<ReturnType<Core['invoke']>>): T => {
  if (!result.ok) throw new Error(`expected ok, got ${result.error.code}: ${result.error.message}`);
  return result.data as T;
};

beforeEach(() => {
  now = 1_700_000_000_000;
  core = build();
});

describe('the agent is not the user', () => {
  it('refuses the approval channel to an agent, and allows it to the UI', async () => {
    // The rule that exists because ImageDrip published the verb that ANSWERS
    // its own confirmation gate on the agent surface, and listed it by name in
    // the constrained agent's allow-list.
    const denied = await asAgent('approve_pending', {
      pendingId: 'pend_whatever',
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error.code).toBe('permission_denied');

    const allowed = await asUi('approve_pending', {
      pendingId: 'pend_whatever',
    });
    expect(allowed.ok).toBe(false);
    // Reaches the handler and fails on the id, not on the principal — which is
    // how we know the refusal above was about WHO, not about WHAT.
    if (!allowed.ok) expect(allowed.error.code).toBe('confirmation_invalid');
  });

  it('refuses to let an agent forge the talent’s selection', async () => {
    const denied = await asAgent('set_active_context', { scriptId: SCRIPT });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error.code).toBe('permission_denied');
  });

  it('advertises only what the calling principal can reach', async () => {
    const forAgent = unwrap<{ capabilities: { name: string }[] }>(
      await asAgent('describe_capabilities'),
    );
    const names = forAgent.capabilities.map((c) => c.name);
    expect(names).not.toContain('approve_pending');
    expect(names).toContain('write_trigger_set');
  });
});

describe('preview → confirm → execute', () => {
  it('previews instead of destroying when the agent has no approval', async () => {
    const result = unwrap<{
      applied: boolean;
      pendingId: string;
      preview: { wouldRemove: string };
    }>(await asAgent('delete_script', { setId: SET, scriptId: SCRIPT }));
    // An agent that forgets to preview does not accidentally destroy something.
    // It accidentally previews.
    expect(result.applied).toBe(false);
    expect(result.preview.wouldRemove).toBe('What Kybernesis actually builds');
    expect(result.pendingId).toMatch(/^pend_/);

    const set = unwrap<{ scripts: unknown[] }>(await asAgent('get_set', { setId: SET }));
    expect(set.scripts).toHaveLength(12);
  });

  it('shows consequences, not intent', async () => {
    const result = unwrap<{
      preview: { transcripts: { paragraphs: number }[] };
    }>(await asAgent('delete_script', { setId: SET, scriptId: SCRIPT }));
    // "17 documents · 3 generated files · 482 MB", not "you asked to delete".
    expect(result.preview.transcripts).toHaveLength(2);
    expect(result.preview.transcripts[0].paragraphs).toBe(4);
  });

  it('refuses an unapproved confirmation id', async () => {
    const preview = unwrap<{ pendingId: string }>(
      await asAgent('delete_script', { setId: SET, scriptId: SCRIPT }),
    );
    const attempt = await asAgent('delete_script', {
      setId: SET,
      scriptId: SCRIPT,
      confirmationId: preview.pendingId,
    });
    expect(attempt.ok).toBe(false);
    if (!attempt.ok) expect(attempt.error.code).toBe('confirmation_required');
  });

  it('executes once a human has approved, and only then', async () => {
    const preview = unwrap<{ pendingId: string }>(
      await asAgent('delete_script', { setId: SET, scriptId: SCRIPT }),
    );
    unwrap(await asUi('approve_pending', { pendingId: preview.pendingId }));

    const done = unwrap<{ applied: boolean }>(
      await asAgent('delete_script', {
        setId: SET,
        scriptId: SCRIPT,
        confirmationId: preview.pendingId,
      }),
    );
    expect(done.applied).toBe(true);

    const set = unwrap<{ scripts: unknown[] }>(await asAgent('get_set', { setId: SET }));
    expect(set.scripts).toHaveLength(11);
  });

  it('spends an approval exactly once', async () => {
    const preview = unwrap<{ pendingId: string }>(
      await asAgent('delete_trigger_set', {
        setId: SET,
        scriptId: SCRIPT,
        transcriptId: 'tom-original',
        style: 'compressed-concept',
      }),
    );
    unwrap(await asUi('approve_pending', { pendingId: preview.pendingId }));
    const input = {
      setId: SET,
      scriptId: SCRIPT,
      transcriptId: 'tom-original',
      style: 'compressed-concept',
      confirmationId: preview.pendingId,
    };
    unwrap(await asAgent('delete_trigger_set', input));

    // The approval is CONSUMED, not merely checked. Asserted through the
    // pending queue rather than by replaying the call, because a replay would
    // fail on the target already being gone and prove nothing about the
    // approval.
    const remaining = unwrap<{ pending: { id: string }[] }>(await asUi('list_pending'));
    expect(remaining.pending.map((p) => p.id)).not.toContain(preview.pendingId);
  });

  it('refuses an approval raised against different input', async () => {
    // An approval is for an ACT, not for a verb. Otherwise "yes, delete script
    // 1" silently authorises deleting script 7.
    const preview = unwrap<{ pendingId: string }>(
      await asAgent('delete_script', { setId: SET, scriptId: SCRIPT }),
    );
    unwrap(await asUi('approve_pending', { pendingId: preview.pendingId }));

    const elsewhere = await asAgent('delete_script', {
      setId: SET,
      scriptId: 'kybernesis-phase-1/07',
      confirmationId: preview.pendingId,
    });
    expect(elsewhere.ok).toBe(false);
    if (!elsewhere.ok) expect(elsewhere.error.code).toBe('confirmation_invalid');
  });

  it('expires an approval nobody spent', async () => {
    const preview = unwrap<{ pendingId: string }>(
      await asAgent('delete_script', { setId: SET, scriptId: SCRIPT }),
    );
    unwrap(await asUi('approve_pending', { pendingId: preview.pendingId }));
    now += CONFIRMATION_TTL_MS + 1;

    const stale = await asAgent('delete_script', {
      setId: SET,
      scriptId: SCRIPT,
      confirmationId: preview.pendingId,
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe('confirmation_invalid');
  });

  it('a dryRun on a reversible write changes nothing', async () => {
    const before = unwrap<{ script: { title: string } }>(
      await asAgent('get_script', { setId: SET, scriptId: SCRIPT }),
    );
    const preview = unwrap<{ applied: boolean }>(
      await asAgent('update_script', {
        setId: SET,
        scriptId: SCRIPT,
        title: 'Something else',
        dryRun: true,
      }),
    );
    expect(preview.applied).toBe(false);

    const after = unwrap<{ script: { title: string } }>(
      await asAgent('get_script', { setId: SET, scriptId: SCRIPT }),
    );
    expect(after.script.title).toBe(before.script.title);
  });
});

describe('idempotency — because agents retry', () => {
  it('returns the ORIGINAL result on a repeated key, flagged as a replay', async () => {
    const first = await core.invoke(
      'create_set',
      { id: 'scratch', title: 'Scratch' },
      { principal: 'agent', idempotencyKey: 'k1' },
    );
    const second = await core.invoke(
      'create_set',
      { id: 'scratch', title: 'Scratch' },
      { principal: 'agent', idempotencyKey: 'k1' },
    );

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    // Not an error. The caller learns "it already happened" without having to
    // tell "already done" apart from "failed".
    if (second.ok) expect(second.replayed).toBe(true);

    const sets = unwrap<{ sets: { id: string }[] }>(await asAgent('list_sets'));
    expect(sets.sets.filter((s) => s.id === 'scratch')).toHaveLength(1);
  });

  it('without a key, a repeat is a conflict rather than a duplicate', async () => {
    unwrap(await asAgent('create_set', { id: 'scratch', title: 'Scratch' }));
    const again = await asAgent('create_set', {
      id: 'scratch',
      title: 'Scratch',
    });
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.error.code).toBe('conflict');
  });
});

describe('rate limiting — the hard stop', () => {
  it('stops a command loop, and never blocks a read', async () => {
    for (let i = 0; i < 120; i++) {
      const result = await asAgent('update_script', {
        setId: SET,
        scriptId: SCRIPT,
        summary: `pass ${i}`,
      });
      expect(result.ok, `command ${i} should have been allowed`).toBe(true);
    }

    const limited = await asAgent('update_script', {
      setId: SET,
      scriptId: SCRIPT,
      summary: 'x',
    });
    expect(limited.ok).toBe(false);
    if (!limited.ok) expect(limited.error.code).toBe('rate_limited');

    // A read-only poll is the caller doing the right thing.
    expect((await asAgent('get_set', { setId: SET })).ok).toBe(true);
  });
});

describe('audit', () => {
  it('records who, what, whether it worked, and the prior state', async () => {
    await asAgent('update_script', {
      setId: SET,
      scriptId: SCRIPT,
      title: 'Renamed',
    });
    const entry = core.audit.recent().at(-1);

    expect(entry?.principal).toBe('agent');
    expect(entry?.capability).toBe('update_script');
    expect(entry?.ok).toBe(true);
    // `prior` is what makes the record useful after something has gone wrong.
    expect(entry?.prior).toMatchObject({
      title: 'What Kybernesis actually builds',
    });
  });

  it('records failures with their code', async () => {
    await asAgent('approve_pending', { pendingId: 'nope' });
    const entry = core.audit.recent().at(-1);
    expect(entry?.ok).toBe(false);
    expect(entry?.errorCode).toBe('permission_denied');
  });
});

describe('active context', () => {
  it('degrades with a hint rather than an error when nothing is open', async () => {
    const context = unwrap<{ active: boolean; hint: string }>(await asAgent('get_active_context'));
    expect(context.active).toBe(false);
    // A hint tells the caller what to ask the human to do. An exception tells
    // it nothing.
    expect(context.hint).toMatch(/select a script/i);
  });

  it('is the default argument, not an extra call', async () => {
    await asUi('set_active_context', { setId: SET, scriptId: SCRIPT });
    const script = unwrap<{ script: { id: string } }>(await asAgent('get_script'));
    expect(script.script.id).toBe(SCRIPT);
  });

  it('expires, so an agent cannot target what was open before lunch', async () => {
    await asUi('set_active_context', { setId: SET, scriptId: SCRIPT });
    now += ACTIVE_CONTEXT_TTL_MS + 1;

    const context = unwrap<{ active: boolean; hint?: string }>(await asAgent('get_active_context'));
    expect(context.active).toBe(false);
    expect(context.hint).toMatch(/stale/i);

    // And the stale selection must not silently aim a verb.
    const blind = await asAgent('get_script');
    expect(blind.ok).toBe(false);
    if (!blind.ok) expect(blind.error.code).toBe('not_found');
  });
});

describe('the change event', () => {
  const collect = (): { events: { capability: string; principal: string }[] } => {
    const events: { capability: string; principal: string }[] = [];
    core.onChange((e) => events.push({ capability: e.capability, principal: e.principal }));
    return { events };
  };

  it('fires when a command actually changes something', async () => {
    const { events } = collect();
    await asAgent('update_script', { setId: SET, scriptId: SCRIPT, title: 'Renamed' });
    expect(events).toEqual([{ capability: 'update_script', principal: 'agent' }]);
  });

  it('stays quiet on a query', async () => {
    const { events } = collect();
    await asAgent('get_set', { setId: SET });
    await asAgent('list_talents');
    expect(events).toEqual([]);
  });

  it('stays quiet on a dry run', async () => {
    // Nothing changed, so waking every client would train them to ignore it.
    const { events } = collect();
    await asAgent('update_script', { setId: SET, scriptId: SCRIPT, title: 'x', dryRun: true });
    expect(events).toEqual([]);
  });

  it('stays quiet on a destructive verb that only previewed', async () => {
    const { events } = collect();
    await asAgent('delete_script', { setId: SET, scriptId: SCRIPT });
    expect(events).toEqual([]);
  });

  it('stays quiet on a refused call', async () => {
    const { events } = collect();
    await asAgent('set_active_context', { scriptId: SCRIPT });
    expect(events).toEqual([]);
  });

  it('unsubscribes cleanly', async () => {
    const events: string[] = [];
    const off = core.onChange((e) => events.push(e.capability));
    await asAgent('update_script', { setId: SET, scriptId: SCRIPT, title: 'one' });
    off();
    await asAgent('update_script', { setId: SET, scriptId: SCRIPT, title: 'two' });
    expect(events).toEqual(['update_script']);
  });

  it('does not let a broken listener fail the caller’s write', async () => {
    core.onChange(() => {
      throw new Error('listener exploded');
    });
    const result = await asAgent('update_script', { setId: SET, scriptId: SCRIPT, title: 'ok' });
    expect(result.ok).toBe(true);
  });
});

describe('unknown capabilities', () => {
  it('never make the caller guess', async () => {
    const result = await asAgent('delete_everything');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('not_found');
      expect((result.error.details as { available: string[] }).available).toContain('get_set');
    }
  });
});
