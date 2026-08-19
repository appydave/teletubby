import { app } from 'electron';
import { join } from 'node:path';
import { IPC, type AppInfo, type ControlStatus, type InvokePayload } from '@shared/ipc';
import type { InvokeResult } from '@shared/capabilities';
import { KYBERNESIS_PHASE_1, TALENTS } from '@shared/script-set';
import { FileRepository, createCore, seed, type Core } from '../core/index.js';
import { startControlServer, type ControlServerHandle } from './control-server.js';
import { createConsole } from './create-console.js';

let core: Core | null = null;
let control: ControlServerHandle | null = null;

const desktop = createConsole({
  name: 'teletubby',

  registerIpc({ ipc, logger }) {
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

    /**
     * The renderer's door onto the capability core — the same core the agent
     * reaches over HTTP, with the `ui` principal instead of `agent`.
     *
     * The principal is hard-coded here and is NOT read from the payload. A
     * renderer that could name its own principal could name itself anything.
     */
    ipc.register<InvokePayload, InvokeResult>({
      channel: IPC.controlInvoke,
      handle: async (payload) => {
        if (!core)
          return {
            ok: false,
            error: {
              code: 'unavailable',
              message: 'the capability core is not ready yet',
            },
          };
        if (!payload || typeof payload.capability !== 'string')
          return {
            ok: false,
            error: {
              code: 'invalid_input',
              message: '"capability" must be a string',
            },
          };
        return core.invoke(payload.capability, payload.input ?? {}, {
          principal: 'ui',
          idempotencyKey: payload.idempotencyKey,
        });
      },
    });

    ipc.register<void, ControlStatus>({
      channel: IPC.controlStatus,
      // The token is deliberately absent. The renderer has no use for it, and a
      // secret that reaches the DOM is a secret in the devtools.
      handle: () => ({
        running: control !== null,
        port: control?.port ?? null,
        discoveryPath: control?.discoveryPath ?? null,
      }),
    });

    logger.info('capability surface registered on the IPC bridge');
  },

  async onReady({ windows, logger }) {
    const userData = app.getPath('userData');

    // The generated set is the SEED, not the live copy. Seeding never
    // overwrites — an agent's trigger set written yesterday survives today's
    // build, which would not be true if the bundle were the source of truth.
    const repository = new FileRepository(join(userData, 'teletubby.json'));
    core = createCore({
      repository,
      auditSink: (entry) =>
        logger.info(
          {
            principal: entry.principal,
            capability: entry.capability,
            ok: entry.ok,
            errorCode: entry.errorCode,
            dryRun: entry.dryRun,
          },
          'capability',
        ),
    });

    const seeded = await seed(repository, [KYBERNESIS_PHASE_1], TALENTS);
    if (seeded.setsAdded.length > 0 || seeded.talentsAdded.length > 0)
      logger.info(seeded, 'seeded store');

    try {
      control = await startControlServer({
        core,
        userDataPath: userData,
        appVersion: app.getVersion(),
        log: (message, detail) => logger.info({ detail }, message),
      });
    } catch (error) {
      // The window still opens. A prompter that cannot be driven by an agent is
      // degraded; a prompter that will not start is useless, and the talent may
      // be about to record.
      control = null;
      logger.error({ error }, 'control surface failed to start — the app is UI-only this session');
    }

    // Wide by default — three columns need the horizontal room, and this is a
    // surface you drive from across the room, not a utility panel.
    windows.create({ width: 1440, height: 900 });
    logger.info('prompter window opened');
  },
});

desktop.lifecycle.onStop(async () => {
  await control?.close();
  control = null;
});

void desktop.start();
