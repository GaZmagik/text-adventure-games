import type { StatBlock } from '../types';
import { STAT_NAMES } from './constants';

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level: number): number {
  return level <= 4 ? 2 : 3;
}

export function computeModifiers(stats: StatBlock): StatBlock {
  const mods = {} as StatBlock;
  for (const stat of STAT_NAMES) {
    mods[stat] = abilityModifier(stats[stat]);
  }
  return mods;
}
