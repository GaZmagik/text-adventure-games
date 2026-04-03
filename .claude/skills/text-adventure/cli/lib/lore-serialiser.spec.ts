import { describe, test, expect } from 'bun:test';
import { createDefaultState } from './state-store';
import type { GmState, NpcMutation, Quest, CodexMutation, MapState, Pronouns, BestiaryTier } from '../types';
import {
  extractMechanicalData,
  encodeLorePayload,
  buildLoreMarkdown,
  extractLorePayload,
  extractFrontmatterField,
} from './lore-serialiser';
import { SCHEMA_VERSION } from './constants';
import { attachChecksum } from './fnv32';

// ── Helpers ──────────────────────────────────────────────────────────

function makeNpc(overrides: Partial<NpcMutation> = {}): NpcMutation {
  return {
    id: 'npc-kira', name: 'Kira Voss', pronouns: 'she/her' as Pronouns,
    role: 'Smuggler', tier: 'rival' as BestiaryTier, level: 3,
    stats: { STR: 10, DEX: 16, CON: 12, INT: 14, WIS: 10, CHA: 13 },
    modifiers: { STR: 0, DEX: 3, CON: 1, INT: 2, WIS: 0, CHA: 1 },
    hp: 22, maxHp: 22, ac: 14, soak: 1, damageDice: '1d8+3',
    status: 'active', alive: true, trust: 30, disposition: 'friendly',
    dispositionSeed: 42, ...overrides,
  };
}

function makeQuest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: 'q-main', title: 'Retrieve the Artifact',
    status: 'active',
    objectives: [{ id: 'o1', description: 'Find the vault', completed: false }],
    clues: ['A map fragment'], ...overrides,
  };
}

function makePopulatedState(): GmState {
  const state = createDefaultState();
  state.scene = 12;
  state.seed = 'abc123def456';
  state.theme = 'dark-fantasy';
  state.visualStyle = 'parchment';
  state.modulesActive = ['core-systems', 'bestiary', 'lore-codex'];
  state.character = {
    name: 'Aldric', class: 'Paladin', hp: 30, maxHp: 35, ac: 18,
    level: 5, xp: 2400, currency: 150, currencyName: 'gold',
    stats: { STR: 16, DEX: 10, CON: 14, INT: 12, WIS: 15, CHA: 13 },
    modifiers: { STR: 3, DEX: 0, CON: 2, INT: 1, WIS: 2, CHA: 1 },
    proficiencyBonus: 3, proficiencies: ['Athletics', 'Religion'],
    abilities: ['Divine Smite'], inventory: [{ name: 'Healing Potion', type: 'consumable', slots: 1 }],
    conditions: [], equipment: { weapon: 'Longsword', armour: 'Plate' },
  };
  state.rosterMutations = [makeNpc()];
  state.factions = { 'The Guild': 35, 'Shadow Court': -60 };
  state.quests = [makeQuest()];
  state.codexMutations = [
    { id: 'codex-1', state: 'discovered', discoveredAt: 5, via: 'investigation' },
  ];
  state.mapState = {
    currentZone: 'Citadel', visitedZones: ['Forest', 'Village', 'Citadel'],
    revealedZones: ['Forest', 'Village', 'Citadel', 'Mountain'],
    doorStates: { 'gate-north': 'open' },
  };
  state.time = {
    period: 'evening', date: '15th of Frostfall', elapsed: 12, hour: 19,
    playerKnowsDate: true, playerKnowsTime: true,
    calendarSystem: 'fantasy-months', deadline: null,
  };
  state.arc = 2;
  state.arcType = 'standard';
  state.arcHistory = [{ arc: 1, theme: 'origins', conclusion: 'The hero emerged.' }];
  state.visitedRooms = ['tavern', 'market', 'citadel-gate'];
  state.rollHistory = [{ scene: 1, type: 'contested_roll', roll: 15, outcome: 'success' }];
  state._stateHistory = [{ timestamp: '2026-01-01T00:00:00Z', command: 'test', path: 'scene', oldValue: 0, newValue: 1 }];
  state._lastComputation = { type: 'hazard_save', stat: 'DEX', roll: 14, modifier: 2, total: 16, dc: 13, outcome: 'success' };
  return state;
}

