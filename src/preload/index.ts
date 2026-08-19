import { contextBridge, ipcRenderer } from 'electron';
import {
  IPC,
  type AppInfo,
  type AppytronApi,
  type ControlStatus,
  type InvokePayload,
} from '../shared/ipc';
import type { InvokeResult } from '../shared/capabilities';

const api: AppytronApi = {
  getAppInfo: (): Promise<AppInfo> => ipcRenderer.invoke(IPC.appInfo),
  // One door, one verb. The renderer names a capability; main names the
  // principal. Adding a feature never widens this surface.
  invoke: <T>(payload: InvokePayload): Promise<InvokeResult<T>> =>
    ipcRenderer.invoke(IPC.controlInvoke, payload),
  getControlStatus: (): Promise<ControlStatus> => ipcRenderer.invoke(IPC.controlStatus),
};

// The ONLY door: expose a minimal, typed API on window.appytron.
// contextIsolation is on, so the renderer never sees Node or ipcRenderer directly.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('appytron', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // Fallback for the (non-default) case where contextIsolation is off.
  (globalThis as unknown as { window: { appytron: AppytronApi } }).window.appytron = api;
}
