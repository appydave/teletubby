import { describe, expect, it } from 'vitest';
import {
  CAPABILITIES,
  CAPABILITY_BY_NAME,
  capabilityNamesFor,
  type CapabilityMeta,
} from '@shared/capabilities';
import { createHandlers } from '@core/handlers';

/**
 * THE PINNED SURFACE.
 *
 * "If you build one enforcement thing, build this" — agent-safety.md §8. A
 * single test asserting the exact set of externally-published capabilities.
 * Adding a verb fails CI until someone states the intent, which is stronger
 * than a PR checklist because it cannot be skipped by a tired reviewer.
 *
 * ImageDrip added the same test after finding a hole and it immediately caught
 * four more channels that were "safe" only because nothing had registered a
 * handler for them yet.
 *
 * **If a change here fails, do not update the list to make it pass.** Read the
 * safety gate in `docs/spec.md` first and decide, deliberately, that the new
 * verb belongs on the surface it claims.
 */

const UI_SURFACE = [
  'approve_pending',
  'create_script',
  'create_set',
  'delete_rig',
  'delete_script',
  'delete_trigger_set',
  'describe_capabilities',
  'get_active_context',
  'get_script',
  'get_set',
  'get_talent',
  'get_transcript',
  'get_trigger_set',
  'list_pending',
  'list_rigs',
  'list_sets',
  'list_talents',
  'remember_layout',
  'rename_rig',
  'save_rig',
  'score_transcript',
  'set_active_context',
  'update_script',
  'upsert_talent',
  'write_transcript',
  'write_trigger_set',
];

/**
 * The agent surface is the UI surface MINUS the four verbs an agent must not
 * hold. Written as an explicit list rather than a computed difference, because
 * a computed list would silently absorb the next mistake.
 */
const AGENT_SURFACE = [
  'create_script',
  'create_set',
  'delete_rig',
  'delete_script',
  'delete_trigger_set',
  'describe_capabilities',
  'get_active_context',
  'get_script',
  'get_set',
  'get_talent',
  'get_transcript',
  'get_trigger_set',
  'list_rigs',
  'list_sets',
  'list_talents',
  'rename_rig',
  'save_rig',
  'score_transcript',
  'update_script',
  'upsert_talent',
  'write_transcript',
  'write_trigger_set',
];

/**
 * The four that are UI-only, and why. Enumerated BY NAME, because an allow-list
 * built as "everything not explicitly denied" silently includes every one of
 * them the day someone adds a verb.
 */
const NEVER_ON_THE_AGENT_SURFACE: Record<string, string> = {
  approve_pending:
    'the mechanism that satisfies a control must never be reachable through the surface that control constrains',
  list_pending: 'the approval queue is the human’s view of what an agent has asked for',
  set_active_context:
    'the selection belongs to the human; an agent that could set it could aim every verb that defaults to it',
  remember_layout:
    'the sticky layout is the human’s working state; an agent writing it would decide what the talent sees at the START of tomorrow’s take',
};

/**
 * ⚠️ **`save_rig` IS on the agent surface, and `remember_layout` is not.** That
 * split is the whole design, not an oversight: an agent may AUTHOR an
 * arrangement the talent can then choose, and may never choose one for them.
 * Authoring adds a chip; remembering changes what opens.
 */

describe('the published capability surface', () => {
  it('is exactly this, for the ui principal', () => {
    expect(capabilityNamesFor('ui')).toEqual(UI_SURFACE);
  });

  it('is exactly this, for the agent principal', () => {
    expect(capabilityNamesFor('agent')).toEqual(AGENT_SURFACE);
  });

  it('keeps the confirmation and selection channels off the agent surface', () => {
    for (const [name, reason] of Object.entries(NEVER_ON_THE_AGENT_SURFACE)) {
      const capability = CAPABILITY_BY_NAME.get(name);
      expect(capability, `${name} is missing entirely`).toBeDefined();
      expect(
        (capability as CapabilityMeta).principals,
        `${name} must stay UI-only — ${reason}`,
      ).not.toContain('agent');
    }
  });

  it('publishes nothing it cannot execute', () => {
    // Open Design catalogued `od export --format pdf`, documented it, and it
    // could never succeed headlessly because rasterization lived in the
    // window. A verb in the catalog with no implementation is that bug.
    const handlers = createHandlers();
    for (const capability of CAPABILITIES) {
      expect(handlers[capability.name], `"${capability.name}" has no handler`).toBeTypeOf(
        'function',
      );
    }
  });

  it('implements nothing it does not publish', () => {
    for (const name of Object.keys(createHandlers())) {
      expect(CAPABILITY_BY_NAME.has(name), `"${name}" is implemented but not published`).toBe(true);
    }
  });
});