// ── extractMechanicalData ────────────────────────────────────────────

describe('extractMechanicalData', () => {
  test('includes _loreVersion: 1', () => {
    const data = extractMechanicalData(makePopulatedState());
    expect(data._loreVersion).toBe(1);
  });

  test('includes _schemaVersion from constants', () => {
    const data = extractMechanicalData(makePopulatedState());
    expect(data._schemaVersion).toBe(SCHEMA_VERSION);
  });

  test('carries rosterMutations through unchanged', () => {
    const state = makePopulatedState();
    const data = extractMechanicalData(state);
    expect(data.rosterMutations).toHaveLength(1);
    expect(data.rosterMutations[0]!.name).toBe('Kira Voss');
  });

  test('carries factions, quests, worldFlags, time', () => {
    const state = makePopulatedState();
    state.worldFlags = { dragonAwakened: true, bridgeDestroyed: 'scene-7' };
    const data = extractMechanicalData(state);
    expect(data.factions).toEqual({ 'The Guild': 35, 'Shadow Court': -60 });
    expect(data.quests).toHaveLength(1);
    expect(data.worldFlags).toEqual({ dragonAwakened: true, bridgeDestroyed: 'scene-7' });
    expect(data.time.period).toBe('evening');
  });

  test('carries currentRoom, shipState, and crewMutations when present', () => {
    const state = makePopulatedState();
    state.currentRoom = 'Citadel';
    state.shipState = {
      name: 'Borrowed Tide',
      systems: {
        hull: { integrity: 80, status: 'operational', conditions: [] },
        engines: { integrity: 75, status: 'degraded', conditions: ['drift'] },
        power_core: { integrity: 90, status: 'operational', conditions: [] },
        life_support: { integrity: 88, status: 'operational', conditions: [] },
        weapons: { integrity: 60, status: 'degraded', conditions: [] },
        sensors: { integrity: 72, status: 'operational', conditions: [] },
        shields: { integrity: 70, status: 'operational', conditions: [] },
      },
      powerAllocations: { hull: 10, engines: 20, power_core: 10, life_support: 15, weapons: 10, sensors: 20, shields: 15 },
      repairParts: 4,
      scenesSinceRepair: 0,
    };
    state.crewMutations = [
      { id: 'crew_1', name: 'Jin', pronouns: 'she/her', role: 'pilot', morale: 70, stress: 20, loyalty: 60, status: 'active', task: 'Watch' },
    ];

    const data = extractMechanicalData(state);
    expect(data.currentRoom).toBe('Citadel');
    expect(data.shipState?.name).toBe('Borrowed Tide');
    expect(data.crewMutations?.[0]?.name).toBe('Jin');
  });

  test('carries modulesActive, seed, theme, visualStyle', () => {
    const data = extractMechanicalData(makePopulatedState());
    expect(data.modulesActive).toContain('core-systems');
    expect(data.seed).toBe('abc123def456');
    expect(data.theme).toBe('dark-fantasy');
    expect(data.visualStyle).toBe('parchment');
  });

  test('resets codexMutation states to locked', () => {
    const state = makePopulatedState();
    state.codexMutations = [
      { id: 'c1', state: 'discovered', discoveredAt: 3 },
      { id: 'c2', state: 'partial' },
    ];
    const data = extractMechanicalData(state);
    expect(data.codexMutations.every(c => c.state === 'locked')).toBe(true);
  });

  test('empties visitedZones in mapState', () => {
    const data = extractMechanicalData(makePopulatedState());
    expect(data.mapState).toBeDefined();
    expect(data.mapState!.visitedZones).toEqual([]);
    // Preserves other mapState fields
    expect(data.mapState!.currentZone).toBe('Citadel');
    expect(data.mapState!.revealedZones).toContain('Mountain');
  });

  test('transforms character to previousAdventurer', () => {
    const data = extractMechanicalData(makePopulatedState());
    expect(data.previousAdventurer).toEqual({ name: 'Aldric', class: 'Paladin', level: 5 });
  });

  test('previousAdventurer is null when character is null', () => {
    const state = makePopulatedState();
    state.character = null;
    const data = extractMechanicalData(state);
    expect(data.previousAdventurer).toBeNull();
  });

  test('strips visitedRooms, rollHistory, _stateHistory, _lastComputation', () => {
    const data = extractMechanicalData(makePopulatedState()) as unknown as Record<string, unknown>;
    expect(data.visitedRooms).toBeUndefined();
    expect(data.rollHistory).toBeUndefined();
    expect(data._stateHistory).toBeUndefined();
    expect(data._lastComputation).toBeUndefined();
    // Also strips character (replaced by previousAdventurer)
    expect(data.character).toBeUndefined();
  });

  test('carries arc, arcType, carryForward, arcHistory', () => {
    const state = makePopulatedState();
    state.carryForward = {
      characterProgression: {}, factionStandings: { 'The Guild': 35 },
      npcDispositions: [], codexDiscoveries: ['c1'], worldConsequences: ['war'],
    };
    const data = extractMechanicalData(state);
    expect(data.arc).toBe(2);
    expect(data.arcType).toBe('standard');
    expect(data.carryForward!.codexDiscoveries).toContain('c1');
    expect(data.arcHistory).toHaveLength(1);
  });

  test('carries storyArchitect when present', () => {
    const state = makePopulatedState();
    state.storyArchitect = {
      threads: [{ id: 't1' }], foreshadowing: [], consequences: [],
      pacing: { act: 2, actProgress: 0.5, recentBeats: ['rising'] },
    };
    const data = extractMechanicalData(state);
    expect(data.storyArchitect!.threads).toHaveLength(1);
  });

  test('handles minimal state (defaults)', () => {
    const state = createDefaultState();
    const data = extractMechanicalData(state);
    expect(data._loreVersion).toBe(1);
    expect(data.previousAdventurer).toBeNull();
    expect(data.rosterMutations).toEqual([]);
    expect(data.factions).toEqual({});
  });
});

