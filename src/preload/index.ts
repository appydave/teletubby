import { contextBridge, ipcRenderer } from 'electron';
import {
  IPC,
  type AppInfo,
  type AppytronApi,
  type ControlChanged,
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
  onControlChanged: (listener) => {
    // The listener never sees the raw IpcRendererEvent — handing the renderer
    // an object with a `sender` on it would punch a hole straight through
    // contextIsolation.
    const wrapped = (_event: unknown, payload: ControlChanged): void => listener(payload);
    ipcRenderer.on(IPC.controlChanged, wrapped);
    return () => ipcRenderer.removeListener(IPC.controlChanged, wrapped);
  },
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
