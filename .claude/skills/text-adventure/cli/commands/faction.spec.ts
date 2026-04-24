import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleFaction } from './faction';
import { createDefaultState, saveState } from '../lib/state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-faction-test-'));
  process.env.TAG_STATE_DIR = tempDir;
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) process.env.TAG_STATE_DIR = originalEnv;
  else delete process.env.TAG_STATE_DIR;
});

describe('tag faction inspect', () => {
  test('returns standing, territory, relations, and related quests', async () => {
    const state = createDefaultState();
    state.factions = { survey_corp: 30, frontier_guild: -20 };
    state.worldData = {
      seed: 'faction-test',
      theme: 'space',
      mapName: 'Test Sector',
      rooms: {
        bridge: { id: 'bridge', name: 'Bridge', type: 'room', description: '', exits: [], loot: [], encounters: [] },
      },
      startRoom: 'bridge',
      bossRoom: 'bridge',
      factions: {
        factions: [
          { id: 'survey_corp', name: 'Survey Corp', ideology: 'Chart everything.', territory: ['bridge'] },
          { id: 'frontier_guild', name: 'Frontier Guild', ideology: 'Keep trade free.', territory: [] },
        ],
        relations: { survey_corp_frontier_guild: 'rivals' },
      },
      roster: [],
      hooks: { main: '', side: [], factionA: 'survey_corp', factionB: 'frontier_guild' },
      meta: { roomCount: 1, npcCount: 0, generatedAt: 0, generatorVersion: 1 },
    };
    state.codexMutations = [{ id: 'faction_survey_corp', title: 'Survey Corp', category: 'faction', state: 'partial' }];
    state.quests = [
      {
        id: 'q1',
        title: 'Broker Peace',
        status: 'active',
        objectives: [{ id: 'talk', description: 'Talk to both sides', completed: false }],
        clues: [],
        relatedFactionIds: ['survey_corp'],
      },
    ];
    await saveState(state);

    const result = await handleFaction(['inspect', 'survey_corp']);
    expect(result.ok).toBe(true);
    const data = result.data as {
      name: string;
      standingLabel: string;
      territory: string[];
      relations: Array<{ status: string }>;
      relatedQuests: Array<{ id: string }>;
    };
    expect(data.name).toBe('Survey Corp');
    expect(data.standingLabel).toBe('friendly');
    expect(data.territory).toEqual(['Bridge']);
    expect(data.relations[0]!.status).toBe('rivals');
    expect(data.relatedQuests[0]!.id).toBe('q1');
  });

  test('fails for unknown faction id', async () => {
    await saveState(createDefaultState());
    const result = await handleFaction(['inspect', 'missing']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('not found');
  });
});
