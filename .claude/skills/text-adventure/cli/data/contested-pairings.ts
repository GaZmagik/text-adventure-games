// Contested check attribute pairings from modules/die-rolls.md
import type { StatName } from '../types';

type ContestedPairing = {
  action: string;
  playerAttribute: StatName[];
  npcAttribute: StatName[];
};

// From die-rolls.md § Contested Check Attribute Pairings
export const CONTESTED_PAIRINGS: ContestedPairing[] = [
  { action: 'Persuade', playerAttribute: ['CHA'], npcAttribute: ['WIS'] },
  { action: 'Deceive', playerAttribute: ['CHA'], npcAttribute: ['WIS', 'INT'] },
  { action: 'Intimidate', playerAttribute: ['STR', 'CHA'], npcAttribute: ['WIS', 'CHA'] },
  { action: 'Pickpocket', playerAttribute: ['DEX'], npcAttribute: ['WIS'] },
  { action: 'Sneak past', playerAttribute: ['DEX'], npcAttribute: ['WIS'] },
  { action: 'Arm wrestle', playerAttribute: ['STR'], npcAttribute: ['STR'] },
  { action: 'Outwit', playerAttribute: ['INT'], npcAttribute: ['INT', 'WIS'] },
  { action: 'Read intentions', playerAttribute: ['WIS'], npcAttribute: ['CHA'] },
  { action: 'Resist charm', playerAttribute: ['WIS'], npcAttribute: ['CHA'] },
  { action: 'Spot deception', playerAttribute: ['WIS', 'INT'], npcAttribute: ['CHA'] },
];

// Default opposing attribute lookup — returns the most common NPC
// opposing attribute for a given player attribute across all pairings.
const DEFAULT_OPPOSING: Record<StatName, StatName> = {
  CHA: 'WIS',
  DEX: 'WIS',
  STR: 'STR',
  INT: 'WIS',
  WIS: 'CHA',
  CON: 'CON',
};

export function getOpposingAttribute(playerAttr: StatName): StatName {
  return DEFAULT_OPPOSING[playerAttr];
}
