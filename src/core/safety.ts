/**
 * THE GATE — one authorization point, beneath every adapter.
 *
 * The wrong shape is the default one, because the adapter is where you are
 * working when you first think about safety:
 *
 *      WRONG                                RIGHT
 *   agent → MCP/HTTP → [authz] → core    agent → HTTP ─┐
 *   UI    → IPC ───────────────→ core    UI    → IPC ──┼→ [AUTHZ] → core
 *          (different rules, or none)    CLI   ────────┘
 *
 * The test: if the control server were deleted tomorrow, would `delete_script`
 * still be as protected? Here, yes — the renderer's IPC path runs through this
 * same gate. (agent-safety.md §2; OWASP: separate decision-making from
 * execution.)
 *
 * Five controls live here, each earned by a documented failure:
 *
 *   1. Principal check      — the agent is narrower than the user (§3)
 *   2. preview → confirm    — destructive verbs, and the approval channel is
 *                             NOT reachable from the surface it constrains (§4)
 *   3. Idempotency          — agents retry; return the ORIGINAL result (§5)
 *   4. Rate limiting        — "beyond a prompt": a hard stop the model cannot
 *                             argue past (§4, closing)
 *   5. Audit                — principal, parameters, prior state (§7)
 */

import {
  CAPABILITY_BY_NAME,
  type CapabilityError,
  type CapabilityMeta,
  type ErrorCode,
  type Principal,
} from '@shared/capabilities';

/* ------------------------------------------------------------------ *
 * Errors
 * ------------------------------------------------------------------ */

export class CapabilityFailure extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'CapabilityFailure';
  }

  toError(): CapabilityError {
    return { code: this.code, message: this.message, details: this.details };
  }
}

/**
 * Throw a typed failure.
 *
 * Declared as a `function` rather than an arrow const on purpose: TypeScript
 * only narrows control flow on a `never` return for function declarations, and
 * without that every `fail(...)` guard would need a redundant `return`.
 */
export function fail(code: ErrorCode, message: string, details?: unknown): never {
  throw new CapabilityFailure(code, message, details);
}

/* ------------------------------------------------------------------ *
 * Clock — injectable, because every control here is time-dependent
 * ------------------------------------------------------------------ */

export type Clock = () => number;
export const systemClock: Clock = () => Date.now();

/* ------------------------------------------------------------------ *
 * 1 · Principal check
 * ------------------------------------------------------------------ */

export function assertPrincipalMay(capability: CapabilityMeta, principal: Principal): void {
  if (!capability.principals.includes(principal)) {
    fail(
      'permission_denied',
      `"${capability.name}" is not reachable from the ${principal} surface`,
      {
        capability: capability.name,
        principal,
        allowed: capability.principals,
      },
    );
  }
}

export function resolveCapability(name: string): CapabilityMeta {
  const capability = CAPABILITY_BY_NAME.get(name);
  if (!capability) {
    fail('not_found', `no capability named "${name}"`, {
      // Exact-identifier dependence is a named mismatch: never make the caller
      // guess. Hand back the list it should have read.
      available: [...CAPABILITY_BY_NAME.keys()].sort(),
    });
  }
  return capability;
}

/* ------------------------------------------------------------------ *
 * 2 · preview → confirm → execute
 * ------------------------------------------------------------------ */

export interface PendingAction {
  id: string;
  capability: string;
  /** Who asked for it. An approval must be able to say what it is approving. */
  requestedBy: Principal;
  /** Human-readable consequences — what would be removed, not what was intended. */
  preview: unknown;
  /** The exact input the approval is good for. A different input is a different act. */
  inputFingerprint: string;
  createdAt: number;
  expiresAt: number;
  approved: boolean;
  approvedAt: number | null;
}

/** Ten minutes. Long enough to read a preview, short enough not to be furniture. */
export const CONFIRMATION_TTL_MS = 10 * 60 * 1000;

export class ConfirmationLedger {
  private readonly pending = new Map<string, PendingAction>();
  private counter = 0;

  constructor(private readonly clock: Clock = systemClock) {}

  private sweep(): void {
    const now = this.clock();
    for (const [id, action] of this.pending) if (action.expiresAt <= now) this.pending.delete(id);
  }

  /**
   * Record a preview. Returns the pending action an agent surfaces to a human.
   *
   * Note what this does NOT do: it does not approve anything, and there is no
   * argument that makes it approve anything. `--yes` throws the question away;
   * this keeps the question and lets the other side answer it.
   */
  open(
    capability: string,
    requestedBy: Principal,
    preview: unknown,
    inputFingerprint: string,
  ): PendingAction {
    this.sweep();
    const now = this.clock();
    const action: PendingAction = {
      id: `pend_${(++this.counter).toString(36)}_${now.toString(36)}`,
      capability,
      requestedBy,
      preview,
      inputFingerprint,
      createdAt: now,
      expiresAt: now + CONFIRMATION_TTL_MS,
      approved: false,
      approvedAt: null,
    };
    this.pending.set(action.id, action);
    return action;
  }

  list(): PendingAction[] {
    this.sweep();
    return [...this.pending.values()];
  }

