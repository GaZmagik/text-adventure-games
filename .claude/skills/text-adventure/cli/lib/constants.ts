import type { StatName, BestiaryTier, Pronouns } from '../types';

export const STAT_NAMES: readonly StatName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
export const VALID_TIERS: readonly BestiaryTier[] = ['minion', 'rival', 'nemesis'];
export const VALID_PRONOUNS: readonly Pronouns[] = ['she/her', 'he/him', 'they/them'];

export const MAX_ROLL_HISTORY = 50;
export const MAX_STATE_HISTORY = 100;
export const MAX_DICE_COUNT = 1000;
