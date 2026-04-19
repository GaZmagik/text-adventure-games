import { describe, test, expect } from 'bun:test';
import { ARCHETYPES } from './archetypes';
import type { StatName } from '../types';

const STAT_NAMES: StatName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const EXPECTED_ARCHETYPES = ['Soldier', 'Scout', 'Engineer', 'Medic', 'Diplomat', 'Smuggler'];

describe('ARCHETYPES', () => {
  test('defines all 6 archetypes', () => {
    expect(Object.keys(ARCHETYPES)).toHaveLength(6);
    for (const name of EXPECTED_ARCHETYPES) {
      expect(ARCHETYPES[name]).toBeDefined();
    }
  });

  test('each archetype has a valid base stat block with all 6 attributes', () => {
    for (const name of EXPECTED_ARCHETYPES) {
      const arch = ARCHETYPES[name]!;
      for (const stat of STAT_NAMES) {
        expect(arch.baseStats[stat]).toBeGreaterThanOrEqual(1);
        expect(typeof arch.baseStats[stat]).toBe('number');
      }
    }
  });

  test('each archetype has a stat total of 70 (6 stats summing correctly)', () => {
    for (const name of EXPECTED_ARCHETYPES) {
      const arch = ARCHETYPES[name]!;
      const total = STAT_NAMES.reduce((sum, s) => sum + arch.baseStats[s], 0);
      expect(total).toBe(70);
    }
  });

  test('each archetype has at least one primary stat', () => {
    for (const name of EXPECTED_ARCHETYPES) {
      const arch = ARCHETYPES[name]!;
      expect(arch.primaryStats.length).toBeGreaterThanOrEqual(1);
      for (const ps of arch.primaryStats) {
        expect(STAT_NAMES).toContain(ps);
      }
    }
  });

  test('each archetype has baseHp and baseAc', () => {
    for (const name of EXPECTED_ARCHETYPES) {
      const arch = ARCHETYPES[name]!;
      expect(arch.baseHp).toBeGreaterThanOrEqual(1);
      expect(arch.baseAc).toBeGreaterThanOrEqual(1);
    }
  });

  test('Soldier has STR and CON as primary stats', () => {
    expect(ARCHETYPES['Soldier']!.primaryStats).toContain('STR');
    expect(ARCHETYPES['Soldier']!.primaryStats).toContain('CON');
  });

  test('Scout has DEX and WIS as primary stats', () => {
    expect(ARCHETYPES['Scout']!.primaryStats).toContain('DEX');
    expect(ARCHETYPES['Scout']!.primaryStats).toContain('WIS');
  });

  test('Engineer has INT and DEX as primary stats', () => {
    expect(ARCHETYPES['Engineer']!.primaryStats).toContain('INT');
    expect(ARCHETYPES['Engineer']!.primaryStats).toContain('DEX');
  });

  test('Medic has WIS and INT as primary stats', () => {
    expect(ARCHETYPES['Medic']!.primaryStats).toContain('WIS');
    expect(ARCHETYPES['Medic']!.primaryStats).toContain('INT');
  });

  test('Diplomat has CHA and INT as primary stats', () => {
    expect(ARCHETYPES['Diplomat']!.primaryStats).toContain('CHA');
    expect(ARCHETYPES['Diplomat']!.primaryStats).toContain('INT');
  });

  test('Smuggler has DEX and CHA as primary stats', () => {
    expect(ARCHETYPES['Smuggler']!.primaryStats).toContain('DEX');
    expect(ARCHETYPES['Smuggler']!.primaryStats).toContain('CHA');
  });
});