// ── encodeLorePayload ────────────────────────────────────────────────

describe('encodeLorePayload', () => {
  test('returns string starting with LF1:', () => {
    const data = extractMechanicalData(createDefaultState());
    const encoded = encodeLorePayload(data);
    expect(encoded).toMatch(/^LF1:/);
  });

  test('base64 portion decodes to valid JSON', () => {
    const data = extractMechanicalData(makePopulatedState());
    const encoded = encodeLorePayload(data);
    const b64 = encoded.slice(4); // strip 'LF1:'
    const json = atob(b64);
    const parsed = JSON.parse(json);
    expect(parsed._loreVersion).toBe(1);
  });

  test('round-trips mechanical data faithfully', () => {
    const data = extractMechanicalData(makePopulatedState());
    const encoded = encodeLorePayload(data);
    const b64 = encoded.slice(4);
    const parsed = JSON.parse(atob(b64));
    expect(parsed.seed).toBe('abc123def456');
    expect(parsed.factions).toEqual({ 'The Guild': 35, 'Shadow Court': -60 });
  });
});

// ── extractLorePayload ───────────────────────────────────────────────

describe('extractLorePayload', () => {
  test('extracts a valid checksummed LF1 payload from HTML comment', () => {
    const inner = 'LF1:' + btoa(JSON.stringify({ test: true }));
    const checksummed = attachChecksum(inner);
    const content = `# Lore\n\nSome markdown\n\n<!-- LORE:${checksummed} -->`;
    const result = extractLorePayload(content);
    expect(result).toBe(checksummed);
  });

  test('returns null when no LORE comment is present', () => {
    const content = '# Just markdown\n\nNo lore here.';
    expect(extractLorePayload(content)).toBeNull();
  });

  test('returns null for malformed LORE comment', () => {
    const content = '<!-- LORE:not-a-valid-format -->';
    expect(extractLorePayload(content)).toBeNull();
  });

  test('handles whitespace inside the comment delimiters', () => {
    const inner = 'LF1:' + btoa(JSON.stringify({ x: 1 }));
    const checksummed = attachChecksum(inner);
    const content = `<!--  LORE:${checksummed}  -->`;
    const result = extractLorePayload(content);
    expect(result).toBe(checksummed);
  });
});

