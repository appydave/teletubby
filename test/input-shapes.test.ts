import { beforeEach, describe, expect, it } from 'vitest';
import { KYBERNESIS_PHASE_1, TALENTS } from '@shared/script-set';
import { createCore, MemoryRepository, type Core } from '@core/index';

/**
 * describe_capabilities publishes per-verb INPUT SHAPES — field names, types,
 * required/optional, and notes — GENERATED from the same zod schemas the gate
 * validates with. One truth: the schema that refuses a bad call is the schema
 * that documents the call.
 *
 * Why this exists (2026-09-02): an agent discovered rename_set in the catalog
 * and could not discover that it takes a title, that project is refused after
 * attach, or that create_set grew a project field — "I can't see input shapes,
 * which is precisely the gap, and I'm not invoking a write verb to find out."
 * The only written shapes were a hand-transcribed table in SKILL.md — a second
 * truth, drifting the moment a field changed. That table is deleted; this is
 * the source now.
 */

interface Field {
  name: string;
  type: string;
  required: boolean;
  note?: string;
}
interface Entry {
  name: string;
  input: Field[];
}

let core: Core;

const capabilities = async (principal: 'agent' | 'ui' = 'agent'): Promise<Entry[]> => {
  const result = await core.invoke('describe_capabilities', {}, { principal });
  if (!result.ok) throw new Error(result.error.message);
  return (result.data as { capabilities: Entry[] }).capabilities;
};

const entry = async (id: string): Promise<Entry> => {
  const found = (await capabilities()).find((c) => c.name === id);
  if (!found) throw new Error(`capability "${id}" not published`);
  return found;
};

const field = (fields: Field[], name: string): Field => {
  const found = fields.find((f) => f.name === name);
  if (!found) throw new Error(`field "${name}" not published (have: ${fields.map((f) => f.name).join(', ')})`);
  return found;
};

beforeEach(() => {
  core = createCore({
    repository: new MemoryRepository({
      version: 1,
      sets: [JSON.parse(JSON.stringify(KYBERNESIS_PHASE_1))],
      talents: JSON.parse(JSON.stringify(TALENTS)),
    }),
  });
});

describe('every published verb carries an input array — absence is impossible', () => {
  it('publishes input for ALL capabilities, both principals', async () => {
    for (const principal of ['agent', 'ui'] as const) {
      for (const capability of await capabilities(principal)) {
        expect(Array.isArray(capability.input), `${capability.id} has no input array`).toBe(true);
      }
    }
  });

  it('a verb that takes nothing says so with an EMPTY array, not a missing key', async () => {
    expect((await entry('list_sets')).input).toEqual([]);
    expect((await entry('list_talents')).input).toEqual([]);
  });
});

describe('the shapes are the validator, not a transcription', () => {
  it('create_set publishes its project field, optional, with the FliHub note', async () => {
    const { input } = await entry('create_set');
    expect(field(input, 'id').required).toBe(true);
    expect(field(input, 'title').required).toBe(true);
    const project = field(input, 'project');
    expect(project.required).toBe(false);
    expect(project.type).toBe('string');
    expect(project.note).toMatch(/FliHub/);
  });

  it('rename_set publishes title and project, both optional, with the move refusal noted', async () => {
    const { input } = await entry('rename_set');
    expect(field(input, 'title').required).toBe(false);
    const project = field(input, 'project');
    expect(project.required).toBe(false);
    expect(project.note).toMatch(/move/i);
  });

  it('enums publish their actual values', async () => {
    const { input } = await entry('write_trigger_set');
    expect(field(input, 'style').type).toBe('enum(near-verbatim|compressed-concept|loose-keywords)');
    expect(field(input, 'triggers').type).toMatch(/^array</);
  });

  it('required fields read as required', async () => {
    const { input } = await entry('get_talent');
    expect(field(input, 'talentId')).toMatchObject({ required: true, type: 'string' });
  });

  it('the command envelope rides every write verb', async () => {
    for (const id of ['create_set', 'rename_set', 'write_transcript', 'delete_script']) {
      const { input } = await entry(id);
      expect(field(input, 'dryRun').required).toBe(false);
      expect(field(input, 'idempotencyKey').required).toBe(false);
    }
  });

  it('nested objects render their keys one level down', async () => {
    const { input } = await entry('save_rig');
    expect(field(input, 'layout').type).toMatch(/^object\{/);
    expect(field(input, 'layout').type).toMatch(/visible/);
  });
});
