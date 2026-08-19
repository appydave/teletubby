import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { KYBERNESIS_PHASE_1, TALENTS } from '@shared/script-set';
import { MemoryRepository, createCore } from '@core/index';
import { startControlServer, type ControlServerHandle } from '../src/main/control-server';

/**
 * The control surface, over real HTTP.
 *
 * Everything else in this suite drives `core.invoke` in process. This file is
 * the one that proves the promise an agent actually depends on: that a
 * different process, holding nothing but a port and a token, can drive the app.
 *
 * It runs with no Electron — the server only needs `node:http` and a userData
 * path — which is itself the point. A capability that needed the window would
 * be unreachable from here, and this test would say so.
 */

let handle: ControlServerHandle;
let directory: string;
const base = (): string => `http://127.0.0.1:${handle.port}`;

const post = async (
  body: unknown,
  token = handle.token,
): Promise<{ status: number; body: any }> => {
  const response = await fetch(`${base()}/api/invoke`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
};

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'teletubby-control-'));
  handle = await startControlServer({
    core: createCore({
      repository: new MemoryRepository({
        version: 1,
        sets: [JSON.parse(JSON.stringify(KYBERNESIS_PHASE_1))],
        talents: JSON.parse(JSON.stringify(TALENTS)),
      }),
    }),
    userDataPath: directory,
    appVersion: '0.1.0-test',
    // Port 0 lets the OS pick, so the suite never collides with a running app
    // on 7111 — including David's.
    port: 0,
  });
});

afterAll(async () => {
  await handle.close();
  rmSync(directory, { recursive: true, force: true });
});

describe('addressing', () => {
  it('writes one discovery file the CLI and the UI both read', () => {
    // Captain's Log hardcodes its port in three uncoordinated places and the
    // extension can reach a port it has no way to learn. One source, or the
    // config and the app disagree and nothing errors.
    const discovered = JSON.parse(readFileSync(handle.discoveryPath, 'utf8'));
    expect(discovered.port).toBe(handle.port);
    expect(discovered.token).toBe(handle.token);
    expect(discovered.pid).toBe(process.pid);
  });

  it('answers health without a token, so a caller can tell "down" from "denied"', async () => {
    const response = await fetch(`${base()}/api/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, app: 'teletubby' });
  });

  it('refuses everything else without the token', async () => {
    const response = await fetch(`${base()}/api/capabilities`);
    expect(response.status).toBe(401);
    const body = await response.json();
    // Says WHERE to get the token rather than just "unauthorized".
    expect(body.error.message).toContain(handle.discoveryPath);
  });

  it('refuses a wrong token', async () => {
    const { status } = await post({ capability: 'list_sets' }, 'deadbeef'.repeat(8));
    expect(status).toBe(401);
  });
});

describe('the surface an agent sees', () => {
  it('describes itself', async () => {
    const response = await fetch(`${base()}/api/capabilities`, {
      headers: { authorization: `Bearer ${handle.token}` },
    });
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.principal).toBe('agent');
    expect(body.data.capabilities.map((c: { name: string }) => c.name)).toContain('get_set');
  });

  it('can do what the UI can do, against the same store', async () => {
    // The bar is not "an API exists". It is "can the agent do what the UI can
    // do, with no window open".
    const written = await post({
      capability: 'write_trigger_set',
      input: {
        setId: 'kybernesis-phase-1',
        scriptId: 'kybernesis-phase-1/01',
        transcriptId: 'tom-original',
        style: 'loose-keywords',
        triggers: [
          { text: 'THE GAP', paragraphId: 'p1' },
          { text: 'START SMALL', paragraphId: 'p4' },
        ],
      },
    });
    expect(written.status).toBe(200);
    expect(written.body.data.applied).toBe(true);

    const read = await post({
      capability: 'get_trigger_set',
      input: {
        setId: 'kybernesis-phase-1',
        scriptId: 'kybernesis-phase-1/01',
        transcriptId: 'tom-original',
        style: 'loose-keywords',
      },
    });
    expect(read.body.data.triggerSet.triggers).toHaveLength(2);
  });

  it('cannot name its own principal', async () => {
    // The principal is decided by the transport, not sent by the caller.
    const { status, body } = await post({
      capability: 'approve_pending',
      input: { pendingId: 'x' },
      principal: 'ui',
    });
    expect(status).toBe(403);
    expect(body.error.code).toBe('permission_denied');
  });
});

describe('errors an agent can branch on', () => {
  it('maps capability failures onto meaningful status codes', async () => {
    const notFound = await post({
      capability: 'get_script',
      input: { setId: 'nope' },
    });
    expect(notFound.status).toBe(404);

    const invalid = await post({ capability: 'get_talent', input: {} });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('invalid_input');

    const conflict = await post({
      capability: 'create_set',
      input: { id: 'kybernesis-phase-1', title: 'again' },
    });
    expect(conflict.status).toBe(409);
  });

  it('rejects a request with no capability named', async () => {
    const { status, body } = await post({ input: {} });
    expect(status).toBe(400);
    expect(body.error.code).toBe('invalid_input');
  });

  it('lists its routes when asked for one that does not exist', async () => {
    const response = await fetch(`${base()}/api/nope`, {
      headers: { authorization: `Bearer ${handle.token}` },
    });
    expect(response.status).toBe(404);
    expect((await response.json()).error.details.routes).toContain('POST /api/invoke');
  });
});

describe('binding', () => {
  it('is bound to loopback and nothing else', () => {
    // An unattended local surface with write verbs on it. Binding wider would
    // publish those verbs to the network.
    expect(handle.address).toBe('127.0.0.1');
  });

  // ⚠️ What this does NOT establish: that a firewall, another process, or a
  // future refactor cannot expose the port. It establishes only that THIS
  // server asked the kernel for loopback and got it. A client-side probe of
  // 0.0.0.0 would not add anything — macOS resolves that to localhost for an
  // outbound connection, so it succeeds against a loopback-bound socket and
  // reads as a failure when it is not one.
});
