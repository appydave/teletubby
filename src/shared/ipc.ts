/**
 * The typed IPC contract — the single source of truth for every channel that
 * crosses the renderer↔main boundary.
 *
 * The surface is deliberately tiny, and it stays tiny as capabilities grow:
 * ONE channel carries every verb. That is not laziness, it is the point — a
 * channel per feature is how an app ends up with forty-six verbs that terminate
 * inside its own window and nothing outside can reach. Here the renderer is a
 * client of the same capability core an agent talks to, with the `ui` principal
 * instead of `agent`.
 *
 *   renderer ── control:invoke ──► main ──► core.invoke(…, {principal:'ui'})
 *   agent    ── POST /api/invoke ─► main ──► core.invoke(…, {principal:'agent'})
 *
 * The principal is decided in MAIN, never sent by the caller. A renderer that
 * could name its own principal could name itself `ui` from a compromised page.
 */

import type { InvokeResult } from './capabilities.js';

export const IPC = {
  appInfo: 'app:info',
  /** Every capability, for the `ui` principal. See `src/core/index.ts`. */
  controlInvoke: 'control:invoke',
  /** Where the agent surface is listening, so the UI can show it to David. */
  controlStatus: 'control:status',
} as const;

export interface AppInfo {
  name: string;
  version: string;
  electron: string;
  chrome: string;
  node: string;
  platform: NodeJS.Platform;
}

export interface ControlStatus {
  running: boolean;
  port: number | null;
  /**
   * The path an agent reads the token from. The TOKEN ITSELF never crosses this
   * bridge — the renderer has no use for it, and a secret that reaches the DOM
   * is a secret in the devtools.
   */
  discoveryPath: string | null;
}

export interface InvokePayload {
  capability: string;
  input?: unknown;
  idempotencyKey?: string;
}

/** The API exposed to the renderer on `window.appytron`. */
export interface AppytronApi {
  getAppInfo(): Promise<AppInfo>;
  invoke<T = unknown>(payload: InvokePayload): Promise<InvokeResult<T>>;
  getControlStatus(): Promise<ControlStatus>;
}