// ── extractFrontmatterField ──────────────────────────────────────────

describe('extractFrontmatterField', () => {
  const fm = [
    '---',
    'format: text-adventure-lore',
    'version: 1',
    'title: "The Dark Quest"',
    "author: 'GM Claude'",
    'edited: false',
    'exported: true',
    '---',
    '# Content here',
  ].join('\n');

  test('extracts unquoted scalar value', () => {
    expect(extractFrontmatterField(fm, 'format')).toBe('text-adventure-lore');
  });

  test('extracts numeric value as string', () => {
    expect(extractFrontmatterField(fm, 'version')).toBe('1');
  });

  test('strips double quotes from value', () => {
    expect(extractFrontmatterField(fm, 'title')).toBe('The Dark Quest');
  });

  test('strips single quotes from value', () => {
    expect(extractFrontmatterField(fm, 'author')).toBe('GM Claude');
  });

  test('extracts boolean-like value as string', () => {
    expect(extractFrontmatterField(fm, 'edited')).toBe('false');
  });

  test('returns null for a field not in frontmatter', () => {
    expect(extractFrontmatterField(fm, 'nonexistent')).toBeNull();
  });

  test('returns null when no frontmatter delimiters exist', () => {
    expect(extractFrontmatterField('# Just a heading\nNo frontmatter.', 'format')).toBeNull();
  });

  test('does not match fields outside frontmatter block', () => {
    const content = '---\ntitle: Inside\n---\ntitle: Outside';
    expect(extractFrontmatterField(content, 'title')).toBe('Inside');
  });
});

// ── buildLoreMarkdown ────────────────────────────────────────────────

