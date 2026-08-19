/**
 * ACTIVE CONTEXT — what the talent has open right now.
 *
 * The one piece of hidden state worth having, and only because of three
 * properties, all of which are load-bearing:
 *
 *   1. It EXPIRES. A selection from an hour ago is not a selection. Without
 *      expiry an agent silently targets whatever was last opened before lunch —
 *      a wrong-target bug that raises no error.
 *   2. It degrades with a HINT, not an exception. `{active:false, hint}` tells
 *      the caller what to ask the human to do; an exception tells it nothing.
 *   3. It is the DEFAULT ARGUMENT, not an extra call. Omit `setId` and the
 *      active one is used. A context you must fetch first is just a query with
 *      extra steps.
 *
 * It belongs to the human, which is why `set_active_context` is UI-only. An
 * agent that could set it could aim every verb that defaults to it.
 *
 * Source: Open Design's `get_active_context`, via capability-model.md §4.
 */

import type { Clock } from './safety.js';
import { systemClock } from './safety.js';
import type { ScriptId, SetId, TranscriptId, TriggerStyle } from '@shared/domain';

/** Five minutes after the last interaction, matching the reference implementation. */
export const ACTIVE_CONTEXT_TTL_MS = 5 * 60 * 1000;

export interface ActiveSelection {
  setId: SetId | null;
  scriptId: ScriptId | null;
  transcriptId: TranscriptId | null;
  style: TriggerStyle | null;
  /** Index into the active trigger set. The talent's position in the take. */
  step: number | null;
}

export type ActiveContext =
  | ({ active: true; updatedAt: number; expiresAt: number } & ActiveSelection)
  | { active: false; hint: string };

const NOTHING_OPEN =
  'Nothing is open in Teletubby right now. Ask the talent to select a script, or pass the ids explicitly.';

const WENT_STALE =
  'The talent has not touched Teletubby in the last five minutes, so the selection is stale. Ask them to select a script, or pass the ids explicitly.';

export class ActiveContextHolder {
  private selection: ActiveSelection | null = null;
  private updatedAt = 0;

  constructor(private readonly clock: Clock = systemClock) {}

  set(selection: Partial<ActiveSelection>): ActiveContext {
    this.selection = {
      setId: null,
      scriptId: null,
      transcriptId: null,
      style: null,
      step: null,
      ...(this.fresh() ? this.selection : null),
      ...selection,
    };
    this.updatedAt = this.clock();
    return this.get();
  }

  clear(): void {
    this.selection = null;
    this.updatedAt = 0;
  }

  private fresh(): boolean {
    return this.selection !== null && this.clock() - this.updatedAt < ACTIVE_CONTEXT_TTL_MS;
  }

  get(): ActiveContext {
    if (this.selection === null) return { active: false, hint: NOTHING_OPEN };
    if (!this.fresh()) return { active: false, hint: WENT_STALE };
    return {
      active: true,
      updatedAt: this.updatedAt,
      expiresAt: this.updatedAt + ACTIVE_CONTEXT_TTL_MS,
      ...this.selection,
    };
  }

  /**
   * Resolve an omitted argument against the selection. Returns `undefined`
   * rather than throwing — the caller decides whether the field was required,
   * because a missing id is a `not_found` with a useful hint, never a crash.
   */
  defaulted<K extends keyof ActiveSelection>(field: K): ActiveSelection[K] | undefined {
    if (!this.fresh() || this.selection === null) return undefined;
    return this.selection[field] ?? undefined;
  }
}
