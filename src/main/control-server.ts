/**
 * THE CONTROL SURFACE — a loopback HTTP server inside Electron main.
 *
 * This is the whole reason an agent can drive Teletubby. AppyTron apps are
 * agent-unreachable by default because they are windows: ~46 IPC channels that
 * terminate inside the renderer look like a verb catalog and reach nothing.
 * This is that catalog's sibling — the same verbs, also reachable from outside.
 *
 * It is an ADAPTER. It parses a request, names the principal `agent`, and calls
 * `core.invoke`. It holds no business logic, no authorization decisions and no
 * knowledge of what a script is. Delete it and every rule still holds, because
 * the gate is beneath it and the renderer's IPC path runs through the same one.
 *
 * WHY THE SERVER IS IN MAIN, NOT THE RENDERER.
 * The renderer's CSP is `self`-only and stays that way (spec Boundaries). A
 * capability that lives in the UI process is not externally reachable no matter
 * what the catalog says — Open Design shipped an `od export` verb that can
 * never succeed headlessly for exactly that reason. Everything reachable here
 * lives in main, so nothing here is a false promise.
 *
 * ADDRESSING. 127.0.0.1:7111, the slot already reserved in
 * `~/.config/appydave/apps.json`. Never 0.0.0.0 — this is an unattended local
 * surface with write verbs on it.
 */

import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { join } from 'node:path';
import { atomicWrite } from '@appydave/core';
import type { Core } from '../core/index.js';
import type { InvokeResult } from '@shared/capabilities';

export const CONTROL_PORT = 7111;

export interface ControlServerOptions {
  core: Core;
  /** Where the discovery file goes — `app.getPath('userData')` in production. */
  userDataPath: string;
  port?: number;
  appVersion: string;
  log?: (message: string, detail?: unknown) => void;
}

export interface ControlServerHandle {
  port: number;
  /** The interface actually bound. Always 127.0.0.1; asserted by a test. */
  address: string;
  token: string;
  discoveryPath: string;
  close(): Promise<void>;
}

/** Body cap. An agent has no reason to post a megabyte, and a stall is a bug. */
const MAX_BODY_BYTES = 1_000_000;

const json = (response: ServerResponse, status: number, body: unknown): void => {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    // Not a browser surface. Nothing about this should be reachable from a page.
    'access-control-allow-origin': 'null',
    'x-content-type-options': 'nosniff',
  });
  response.end(payload);
};

const readBody = async (request: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new Error('request body too large');
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
};

/** Constant-time compare, so the token cannot be recovered a byte at a time. */
const tokenMatches = (presented: string, expected: string): boolean => {
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * Start the control surface.
 *
 * FAILS CLOSED. If the discovery file cannot be written, the server does not
 * start — because a running surface nobody can address is worse than no
 * surface: the agent falls back to guessing, and the logs report success.
 * Absence of confirmation is not confirmation of absence.
 */
export async function startControlServer(
  options: ControlServerOptions,
): Promise<ControlServerHandle> {
  const port = options.port ?? CONTROL_PORT;
  const log = options.log ?? ((): void => undefined);

  // Minted per launch rather than stored. A stable secret on disk outlives the
  // app that issued it; this one dies with the window.
  const token = randomBytes(32).toString('hex');
  const discoveryPath = join(options.userDataPath, 'control.json');

  const server: Server = createServer((request, response) => {
    void handle(request, response).catch((error: unknown) => {
      log('control request failed', error);
      json(response, 500, {
        ok: false,
        error: {
          code: 'internal',
          message: error instanceof Error ? error.message : String(error),
        },
      });
    });
  });

  async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');

    // Unauthenticated, and deliberately says nothing but "something is here".
    // It exists so the CLI can tell "app not running" from "wrong token" —
    // the failure mode Open Design's MCP server also thought about.
    if (request.method === 'GET' && url.pathname === '/api/health') {
      json(response, 200, {
        ok: true,
        app: 'teletubby',
        version: options.appVersion,
        port: (server.address() as { port: number } | null)?.port ?? port,
      });
      return;
    }

    const header = request.headers.authorization ?? '';
    const presented = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!presented || !tokenMatches(presented, token)) {
      json(response, 401, {
        ok: false,
        error: {
          code: 'permission_denied',
          message: `missing or invalid bearer token — read it from ${discoveryPath}`,
        },
      });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/capabilities') {
      json(
        response,
        200,
        await options.core.invoke('describe_capabilities', {}, { principal: 'agent' }),
      );
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/invoke') {
      const body = (await readBody(request)) as {
        capability?: unknown;
        input?: unknown;
        idempotencyKey?: unknown;
      };
      if (typeof body.capability !== 'string') {
        json(response, 400, {
          ok: false,
          error: {
            code: 'invalid_input',
            message: '"capability" must be a string',
          },
        });
        return;
      }
      const result: InvokeResult = await options.core.invoke(body.capability, body.input ?? {}, {
        // The principal is set HERE and cannot be supplied by the caller.
        // Anything that reaches this server is an agent, whatever it claims.
        principal: 'agent',
        idempotencyKey: typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined,
      });
      json(response, result.ok ? 200 : statusFor(result), result);
      return;
    }

    json(response, 404, {
      ok: false,
      error: {
        code: 'not_found',
        message: `no route ${request.method} ${url.pathname}`,
        details: {
          routes: ['GET /api/health', 'GET /api/capabilities', 'POST /api/invoke'],
        },
      },
    });
  }

  const close = (): Promise<void> =>
    new Promise<void>((resolve) => {
      server.close(() => resolve());
    });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    // 127.0.0.1 only. Binding wider would publish write verbs to the network.
    server.listen(port, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve();
    });
  });

  // Read the port BACK from the socket rather than trusting the requested one.
  // With `port: 0` the OS assigns it, and a handle that reported the request
  // instead of the reality would hand every caller an address nothing is
  // listening on — which fails as a connection error, not as a config error.
  const address = server.address();
  const boundPort = typeof address === 'object' && address !== null ? address.port : port;
  const boundAddress =
    typeof address === 'object' && address !== null ? address.address : '127.0.0.1';

  // FAILS CLOSED, and only now — the discovery file has to carry the port that
  // is actually bound. A surface nobody can address is worse than no surface:
  // the caller falls back to guessing and the log reports success.
  try {
    await atomicWrite(
      discoveryPath,
      `${JSON.stringify(
        {
          port: boundPort,
          token,
          pid: process.pid,
          startedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
      { mode: 0o600 },
    );
  } catch (error) {
    await close();
    throw error;
  }

  log(`control surface listening on http://127.0.0.1:${boundPort} (token in ${discoveryPath})`);

  return {
    port: boundPort,
    address: boundAddress,
    token,
    discoveryPath,
    close,
  };
}

/** Map a capability error onto a status a `fetch()` caller can branch on. */
function statusFor(result: InvokeResult): number {
  if (result.ok) return 200;
  switch (result.error.code) {
    case 'not_found':
      return 404;
    case 'invalid_input':
    case 'domain_invalid':
      return 400;
    case 'permission_denied':
    case 'confirmation_required':
    case 'confirmation_invalid':
      return 403;
    case 'conflict':
      return 409;
    case 'rate_limited':
      return 429;
    case 'unavailable':
      return 503;
    default:
      return 500;
  }
}