describe('buildLoreMarkdown', () => {
  test('starts with YAML frontmatter delimiters', () => {
    const md = buildLoreMarkdown(makePopulatedState());
    expect(md.startsWith('---\n')).toBe(true);
    expect(md).toContain('\n---\n');
  });

  test('frontmatter contains required fields', () => {
    const md = buildLoreMarkdown(makePopulatedState());
    expect(extractFrontmatterField(md, 'format')).toBe('text-adventure-lore');
    expect(extractFrontmatterField(md, 'version')).toBe('1');
    expect(extractFrontmatterField(md, 'skill-version')).toBe(SCHEMA_VERSION);
    expect(extractFrontmatterField(md, 'title')).toBeTruthy();
    expect(extractFrontmatterField(md, 'theme')).toBe('dark-fantasy');
    expect(extractFrontmatterField(md, 'seed')).toBe('abc123def456');
    expect(extractFrontmatterField(md, 'rulebook')).toBe('d20_system');
    expect(extractFrontmatterField(md, 'exported')).toBe('true');
  });

  test('contains Previous Adventurer section with character data', () => {
    const md = buildLoreMarkdown(makePopulatedState());
    expect(md).toContain('## Previous Adventurer');
    expect(md).toContain('Aldric');
    expect(md).toContain('Paladin');
    expect(md).toContain('Level 5');
  });

  test('Previous Adventurer section says none when character is null', () => {
    const state = makePopulatedState();
    state.character = null;
    const md = buildLoreMarkdown(state);
    expect(md).toContain('## Previous Adventurer');
    expect(md).toMatch(/[Nn]one|[Nn]o previous/);
  });

  test('contains NPC Roster section with mechanical data', () => {
    const md = buildLoreMarkdown(makePopulatedState());
    expect(md).toContain('## NPC Roster');
    expect(md).toContain('Kira Voss');
    expect(md).toContain('rival');
    expect(md).toContain('22'); // hp/maxHp
  });

  test('contains Story Spine section with quest data', () => {
    const md = buildLoreMarkdown(makePopulatedState());
    expect(md).toContain('## Story Spine');
    expect(md).toContain('Retrieve the Artifact');
  });

  test('contains Faction Dynamics with numeric standings and labels', () => {
    const md = buildLoreMarkdown(makePopulatedState());
    expect(md).toContain('## Faction Dynamics');
    expect(md).toContain('The Guild');
    expect(md).toContain('35');
    expect(md).toContain('friendly');
    expect(md).toContain('Shadow Court');
    expect(md).toContain('-60');
    expect(md).toContain('hostile');
  });

  test('faction label thresholds are correct', () => {
    const state = makePopulatedState();
    state.factions = {
      'A': -60,  // hostile: < -50
      'B': -35,  // unfriendly: -50 to -20
      'C': 0,    // neutral: -20 to +20
      'D': 35,   // friendly: +20 to +50
      'E': 60,   // allied: > +50
    };
    const md = buildLoreMarkdown(state);
    expect(md).toContain('hostile');
    expect(md).toContain('unfriendly');
    expect(md).toContain('neutral');
    expect(md).toContain('friendly');
    expect(md).toContain('allied');
  });

  test('contains Location Atlas when mapState is present', () => {
    const md = buildLoreMarkdown(makePopulatedState());
    expect(md).toContain('## Location Atlas');
    expect(md).toContain('Citadel');
  });

  test('contains Codex Entries when codexMutations are present', () => {
    const md = buildLoreMarkdown(makePopulatedState());
    expect(md).toContain('## Codex Entries');
    expect(md).toContain('codex-1');
  });

  test('contains placeholder sections', () => {
    const md = buildLoreMarkdown(makePopulatedState());
    expect(md).toContain('## World History');
    expect(md).toContain('## Encounter Tables');
    expect(md).toContain('## Loot and Rewards');
  });

  test('handles minimal state without errors', () => {
    const state = createDefaultState();
    const md = buildLoreMarkdown(state);
    expect(md).toContain('---');
    expect(md).toContain('## World History');
    expect(md).toContain('## NPC Roster');
  });

  test('escapes YAML-unsafe theme values in frontmatter', () => {
    const state = makePopulatedState();
    state.theme = 'dark: fantasy\ninjected: true';
    const md = buildLoreMarkdown(state);
    // The newline should be escaped to \\n, and the value quoted
    expect(md).toContain('theme: "dark: fantasy\\ninjected: true"');
    // Should NOT appear as a standalone YAML line
    expect(md).not.toMatch(/^injected: true$/m);
  });

  test('escapes YAML-unsafe seed values in frontmatter', () => {
    const state = makePopulatedState();
    state.seed = 'abc: "injection"';
    const md = buildLoreMarkdown(state);
    // yamlSafe quotes the value and escapes internal double quotes
    expect(md).toContain('seed: "abc: \\"injection\\""');
  });

  test('NPC roster includes full mechanical fields', () => {
    const md = buildLoreMarkdown(makePopulatedState());
    // Check for stat block and combat data
    expect(md).toContain('STR');
    expect(md).toContain('DEX');
    expect(md).toContain('1d8+3'); // damageDice
    expect(md).toContain('14');    // ac
    expect(md).toContain('friendly'); // disposition
  });
});