  /**
   * Approve. Callable ONLY through `approve_pending`, which is absent from the
   * agent surface — see `capabilities.ts`. The mechanism that satisfies a
   * control must never be reachable through the surface that control
   * constrains; ImageDrip shipped exactly that hole and it is why this comment
   * exists.
   */
  approve(id: string): PendingAction {
    this.sweep();
    const action = this.pending.get(id);
    if (!action) fail('confirmation_invalid', `no pending action "${id}" — it may have expired`);
    action.approved = true;
    action.approvedAt = this.clock();
    return action;
  }

  /**
   * Spend an approval. Fails closed: an unknown id, an expired one, an
   * unapproved one, or one raised against different input all refuse. Absence
   * of confirmation is not confirmation of absence.
   */
  consume(id: string, capability: string, inputFingerprint: string): PendingAction {
    this.sweep();
    const action = this.pending.get(id);
    if (!action) fail('confirmation_invalid', `no pending action "${id}" — it may have expired`);
    const pending = action;
    if (!pending.approved)
      fail('confirmation_required', `pending action "${id}" has not been approved by a human`);
    if (pending.capability !== capability)
      fail(
        'confirmation_invalid',
        `pending action "${id}" was raised for "${pending.capability}", not "${capability}"`,
      );
    if (pending.inputFingerprint !== inputFingerprint)
      fail('confirmation_invalid', `pending action "${id}" was approved for different input`);
    this.pending.delete(id);
    return pending;
  }
}

/* ------------------------------------------------------------------ *
 * 3 · Idempotency
 * ------------------------------------------------------------------ */

/**
 * An agent that loses a response does not know whether the operation happened.
 * It retries. Without this you get two of everything, and the cause is not a
 * bug in the code — it is uncertainty in the caller.
 */
export class IdempotencyLedger {
  private readonly seen = new Map<string, { at: number; result: unknown }>();

  constructor(
    private readonly clock: Clock = systemClock,
    private readonly ttlMs = 24 * 60 * 60 * 1000,
  ) {}

  private key(capability: string, key: string): string {
    return `${capability}::${key}`;
  }

  private sweep(): void {
    const cutoff = this.clock() - this.ttlMs;
    for (const [k, v] of this.seen) if (v.at < cutoff) this.seen.delete(k);
  }

  recall(capability: string, key: string): { hit: boolean; result: unknown } {
    this.sweep();
    const entry = this.seen.get(this.key(capability, key));
    return entry ? { hit: true, result: entry.result } : { hit: false, result: undefined };
  }

  remember(capability: string, key: string, result: unknown): void {
    this.seen.set(this.key(capability, key), { at: this.clock(), result });
  }
}

/* ------------------------------------------------------------------ *
 * 4 · Rate limiting
 * ------------------------------------------------------------------ */

/**
 * A confirmation prompt is worth little against a caller that can issue a
 * thousand requests a second. This is the hard stop.
 *
 * Queries are not limited — they are read-only and an agent polling
 * `get_active_context` is doing the right thing. Commands are.
 */
export class RateLimiter {
  private readonly hits = new Map<Principal, number[]>();

  constructor(
    private readonly clock: Clock = systemClock,
    private readonly windowMs = 60_000,
    private readonly limits: Record<Principal, number> = {
      ui: 600,
      agent: 120,
    },
  ) {}

  check(principal: Principal): void {
    const now = this.clock();
    const window = (this.hits.get(principal) ?? []).filter((at) => at > now - this.windowMs);
    if (window.length >= this.limits[principal]) {
      fail('rate_limited', `${principal} exceeded ${this.limits[principal]} commands per minute`, {
        retryAfterMs: Math.max(0, window[0] + this.windowMs - now),
      });
    }
    window.push(now);
    this.hits.set(principal, window);
  }
}

/* ------------------------------------------------------------------ *
 * 5 · Audit
 * ------------------------------------------------------------------ */

export interface AuditEntry {
  at: number;
  /** Human or agent — distinguishably. You must be able to answer "who did this". */
  principal: Principal;
  capability: string;
  input: unknown;
  ok: boolean;
  errorCode?: ErrorCode;
  /**
   * What it changed. Cheap to add now, expensive to retrofit, and the only
   * control that helps AFTER something has gone wrong.
   */
  prior?: unknown;
  dryRun?: boolean;
  replayed?: boolean;
}

export class AuditLog {
  private readonly entries: AuditEntry[] = [];

  constructor(
    private readonly limit = 1000,
    private readonly sink?: (entry: AuditEntry) => void,
  ) {}

  record(entry: AuditEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.limit) this.entries.shift();
    this.sink?.(entry);
  }

  recent(count = 50): AuditEntry[] {
    return this.entries.slice(-count);
  }
}

/* ------------------------------------------------------------------ *
 * Fingerprinting — stable across key order, so a re-serialised retry matches
 * ------------------------------------------------------------------ */

export function fingerprint(value: unknown): string {
  const canonical = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(canonical);
    if (v && typeof v === 'object') {
      return Object.fromEntries(
        Object.entries(v as Record<string, unknown>)
          .filter(([k]) => k !== 'dryRun' && k !== 'confirmationId' && k !== 'idempotencyKey')
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, val]) => [k, canonical(val)]),
      );
    }
    return v;
  };
  return JSON.stringify(canonical(value));
}
