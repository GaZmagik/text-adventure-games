import type { StatBlock } from '../types';

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// Proficiency bonus by character level (D&D 5e progression)
// Levels 1–4: +2, 5–8: +3, 9–12: +4, 13–16: +5, 17–20: +6
export function proficiencyBonus(level: number): number {
  if (level < 1) return 2;
  if (level > 20) return 6; // D&D 5e cap
  return Math.floor((level - 1) / 4) + 2;
}

export function computeModifiers(stats: StatBlock): StatBlock {
  const mods: StatBlock = {
    STR: abilityModifier(stats.STR),
    DEX: abilityModifier(stats.DEX),
    CON: abilityModifier(stats.CON),
    INT: abilityModifier(stats.INT),
    WIS: abilityModifier(stats.WIS),
    CHA: abilityModifier(stats.CHA),
  };
  return mods;
}
