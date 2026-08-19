import { app } from 'electron';
import { IPC, type AppInfo } from '@shared/ipc';
import { createConsole } from './create-console.js';

const desktop = createConsole({
  name: 'teletubby',

  registerIpc({ ipc }) {
    ipc.register<void, AppInfo>({
      channel: IPC.appInfo,
      handle: () => ({
        name: app.getName(),
        version: app.getVersion(),
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node,
        platform: process.platform,
      }),
    });
  },

  onReady({ windows, logger }) {
    // Wide by default — three columns need the horizontal room, and this is a
    // surface you drive from across the room, not a utility panel.
    windows.create({ width: 1440, height: 900 });
    logger.info('prompter window opened');
  },
});

void desktop.start();
