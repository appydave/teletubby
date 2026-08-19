/**
 * THE REPOSITORY — where script sets and talents actually live.
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

export interface RepositoryDocument {
  /** Bumped when the on-disk shape changes; read before trusting the contents. */
  version: 1;
  sets: ScriptSet[];
  talents: Talent[];
}

export const EMPTY_DOCUMENT: RepositoryDocument = {
  version: 1,
  sets: [],
  talents: [],
};

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

  constructor(seed: RepositoryDocument = EMPTY_DOCUMENT) {
    this.document = clone(seed);
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
      const { document, result } = fn(clone(this.document));
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

  read(): Promise<RepositoryDocument> {
    return this.store.read();
  }

  async update<T>(
    fn: (document: RepositoryDocument) => {
      document: RepositoryDocument;
      result: T;
    },
  ): Promise<T> {
    let captured: T;
    await this.store.update((current) => {
      const { document, result } = fn(current);
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
