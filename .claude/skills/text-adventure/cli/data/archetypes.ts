// tag CLI — Archetype Definitions
// Extracted from modules/character-creation.md § D&D 5e Archetypes

import type { StatBlock, StatName } from '../types';

/** Configuration for a single player archetype. */
export interface ArchetypeConfig {
  /** Base ability scores before random bonuses. */
  baseStats: StatBlock;
  /** Primary stats for this archetype (highest base values). */
  primaryStats: StatName[];
  /** Base hit points at level 1. */
  baseHp: number;
  /** Base armour class at level 1. */
  baseAc: number;
  /** Short flavour description. */
  flavour: string;
}

/**
 * The six core archetypes, extracted from character-creation.md.
 * Stat arrays are fixed; the 1d4 random bonuses are applied at character creation time,
 * not stored here.
 *
 * Stat totals: each archetype sums to 70 (10+10+10+10+16+14 = 70).
 */
export const ARCHETYPES: Record<string, ArchetypeConfig> = {
  Soldier: {
    baseStats: { STR: 16, DEX: 10, CON: 14, INT: 10, WIS: 10, CHA: 10 },
    primaryStats: ['STR', 'CON'],
    baseHp: 12,
    baseAc: 14,
    flavour: 'Combat-trained, tactical instincts',
  },
  Scout: {
    baseStats: { STR: 10, DEX: 16, CON: 10, INT: 10, WIS: 14, CHA: 10 },
    primaryStats: ['DEX', 'WIS'],
    baseHp: 9,
    baseAc: 13,
    flavour: 'Agile, perceptive, evasive',
  },
  Engineer: {
    baseStats: { STR: 10, DEX: 12, CON: 12, INT: 16, WIS: 10, CHA: 10 },
    primaryStats: ['INT', 'DEX'],
    baseHp: 8,
    baseAc: 12,
    flavour: 'Improviser, systems expert',
  },
  Medic: {
    baseStats: { STR: 10, DEX: 10, CON: 10, INT: 14, WIS: 16, CHA: 10 },
    primaryStats: ['WIS', 'INT'],
    baseHp: 9,
    baseAc: 11,
    flavour: 'Healer, calm under pressure',
  },
  Diplomat: {
    baseStats: { STR: 10, DEX: 10, CON: 10, INT: 14, WIS: 10, CHA: 16 },
    primaryStats: ['CHA', 'INT'],
    baseHp: 8,
    baseAc: 11,
    flavour: 'Persuader, reads people',
  },
  Smuggler: {
    baseStats: { STR: 10, DEX: 16, CON: 10, INT: 10, WIS: 10, CHA: 14 },
    primaryStats: ['DEX', 'CHA'],
    baseHp: 10,
    baseAc: 13,
    flavour: 'Slippery, charming, resourceful',
  },
};
