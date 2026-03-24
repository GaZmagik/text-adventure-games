// tag CLI — Faction Standing Thresholds
// Extracted from modules/core-systems.md § Faction Reputation

/** A single faction standing tier with its range and effects. */
export interface FactionStanding {
  /** Human-readable label for this tier. */
  label: string;
  /** Minimum reputation score (inclusive). */
  min: number;
  /** Maximum reputation score (inclusive). */
  max: number;
  /** Price modifier as a decimal (e.g. 0.5 = +50%, -0.4 = -40%). */
  priceModifier: number;
  /** Short description of the gameplay effect. */
  effect: string;
}

/**
 * Faction standing tiers extracted from core-systems.md § Faction Reputation.
 * Ranges cover the full -100 to +100 spectrum with no gaps.
 */
export const FACTION_STANDINGS: FactionStanding[] = [
  {
    label: 'Hostile',
    min: -100,
    max: -50,
    priceModifier: 0.5,
    effect: 'Attack on sight, no trading, restricted zones locked',
  },
  {
    label: 'Unfriendly',
    min: -49,
    max: -10,
    priceModifier: 0.5,
    effect: 'Higher prices (+50%), guarded NPCs, limited access',
  },
  {
    label: 'Neutral',
    min: -9,
    max: 9,
    priceModifier: 0,
    effect: 'Standard prices, standard access',
  },
  {
    label: 'Friendly',
    min: 10,
    max: 49,
    priceModifier: -0.2,
    effect: 'Lower prices (-20%), bonus intel, restricted access granted',
  },
  {
    label: 'Allied',
    min: 50,
    max: 100,
    priceModifier: -0.4,
    effect: 'Best prices (-40%), faction missions, safe houses, combat backup',
  },
];

/**
 * Look up the faction standing tier for a given reputation score.
 * Clamps the value to [-100, 100] before lookup.
 */
export function getFactionStanding(score: number): FactionStanding {
  const clamped = Math.max(-100, Math.min(100, score));
  const standing = FACTION_STANDINGS.find(s => clamped >= s.min && clamped <= s.max);
  // Should never happen with contiguous ranges, but fall back to Neutral defensively.
  return standing ?? FACTION_STANDINGS[2]!;
}
