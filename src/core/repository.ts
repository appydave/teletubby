/**
 * THE REPOSITORY — where script sets, talents and rigs actually live.
 *
 * The proof of concept compiled the scripts into the renderer bundle, which was
 * right while nothing could change them. `create`, `edit`, `write` and `update`
 * are published verbs now, so the data has to outlive a window.
 *
 * Two implementations, one interface:
 *
 *   MemoryRepository — tests. No disk, no Electron, no app.
 *   FileRepository   — one JSON document, atomically written, serialised
 *                      through @appydave/core's Store so concurrent updates
 *                      from the UI and an agent cannot lose a write.
 *
 * Seeding: on first read the file store is empty, and the caller seeds it with
 * the generated Kybernesis set. The generated data is the SEED, never the live
 * copy — otherwise an agent's edit is silently reverted by the next build.
 */

import { createStore, type Store } from '@appydave/core';
import type { ScriptSet, SetId, Talent, TalentId } from '@shared/domain';
import { EMPTY_WORKSPACE, type Rig, type Workspace } from '@shared/rig';

export interface RepositoryDocument {
  /** Bumped when the on-disk shape changes; read before trusting the contents. */
  version: 2;
  sets: ScriptSet[];
  talents: Talent[];
  /** Named arrangements — see `src/shared/rig.ts`. */
  rigs: Rig[];
  /** The layout the talent last had on screen, restored on the next launch. */
  workspace: Workspace;
}

export const EMPTY_DOCUMENT: RepositoryDocument = {
  version: 2,
  sets: [],
  talents: [],
  rigs: [],
  workspace: EMPTY_WORKSPACE,
};

/**
 * Bring a document read from disk up to the current shape.
 *
 * v1 files have no `rigs` and no `workspace`, and there are real ones on real
 * machines — the store is the talent's working copy and predates this feature.
 * Filling the gaps on READ rather than in a migration step means there is no
 * moment where an old file is unreadable, and no upgrade that can half-run.
 *
 * It only ever ADDS. A document that already has rigs comes back untouched,
 * for the same reason seeding never overwrites.
 */
export function normalizeDocument(
  raw: Partial<RepositoryDocument> | undefined,
): RepositoryDocument {
  return {
    version: 2,
    sets: raw?.sets ?? [],
    talents: raw?.talents ?? [],
    rigs: raw?.rigs ?? [],
    workspace: raw?.workspace ?? { ...EMPTY_WORKSPACE },
  };
}

export interface Repository {
  read(): Promise<RepositoryDocument>;
  /** Read → mutate → write, serialised end-to-end. The only way to change data. */
  update<T>(
    fn: (document: RepositoryDocument) => {
      document: RepositoryDocument;
      result: T;
    },
  ): Promise<T>;
}

/** Structured clone, so a caller cannot mutate what the store handed back. */
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export class MemoryRepository implements Repository {
  private document: RepositoryDocument;
  /** Serialises updates the same way the file store does. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(seed: Partial<RepositoryDocument> = EMPTY_DOCUMENT) {
    this.document = normalizeDocument(clone(seed));
  }

  async read(): Promise<RepositoryDocument> {
    return clone(this.document);
  }

  async update<T>(
    fn: (document: RepositoryDocument) => {
      document: RepositoryDocument;
      result: T;
    },
  ): Promise<T> {
    const run = this.queue.then(() => {
      const { document, result } = fn(normalizeDocument(clone(this.document)));
      this.document = clone(document);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run as Promise<T>;
  }
}

export class FileRepository implements Repository {
  private readonly store: Store<RepositoryDocument>;

  constructor(path: string) {
    this.store = createStore<RepositoryDocument>({
      path,
      defaults: EMPTY_DOCUMENT,
      // 0600: this is the talent's working script set, on a personal machine.
      write: { mode: 0o600 },
    });
  }

  async read(): Promise<RepositoryDocument> {
    return normalizeDocument(await this.store.read());
  }

  async update<T>(
    fn: (document: RepositoryDocument) => {
      document: RepositoryDocument;
      result: T;
    },
  ): Promise<T> {
    let captured: T;
    await this.store.update((current) => {
      const { document, result } = fn(normalizeDocument(current));
      captured = result;
      return document;
    });
    return captured!;
  }
}

/* ------------------------------------------------------------------ *
 * Seeding
 * ------------------------------------------------------------------ */

/**
 * Add anything the store does not already have, and touch nothing it does.
 *
 * The rule that matters: seeding NEVER overwrites. An agent that rewrote a
 * trigger set yesterday must still find it there today, and the shipped data is
 * the starting point, not the truth.
 */
export async function seed(
  repository: Repository,
  sets: ScriptSet[],
  talents: Talent[],
): Promise<{ setsAdded: SetId[]; talentsAdded: TalentId[] }> {
  return repository.update((document) => {
    const setsAdded: SetId[] = [];
    const talentsAdded: TalentId[] = [];

    for (const set of sets) {
      if (document.sets.some((existing) => existing.id === set.id)) continue;
      document.sets.push(clone(set));
      setsAdded.push(set.id);
    }
    for (const talent of talents) {
      if (document.talents.some((existing) => existing.id === talent.id)) continue;
      document.talents.push(clone(talent));
      talentsAdded.push(talent.id);
    }

    return { document, result: { setsAdded, talentsAdded } };
  });
}
