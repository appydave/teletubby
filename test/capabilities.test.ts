import { beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { KYBERNESIS_PHASE_1, TALENTS } from '@shared/script-set';
import { validateScriptSet } from '@shared/domain';
import { FileRepository, MemoryRepository, createCore, seed, type Core } from '@core/index';

/**
 * The verbs, doing their jobs.
 *
 * The one that matters most is `write_trigger_set`. Requirements §5 reads as
 * though the app derives the three trigger styles itself; it does not. A/B/C is
 * a DATA problem — the styles have to be filled with data by an agent, and the
 * app's job is to expose the surface and switch between what it has been given.
 * This file is where that promise is either kept or not.
 */

const SET = 'kybernesis-phase-1';
const SCRIPT = 'kybernesis-phase-1/01';

let core: Core;

const call = (capability: string, input: unknown = {}) =>
  core.invoke(capability, input, { principal: 'agent' });

const unwrap = <T = Record<string, unknown>>(result: Awaited<ReturnType<Core['invoke']>>): T => {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.data as T;
};

const fresh = (): Core =>
  createCore({
    repository: new MemoryRepository({
      version: 1,
      sets: [JSON.parse(JSON.stringify(KYBERNESIS_PHASE_1))],
      talents: JSON.parse(JSON.stringify(TALENTS)),
    }),
  });

beforeEach(() => {
  core = fresh();
});

describe('reading', () => {
  it('lists the set, and every script carries a summary', () => {
    // Fear of a batch you have not read is the first thing Teletubby has to
    // solve (requirements §6), and this query is the whole of it.
    return call('get_set', { setId: SET }).then((result) => {
      const set = unwrap<{
        scripts: { summary: string; transcripts: unknown[] }[];
      }>(result);
      expect(set.scripts).toHaveLength(12);
      expect(set.scripts.every((s) => s.summary.length > 0)).toBe(true);
    });
  });

  it('does not dump full transcripts into the set view', async () => {
    // Scannable in one sitting means the set view has to stay small.
    const set = unwrap(await call('get_set', { setId: SET }));
    expect(JSON.stringify(set)).not.toContain('So here');
  });

  it('exposes both corpora and says which is which', async () => {
    const script = unwrap<{
      script: { transcripts: { id: string; kind: string }[] };
    }>(await call('get_script', { setId: SET, scriptId: SCRIPT }));
    expect(script.script.transcripts.map((t) => `${t.kind}:${t.id}`)).toEqual([
      'provenance:tom-original',
      'cadence:v01-rewrite',
    ]);
  });

  it('hands back the available ids when one is wrong', async () => {
    const result = await call('get_script', { setId: SET, scriptId: 'nope' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('not_found');
      // Never make the caller guess an id it has no way to obtain.
      expect((result.error.details as { available: string[] }).available).toContain(SCRIPT);
    }
  });
});

describe('write_trigger_set — the verb A/B/C depends on', () => {
  const paragraphIds = ['p1', 'p2', 'p3', 'p4'];

  const styleA = {
    setId: SET,
    scriptId: SCRIPT,
    transcriptId: 'tom-original',
    style: 'near-verbatim',
    triggers: [
      { text: "you've got an AI assistant at work", paragraphId: 'p1' },
      { text: 'can it actually go and do the job?', paragraphId: 'p1' },
      { text: 'a full agent system', paragraphId: 'p2' },
      { text: 'take an action on your behalf', paragraphId: 'p2' },
      { text: 'one problem genuinely worth solving', paragraphId: 'p3' },
      { text: 'memory, permissions, tools, coordination', paragraphId: 'p3' },
      { text: 'start small without thinking small', paragraphId: 'p4' },
    ],
  };

  it('authors a style the app did not have, and does not disturb the one it did', async () => {
    const written = unwrap<{ applied: boolean; previous: unknown }>(
      await call('write_trigger_set', styleA),
    );
    expect(written.applied).toBe(true);
    expect(written.previous).toBeNull();

    const transcript = unwrap<{
      transcript: { triggerSets: { style: string }[] };
    }>(
      await call('get_transcript', {
        setId: SET,
        scriptId: SCRIPT,
        transcriptId: 'tom-original',
      }),
    );
    expect(transcript.transcript.triggerSets.map((t) => t.style).sort()).toEqual([
      'compressed-concept',
      'near-verbatim',
    ]);
  });

  it('lets each style keep its own step count over the same paragraphs', async () => {
    // The correction gap 1 asked for. Style A takes seven steps over the four
    // paragraphs that style C crosses in two; with the map on the SCRIPT this
    // was unrepresentable.
    await call('write_trigger_set', styleA);
    await call('write_trigger_set', {
      ...styleA,
      style: 'loose-keywords',
      triggers: [
        { text: 'THE GAP', paragraphId: 'p1' },
        { text: 'START SMALL', paragraphId: 'p4' },
      ],
    });

    const a = unwrap<{ triggerSet: { triggers: unknown[] } }>(
      await call('get_trigger_set', { ...styleA, style: 'near-verbatim' }),
    );
    const c = unwrap<{ triggerSet: { triggers: unknown[] } }>(
      await call('get_trigger_set', { ...styleA, style: 'loose-keywords' }),
    );
    expect(a.triggerSet.triggers).toHaveLength(7);
    expect(c.triggerSet.triggers).toHaveLength(2);
  });

  it('refuses a map that points at a paragraph that is not there', async () => {
    // A wrong sync is worse than none, so it is refused at the door rather
    // than discovered mid-take.
    const result = await call('write_trigger_set', {
      ...styleA,
      triggers: [
        { text: 'open', paragraphId: 'p1' },
        { text: 'nowhere', paragraphId: 'p99' },
        { text: 'land', paragraphId: 'p4' },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('domain_invalid');
      expect(JSON.stringify(result.error.details)).toMatch(/not in this transcript/);
    }
  });

  it('refuses a map that rewinds', async () => {
    const result = await call('write_trigger_set', {
      ...styleA,
      triggers: [
        { text: 'open', paragraphId: 'p1' },
        { text: 'ahead', paragraphId: 'p3' },
        { text: 'back', paragraphId: 'p2' },
        { text: 'land', paragraphId: 'p4' },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(JSON.stringify(result.error.details)).toMatch(/backwards/);
  });

  it('records that an agent authored it, so a bad set can be traced', async () => {
    unwrap(await call('write_trigger_set', styleA));
    const set = unwrap<{ triggerSet: { authoredBy: string } }>(
      await call('get_trigger_set', { ...styleA, style: 'near-verbatim' }),
    );
    expect(set.triggerSet.authoredBy).toBe('agent');
  });

  it('replaces a style and returns what it replaced', async () => {
    unwrap(await call('write_trigger_set', styleA));
    const replaced = unwrap<{ previous: { triggers: unknown[] } }>(
      await call('write_trigger_set', {
        ...styleA,
        triggers: styleA.triggers.slice(0, 2).concat({ text: 'land', paragraphId: 'p4' }),
      }),
    );
    expect(replaced.previous.triggers).toHaveLength(7);
  });

  it('mints trigger ids when the caller does not supply them', async () => {
    unwrap(await call('write_trigger_set', styleA));
    const set = unwrap<{ triggerSet: { triggers: { id: string }[] } }>(
      await call('get_trigger_set', { ...styleA, style: 'near-verbatim' }),
    );
    expect(set.triggerSet.triggers.map((t) => t.id)).toEqual([
      'g1',
      'g2',
      'g3',
      'g4',
      'g5',
      'g6',
      'g7',
    ]);
    expect(paragraphIds).toContain(set.triggerSet.triggers[0].paragraphId);
  });
});

describe('write_transcript — the second corpus arrives this way', () => {
  it('adds a cadence transcript with its own paragraph structure', async () => {
    const written = unwrap<{
      applied: boolean;
      transcript: { topics: unknown[] };
    }>(
      await call('write_transcript', {
        setId: SET,
        scriptId: 'kybernesis-phase-1/04',
        id: 'v04-rewrite',
        kind: 'cadence',
        corpus: 'v04-rewrite',
        talentId: 'david',
        source: 'hand-rewritten against the gate',
        topics: [
          {
            heading: 'What Arcana is',
            minors: [
              {
                heading: 'What Arcana is',
                paragraphs: [
                  {
                    text: 'Arcana is the memory layer under the agents, and that matters more than it sounds.',
                  },
                ],
              },
            ],
          },
          {
            heading: 'The payoff',
            minors: [
              {
                heading: 'The payoff',
                paragraphs: [
                  {
                    text: 'It helps an agent remember the right things in a useful, governed form.',
                  },
                ],
              },
            ],
          },
        ],
      }),
    );
    expect(written.applied).toBe(true);
    expect(written.transcript.topics).toHaveLength(2);
  });

  it('refuses a cadence transcript with no talent', async () => {
    const result = await call('write_transcript', {
      setId: SET,
      scriptId: 'kybernesis-phase-1/04',
      id: 'orphan',
      kind: 'cadence',
      corpus: 'orphan',
      talentId: null,
      source: 'nowhere',
      topics: [
        {
          heading: 'x',
          minors: [{ heading: 'y', paragraphs: [{ text: 'z z z' }] }],
        },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('domain_invalid');
      expect(JSON.stringify(result.error.details)).toMatch(/must name the talent/);
    }
  });
});

describe('score_transcript', () => {
  it('scores a stored transcript against a named talent', async () => {
    const result = unwrap<{ score: { pass: boolean } }>(
      await call('score_transcript', {
        setId: SET,
        scriptId: SCRIPT,
        transcriptId: 'v01-rewrite',
        talentId: 'david',
      }),
    );
    expect(result.score.pass).toBe(true);
  });

  it('refuses to score against a talent who has no measured envelope', async () => {
    // The rule that keeps the gate meaningful: thresholds are per talent and
    // are never ported. Scoring Alex against David's numbers would produce a
    // confident wrong answer, which is worse than no answer.
    const result = await call('score_transcript', {
      setId: SET,
      scriptId: SCRIPT,
      transcriptId: 'tom-original',
      talentId: 'alex',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('not_found');
      expect(result.error.message).toMatch(/belongs to one person/);
    }
  });
});

describe('the repository', () => {
  it('never overwrites what is already there when seeding', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'teletubby-'));
    try {
      const repository = new FileRepository(join(directory, 'store.json'));
      await seed(repository, [KYBERNESIS_PHASE_1], TALENTS);

      const live = createCore({ repository });
      await live.invoke(
        'update_script',
        { setId: SET, scriptId: SCRIPT, title: 'David renamed this' },
        { principal: 'ui' },
      );

      // The generated set is the SEED, not the live copy. Re-seeding after a
      // rebuild must not silently revert an agent's or a human's edit.
      const again = await seed(repository, [KYBERNESIS_PHASE_1], TALENTS);
      expect(again.setsAdded).toEqual([]);

      const document = await repository.read();
      expect(document.sets[0].scripts[0].title).toBe('David renamed this');
      expect(validateScriptSet(document.sets[0])).toEqual([]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('serialises concurrent writes rather than losing one', async () => {
    // The classic read-modify-write race. The UI and an agent both write, and
    // neither is aware of the other.
    await Promise.all([
      core.invoke('create_set', { id: 'a', title: 'A' }, { principal: 'ui' }),
      core.invoke('create_set', { id: 'b', title: 'B' }, { principal: 'agent' }),
      core.invoke('create_set', { id: 'c', title: 'C' }, { principal: 'agent' }),
    ]);
    const sets = unwrap<{ sets: { id: string }[] }>(await call('list_sets'));
    expect(sets.sets.map((s) => s.id).sort()).toEqual(['a', 'b', 'c', SET]);
  });

  it('hands back a copy, so a caller cannot mutate the store by accident', async () => {
    const first = unwrap<{ script: { title: string } }>(
      await call('get_script', { setId: SET, scriptId: SCRIPT }),
    );
    first.script.title = 'mutated in place';
    const second = unwrap<{ script: { title: string } }>(
      await call('get_script', { setId: SET, scriptId: SCRIPT }),
    );
    expect(second.script.title).toBe('What Kybernesis actually builds');
  });
});
