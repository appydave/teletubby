/**
 * The typed IPC contract — the single source of truth for every channel that
 * crosses the renderer↔main boundary.
 *
 * Teletubby's proof of concept is a pure reading surface: the scripts are
 * compiled into the renderer bundle, so nothing about prompting needs main.
 * This surface stays deliberately tiny until something actually needs the
 * process boundary (recording hand-off, file-backed scripts).
 */

export const IPC = {
  appInfo: 'app:info',
} as const;

export interface AppInfo {
  name: string;
  version: string;
  electron: string;
  chrome: string;
  node: string;
  platform: NodeJS.Platform;
}

/** The API exposed to the renderer on `window.appytron`. */
export interface AppytronApi {
  getAppInfo(): Promise<AppInfo>;
}
