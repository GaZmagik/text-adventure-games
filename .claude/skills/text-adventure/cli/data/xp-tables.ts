// tag CLI — XP Thresholds and Level-Up Rewards
// Extracted from modules/core-systems.md § XP and Levelling

/** A single level threshold entry. */
type XpThreshold = {
  /** Character level (1-8). */
  level: number;
  /** Cumulative XP required to reach this level. */
  xp: number;
};

/** Reward granted when reaching a given level. */
type LevelReward = {
  /** HP gained on reaching this level. */
  hpGain: number;
  /** Description of the improvement granted. */
  improvement: string;
};

/**
 * XP thresholds for levels 1 through 8.
 * Extracted directly from core-systems.md § Level Thresholds.
 */
export const XP_THRESHOLDS: XpThreshold[] = [
  { level: 1, xp: 0 },
  { level: 2, xp: 100 },
  { level: 3, xp: 250 },
  { level: 4, xp: 500 },
  { level: 5, xp: 800 },
  { level: 6, xp: 1200 },
  { level: 7, xp: 1700 },
  { level: 8, xp: 2300 },
];

/**
 * Rewards granted at each level.
 * Key is the level number; value describes what the player gains.
 */
export const LEVEL_REWARDS: Record<number, LevelReward> = {
  1: { hpGain: 0, improvement: 'Starting stats' },
  2: { hpGain: 3, improvement: '+1 attribute' },
  3: { hpGain: 3, improvement: 'New proficiency' },
  4: { hpGain: 4, improvement: '+1 attribute' },
  5: { hpGain: 4, improvement: '+1 attribute, new ability' },
  6: { hpGain: 5, improvement: 'New proficiency' },
  7: { hpGain: 5, improvement: '+1 attribute' },
  8: { hpGain: 6, improvement: '+1 attribute, new ability' },
};
