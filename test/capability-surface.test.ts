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
  'list_sets',
  'list_talents',
  'score_transcript',
  'set_active_context',
  'update_script',
  'upsert_talent',
  'write_transcript',
  'write_trigger_set',
];

/**
 * The agent surface is the UI surface MINUS the three verbs an agent must not
 * hold. Written as an explicit list rather than a computed difference, because
 * a computed list would silently absorb the next mistake.
 */
const AGENT_SURFACE = [
  'create_script',
  'create_set',
  'delete_script',
  'delete_trigger_set',
  'describe_capabilities',
  'get_active_context',
  'get_script',
  'get_set',
  'get_talent',
  'get_transcript',
  'get_trigger_set',
  'list_sets',
  'list_talents',
  'score_transcript',
  'update_script',
  'upsert_talent',
  'write_transcript',
  'write_trigger_set',
];

/**
 * The three that are UI-only, and why. Enumerated BY NAME, because an allow-list
 * built as "everything not explicitly denied" silently includes every one of
 * them the day someone adds a verb.
 */
const NEVER_ON_THE_AGENT_SURFACE: Record<string, string> = {
  approve_pending:
    'the mechanism that satisfies a control must never be reachable through the surface that control constrains',
  list_pending: 'the approval queue is the human’s view of what an agent has asked for',
  set_active_context:
    'the selection belongs to the human; an agent that could set it could aim every verb that defaults to it',
};

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