/**
 * AN EXTERNAL CONSUMER EXISTS.
 *
 * A KyberAgent at `~/dev/agents/teletubby` calls this control API on
 * 127.0.0.1:7111 and hardcodes the five verb names below. They are a PUBLISHED
 * CONTRACT: renaming one silently breaks an agent in a different repository,
 * and it will be debugged over there as an agent bug.
 *
 * The pinning test above already fails on any change to the published set — but
 * it cannot know that a name has a consumer outside this repo. This block is
 * that knowledge, written down where a rename will trip over it.
 *
 * If one of these has to be renamed: say so first, and change the agent in the
 * same breath. "I'll update the consumer later" is the same failure as
 * "I'll do the CLI later".
 */
describe('the external consumer contract', () => {
  const KYBERAGENT_CALLS = [
    'get_transcript',
    'get_script',
    'write_trigger_set',
    'score_transcript',
    'approve_pending',
  ];

  it.each(KYBERAGENT_CALLS)('%s still exists', (name) => {
    expect(CAPABILITY_BY_NAME.has(name), `~/dev/agents/teletubby calls "${name}"`).toBe(true);
  });

  it('keeps four of the five reachable from the agent surface', () => {
    const agent = capabilityNamesFor('agent');
    for (const name of KYBERAGENT_CALLS.filter((n) => n !== 'approve_pending')) {
      expect(agent, `the KyberAgent calls "${name}" over HTTP`).toContain(name);
    }
  });

  it('deliberately withholds approve_pending from it, and always will', () => {
    // NOT a rename and NOT an omission. An agent that can approve its own
    // destructive action has no control on it at all — the exact hole ImageDrip
    // shipped. The agent surfaces the pendingId to a human; the human approves.
    expect(CAPABILITY_BY_NAME.get('approve_pending')?.principals).toEqual(['ui']);
    expect(capabilityNamesFor('agent')).not.toContain('approve_pending');
  });

  it('means describe_capabilities is authoritative, not advisory', () => {
    // What the listing returns for a principal is exactly what that principal
    // may call. A consumer that ignores it and calls anyway gets
    // permission_denied — every time, by design.
    const agent = capabilityNamesFor('agent');
    for (const name of agent) {
      expect(CAPABILITY_BY_NAME.get(name)?.principals).toContain('agent');
    }
  });
});

describe('every capability carries a usable contract', () => {
  it.each(CAPABILITIES)('$name', (capability) => {
    expect(capability.summary.trim().length).toBeGreaterThan(20);
    expect(capability.principals.length).toBeGreaterThan(0);

    if (capability.kind === 'query') {
      // A query that mutates is a query nobody can call speculatively.
      expect(capability.sideEffects).toBe('read-only');
      expect(capability.idempotent).toBe(true);
    }

    // Errors are part of the contract. A caller that cannot tell WHY something
    // failed retries the same call, gives up, or invents a workaround.
    if (capability.sideEffects !== 'read-only') {
      expect(capability.failureModes.length).toBeGreaterThan(0);
    }

    // Destructive verbs must be previewable AND confirmable. Neither alone is
    // the pattern: a preview you can skip is decoration, and a confirmation
    // with no preview asks a human to approve an intent, not a consequence.
    if (capability.sideEffects === 'destructive') {
      expect(capability.confirmationRequired).toBe(true);
      expect(capability.supportsDryRun).toBe(true);
      expect(capability.failureModes).toContain('confirmation_required');
    }
  });
});
