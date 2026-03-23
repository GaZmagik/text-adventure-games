// tag CLI — Bestiary Tier Definitions
// Extracted from modules/bestiary.md § Threat Tiers + § Tier-Based Resistance Modifiers

import type { BestiaryTier, NpcMutation, Pronouns, StatBlock } from '../types';
import { computeModifiers } from '../lib/modifier';

/** Configuration for a single bestiary tier. */
export interface TierConfig {
  /** Minimum hit points for this tier. */
  hpMin: number;
  /** Maximum hit points for this tier. */
  hpMax: number;
  /** Available damage dice expressions. */
  damageDiceOptions: string[];
  /** Minimum resistance modifier (used in contested rolls). */
  resistMin: number;
  /** Maximum resistance modifier. */
  resistMax: number;
  /** Base AC range — [min, max]. */
  acRange: [number, number];
  /** Base soak range — [min, max]. */
  soakRange: [number, number];
  /** Stat score ranges — [min, max] for ability scores. */
  statRange: [number, number];
  /** NPC level range — [min, max]. */
  levelRange: [number, number];
}

/**
 * Tier definitions extracted from bestiary.md.
 *
 * - Minion: fodder enemies, low stats across the board.
 * - Rival (called "Lieutenant" in the resistance table): moderate threat.
 * - Nemesis (called "Boss" in the resistance table): major antagonist.
 */
export const TIERS: Record<BestiaryTier, TierConfig> = {
  minion: {
    hpMin: 4,
    hpMax: 8,
    damageDiceOptions: ['1d4', '1d6'],
    resistMin: 0,
    resistMax: 2,
    acRange: [6, 12],
    soakRange: [0, 3],
    statRange: [6, 12],
    levelRange: [1, 3],
  },
  rival: {
    hpMin: 12,
    hpMax: 20,
    damageDiceOptions: ['1d8', '2d6'],
    resistMin: 3,
    resistMax: 5,
    acRange: [8, 14],
    soakRange: [1, 3],
    statRange: [10, 16],
    levelRange: [3, 6],
  },
  nemesis: {
    hpMin: 25,
    hpMax: 40,
    damageDiceOptions: ['2d8', '3d6'],
    resistMin: 5,
    resistMax: 8,
    acRange: [8, 14],
    soakRange: [2, 5],
    statRange: [12, 18],
    levelRange: [5, 8],
  },
};

/** Returns a random integer between min and max (inclusive). */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Picks a random element from an array. */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generates a random stat block within the tier's stat range. */
function generateStatBlock(tier: TierConfig): StatBlock {
  return {
    STR: randInt(tier.statRange[0], tier.statRange[1]),
    DEX: randInt(tier.statRange[0], tier.statRange[1]),
    CON: randInt(tier.statRange[0], tier.statRange[1]),
    INT: randInt(tier.statRange[0], tier.statRange[1]),
    WIS: randInt(tier.statRange[0], tier.statRange[1]),
    CHA: randInt(tier.statRange[0], tier.statRange[1]),
  };
}

/**
 * Generate a complete NPC mutation from a bestiary tier.
 * Stats are randomised within the tier's ranges and persisted immediately —
 * they are never recalculated.
 *
 * Pronouns are mandatory (known gotcha fix: NPC pronouns must be set at creation).
 */
export function generateNpcFromTier(
  tier: BestiaryTier,
  id: string,
  name: string,
  pronouns: Pronouns,
  role: string,
): NpcMutation {
  const config = TIERS[tier];
  const stats = generateStatBlock(config);
  const modifiers = computeModifiers(stats);
  const hp = randInt(config.hpMin, config.hpMax);

  return {
    id,
    name,
    pronouns,
    role,
    tier,
    level: randInt(config.levelRange[0], config.levelRange[1]),
    stats,
    modifiers,
    hp,
    maxHp: hp,
    ac: randInt(config.acRange[0], config.acRange[1]),
    soak: randInt(config.soakRange[0], config.soakRange[1]),
    damageDice: pick(config.damageDiceOptions),
    status: 'active',
    alive: true,
    trust: 0,
    disposition: 'neutral',
    dispositionSeed: Math.random(),
  };
}
