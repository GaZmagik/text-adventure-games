import { describe, test, expect } from 'bun:test';
import {
  STAT_NAMES, VALID_TIERS, VALID_PRONOUNS, VALID_TOP_KEYS,
  KNOWN_MODULES, TIER1_MODULES, SCHEMA_VERSION,
} from './constants';
import type { StatName, BestiaryTier, Pronouns, GmState } from '../types';

describe('constants', () => {
  test('STAT_NAMES contains all 6 ability scores', () => {
    expect(STAT_NAMES).toHaveLength(6);
    for (const stat of ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as StatName[]) {
      expect(STAT_NAMES).toContain(stat);
    }
  });
  test('VALID_TIERS contains minion, rival, nemesis', () => {
    expect(VALID_TIERS).toHaveLength(3);
    for (const tier of ['minion', 'rival', 'nemesis'] as BestiaryTier[]) {
      expect(VALID_TIERS).toContain(tier);
    }
  });
  test('VALID_PRONOUNS contains she/her, he/him, they/them', () => {
    expect(VALID_PRONOUNS).toHaveLength(3);
    for (const p of ['she/her', 'he/him', 'they/them'] as Pronouns[]) {
      expect(VALID_PRONOUNS).toContain(p);
    }
  });
  test('VALID_TOP_KEYS matches GmState interface keys', () => {
    // satisfies enforces exhaustiveness: omitting any GmState key is a compile error
    const ALL_GM_STATE_KEYS = {
      _version: true, _schemaVersion: true, scene: true, currentRoom: true,
      visitedRooms: true, rollHistory: true, character: true, worldFlags: true,
      seed: true, theme: true, visualStyle: true, modulesActive: true,
      rosterMutations: true, codexMutations: true, time: true, factions: true,
      quests: true, storyArchitect: true, shipState: true, crewMutations: true,
      mapState: true, systemResources: true, navPlottedCourse: true, arc: true,
      arcType: true, carryForward: true, arcHistory: true, _lastComputation: true,
      _stateHistory: true,
    } satisfies Record<keyof Required<GmState>, true>;
    const topKeys = [...VALID_TOP_KEYS].sort();
    const expectedKeys = Object.keys(ALL_GM_STATE_KEYS).sort();
    expect(topKeys).toEqual(expectedKeys);
  });

  test('KNOWN_MODULES has correct count', () => {
    expect(KNOWN_MODULES).toHaveLength(23);
  });

  test('TIER1_MODULES is a subset of KNOWN_MODULES', () => {
    for (const mod of TIER1_MODULES) {
      expect((KNOWN_MODULES as readonly string[]).includes(mod)).toBe(true);
    }
  });

  test('SCHEMA_VERSION is a valid semver string', () => {
    expect(SCHEMA_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
