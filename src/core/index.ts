/**
 * THE CAPABILITY CORE — one API, N clients, none privileged.
 *
 *              ┌─ renderer (IPC) ──┐
 *              │                   │
 *              ├─ agent (HTTP) ────┼──►  core.invoke  ──►  [GATE]  ──►  handler  ──►  repository
 *              │                   │
 *              └─ CLI (fetch) ─────┘
 *
 * The bar is not "an API exists". It is **can the agent do what the UI can do**,
 * against the same store, with no window open. Everything the renderer will do
 * in sessions 2 and 3 goes through this function, which is what keeps that true
 * — a capability wired straight into the UI is unreachable from outside no
 * matter what the catalog says, and that failure is invisible until someone
 * tries it.
 *
 * `createCore` takes a repository and nothing else. No Electron, no HTTP, no
 * filesystem assumption — which is why the whole surface is testable in a node
 * environment with a MemoryRepository.
 */

import type { CapabilityMeta, InvokeResult, Principal } from '@shared/capabilities';
import { ActiveContextHolder } from './active-context.js';
import { createHandlers, type Handler, type HandlerContext } from './handlers.js';
import type { Repository } from './repository.js';
import {
  AuditLog,
  CapabilityFailure,
  ConfirmationLedger,
  IdempotencyLedger,
  RateLimiter,
  assertPrincipalMay,
  resolveCapability,
  systemClock,
  type AuditEntry,
  type Clock,
} from './safety.js';

export interface CoreOptions {
  repository: Repository;
  /** Injectable so every time-dependent control is testable without sleeping. */
  clock?: Clock;
  /** Where audit entries go beyond the in-memory ring — a logger, usually. */
  auditSink?: (entry: AuditEntry) => void;
}

export interface InvokeOptions {
  principal: Principal;
  idempotencyKey?: string;
}

/**
 * Emitted after a command actually CHANGES something — not on a query, not on a
 * dry run, not on a refused call.
 *
 * This is the Event primitive, and it was earned rather than assumed: the
 * renderer loads once at startup, so an agent authoring a trigger set left the
 * store changed and the window stale. A client reduced to restarting is exactly
 * the signal that an event belongs here (capability-model.md §1).
 */
export interface ChangeEvent {
  capability: string;
  principal: Principal;
  at: number;
}

export interface Core {
  invoke(name: string, input: unknown, options: InvokeOptions): Promise<InvokeResult>;
  /** Subscribe to state changes. Returns an unsubscribe function. */
  onChange(listener: (event: ChangeEvent) => void): () => void;
  /** The renderer's own selection state, so the UI can drive it directly. */
  readonly active: ActiveContextHolder;
  readonly audit: AuditLog;
  readonly repository: Repository;
}

export function createCore(options: CoreOptions): Core {
  const clock = options.clock ?? systemClock;
  const active = new ActiveContextHolder(clock);
  const confirmations = new ConfirmationLedger(clock);
  const idempotency = new IdempotencyLedger(clock);
  const limiter = new RateLimiter(clock);
  const audit = new AuditLog(1000, options.auditSink);
  const handlers = createHandlers();
  const listeners = new Set<(event: ChangeEvent) => void>();

  async function invoke(
    name: string,
    input: unknown,
    invokeOptions: InvokeOptions,
  ): Promise<InvokeResult> {
    const { principal } = invokeOptions;
    let capability: CapabilityMeta | undefined;
    let prior: unknown;
    const record = (ok: boolean, extra: Partial<AuditEntry> = {}): void =>
      audit.record({
        at: clock(),
        principal,
        capability: name,
        input,
        ok,
        prior,
        ...extra,
      });

    try {
      capability = resolveCapability(name);

      // 1 · The gate. Before anything else, and identical for every adapter.
      assertPrincipalMay(capability, principal);

      const envelope = (input ?? {}) as Record<string, unknown>;
      const dryRun = envelope.dryRun === true;
      const confirmationId =
        typeof envelope.confirmationId === 'string' ? envelope.confirmationId : undefined;
      const idempotencyKey =
        invokeOptions.idempotencyKey ??
        (typeof envelope.idempotencyKey === 'string' ? envelope.idempotencyKey : undefined);

      // 2 · Rate limit commands only. A read-only poll is the caller doing the
      //     right thing; a write loop is the thing a prompt cannot stop.
      if (capability.kind === 'command') limiter.check(principal);

      // 3 · Idempotency. A retry returns the ORIGINAL result, flagged, so the
      //     caller learns "it already happened" rather than having to tell
      //     "already done" apart from "failed".
      if (idempotencyKey && capability.supportsIdempotencyKey && !dryRun) {
        const recalled = idempotency.recall(name, idempotencyKey);
        if (recalled.hit) {
          record(true, { replayed: true, dryRun });
          return { ok: true, data: recalled.result, replayed: true };
        }
      }

      const handler: Handler | undefined = handlers[name];
      if (!handler)
        return {
          ok: false,
          error: {
            code: 'internal',
            message: `"${name}" is published but has no implementation`,
          },
        };

      const context: HandlerContext = {
        repository: options.repository,
        active,
        confirmations,
        principal,
        capability,
        dryRun,
        confirmationId,
        recordPrior: (value) => {
          prior = value;
        },
      };

      const data = await handler(input, context);

      if (idempotencyKey && capability.supportsIdempotencyKey && !dryRun)
        idempotency.remember(name, idempotencyKey, data);

      record(true, { dryRun });

      // Announce only a real change. A query, a dry run and a refused call all
      // leave the store exactly as it was, and waking every client for those
      // would train them to ignore the event.
      if (capability.kind === 'command' && !dryRun && didApply(data)) {
        const event: ChangeEvent = { capability: name, principal, at: clock() };
        for (const listener of listeners) {
          try {
            listener(event);
          } catch {
            // A broken listener must not fail the caller's write.
          }
        }
      }

      return { ok: true, data };
    } catch (error) {
      if (error instanceof CapabilityFailure) {
        record(false, { errorCode: error.code });
        return { ok: false, error: error.toError() };
      }
      record(false, { errorCode: 'internal' });
      return {
        ok: false,
        error: {
          code: 'internal',
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  return {
    invoke,
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    active,
    audit,
    repository: options.repository,
  };
}

/**
 * A command returns `{ applied: false, ... }` when it previewed instead of
 * acting. Anything else that reached the end of a handler changed something.
 */
function didApply(data: unknown): boolean {
  return !(data && typeof data === 'object' && (data as { applied?: unknown }).applied === false);
}

export { MemoryRepository, FileRepository, seed, EMPTY_DOCUMENT } from './repository.js';
export type { Repository, RepositoryDocument } from './repository.js';
export { scoreAgainst, measure } from './cadence.js';
export type { CadenceScore, CadenceRule, CadenceMeasurements } from './cadence.js';
export { ActiveContextHolder, ACTIVE_CONTEXT_TTL_MS } from './active-context.js';
export type { ActiveContext } from './active-context.js';
export { CONFIRMATION_TTL_MS } from './safety.js';
export type { AuditEntry } from './safety.js';
