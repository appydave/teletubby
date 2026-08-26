#!/usr/bin/env node
/**
 * `teletubby` — a thin CLI over the running app's control surface.
 *
 * DELIBERATELY STUPID. Every command is a `fetch()` against
 * http://127.0.0.1:7111; there is no business logic in this file and there
 * never should be. Open Design's CLI is 10,394 lines and holds none either —
 * that is what makes it impossible for the CLI and the UI to drift apart.
 *
 * What it is NOT: a second way to do things. If a verb is missing here it is
 * missing from the capability catalog, and that is where to add it.
 *
 *   teletubby health
 *   teletubby capabilities
 *   teletubby call get_set
 *   teletubby call get_script --input '{"scriptId":"kybernesis-phase-1/01"}'
 *   teletubby call score_transcript --input '{"scriptId":"…","transcriptId":"v01-rewrite","talentId":"david"}'
 *
 * The app must be running. That is inherent, not a defect — the control surface
 * lives inside the window's process, and the health route says so plainly
 * rather than letting a caller guess.
 */

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const DEFAULT_PORT = 7111;

/**
 * Discovery, in the order a caller would expect: explicit env, then the file
 * the running app wrote. The port and token are resolved from ONE source so
 * they cannot disagree with what the app is actually serving.
 */
function discover() {
  const path =
    process.env.TELETUBBY_CONTROL_FILE ??
    join(homedir(), 'Library', 'Application Support', 'teletubby', 'control.json');

  let file = {};
  try {
    file = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    // Absent is normal — the app may simply not be running. Say so later, with
    // the path, rather than failing here with a stack trace.
  }

  return {
    url: process.env.TELETUBBY_URL ?? `http://127.0.0.1:${file.port ?? DEFAULT_PORT}`,
    token: process.env.TELETUBBY_TOKEN ?? file.token ?? null,
    path,
  };
}

const die = (message, code = 1) => {
  process.stderr.write(`${message}\n`);
  process.exit(code);
};

const print = (value) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);

async function request(method, route, body) {
  const { url, token, path } = discover();
  if (!token && route !== '/api/health')
    die(
      `No control token. Is Teletubby running?\n` +
        `  looked in: ${path}\n` +
        `  override with TELETUBBY_TOKEN / TELETUBBY_URL`,
    );

  let response;
  try {
    response = await fetch(`${url}${route}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    die(`Cannot reach Teletubby at ${url} — is the app running?\n  ${error.message}`);
  }

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    die(`Teletubby returned non-JSON (${response.status}):\n${text}`);
  }
  return { status: response.status, payload };
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) flags[argv[i].slice(2)] = argv[++i];
    else positional.push(argv[i]);
  }
  return { positional, flags };
}

const USAGE = `teletubby — drive the running Teletubby app

  health                       Is the app up? (no token needed)
  capabilities                 Every verb this surface exposes, with its contract
  call <capability> [--input <json>] [--idempotency-key <key>]

  Input ALWAYS goes in --input. A bare JSON positional is refused, not ignored.
    teletubby call get_script --input '{"scriptId":"kybernesis-phase-1/01"}'

  "capabilities" is the authority on what exists — it is generated from the
  same catalog the gate enforces, so it cannot drift from the app. It does not
  yet publish per-verb INPUT shapes; until it does, read src/core/handlers.ts.

Environment:
  TELETUBBY_URL           default http://127.0.0.1:${DEFAULT_PORT}
  TELETUBBY_TOKEN         default: read from the running app's control.json
  TELETUBBY_CONTROL_FILE  where to find that file
`;

const { positional, flags } = parseArgs(process.argv.slice(2));
const [command, ...rest] = positional;

switch (command) {
  case undefined:
  case 'help':
  case '--help':
  case '-h':
    process.stdout.write(USAGE);
    break;

  case 'health': {
    const { status, payload } = await request('GET', '/api/health');
    print(payload);
    process.exit(status === 200 ? 0 : 1);
    break;
  }

  case 'capabilities': {
    const { payload } = await request('GET', '/api/capabilities');
    print(payload);
    break;
  }

  case 'call': {
    const capability = rest[0];
    if (!capability) die(`Which capability? Run "teletubby capabilities" to list them.`);

    /*
     * ⚠️ REFUSE A STRAY POSITIONAL RATHER THAN DROPPING IT.
     *
     * The input goes in `--input`, and a bare `teletubby call get_set '{...}'`
     * used to be parsed as a second positional and silently discarded. The call
     * then came back `not_found: no set specified` — which reads exactly like
     * "that set does not exist", so the caller goes looking for missing data
     * instead of for their own vanished argument. Absence and failure must
     * never look the same. This already cost one session real time.
     */
    const stray = rest.slice(1);
    if (stray.length) {
      const looksLikeJson = stray[0].trimStart().startsWith('{');
      die(
        `Unexpected argument ${JSON.stringify(stray[0])} after "${capability}".` +
          (looksLikeJson
            ? `\n\nInput goes in --input, or it is ignored:\n  teletubby call ${capability} --input '${stray[0]}'`
            : `\n\n${USAGE}`),
      );
    }

    let input = {};
    if (flags.input) {
      try {
        input = JSON.parse(flags.input);
      } catch (error) {
        die(`--input is not valid JSON: ${error.message}`);
      }
    }
    const { status, payload } = await request('POST', '/api/invoke', {
      capability,
      input,
      idempotencyKey: flags['idempotency-key'],
    });
    print(payload);
    // Exit non-zero on failure so a script can branch without parsing the body.
    process.exit(status >= 400 ? 1 : 0);
    break;
  }

  default:
    die(`Unknown command "${command}".\n\n${USAGE}`);
}
