import type { GmState, Quest, QuestObjective, StatName } from '../types';

export type BalanceFailure = {
  id: string;
  type: 'quest' | 'npc' | 'economy';
  severity: 'blocker' | 'warning';
  message: string;
  corrective: string;
};

/**
 * Analyzes game state for progression blockers and balance issues.
 */
export function checkBalance(state: GmState): BalanceFailure[] {
  const failures: BalanceFailure[] = [];

  checkQuestBalance(state, failures);
  checkCharacterGrowth(state, failures);

  return failures;
}

function checkQuestBalance(state: GmState, failures: BalanceFailure[]): void {
  const character = state.character;
  if (!character) return;

  for (const quest of state.quests) {
    if (quest.status !== 'active') continue;

    for (const objective of quest.objectives) {
      if (objective.completed || !objective.requirements) continue;

      const req = objective.requirements;

      // Check level requirement
      if (req.minLevel !== undefined && character.level < req.minLevel) {
        failures.push({
          id: `${quest.id}:${objective.id}:level`,
          type: 'quest',
          severity: 'blocker',
          message: `Quest "${quest.title}" objective "${objective.description}" requires Level ${req.minLevel}, but character is Level ${character.level}.`,
          corrective: `Lower the minLevel requirement or ensure the character can level up before reaching this objective.`,
        });
      }

      // Check stat/DC accessibility
      if (req.stat && req.dc !== undefined) {
        const mod = character.modifiers[req.stat] || 0;
        const maxPossible = mod + 20;
        if (maxPossible < req.dc) {
          failures.push({
            id: `${quest.id}:${objective.id}:dc`,
            type: 'quest',
            severity: 'blocker',
            message: `Quest "${quest.title}" objective "${objective.description}" requires DC ${req.dc} ${req.stat} check. Character max possible is ${maxPossible}.`,
            corrective: `Lower the DC to ${maxPossible} or less, or provide a way to boost the ${req.stat} modifier.`,
          });
        } else if (maxPossible - 5 < req.dc) {
          failures.push({
            id: `${quest.id}:${objective.id}:dc_warning`,
            type: 'quest',
            severity: 'warning',
            message: `Quest "${quest.title}" objective "${objective.description}" has a very high DC (${req.dc} ${req.stat}). Character only has a ${(1 - (req.dc - mod - 1) / 20) * 100}% chance of success.`,
            corrective: `Consider lowering the DC or providing an alternative non-roll path.`,
          });
        }
      }

      // Check faction standing
      if (req.faction && req.minStanding !== undefined) {
        const current = state.factions[req.faction] ?? 0;
        if (current < req.minStanding) {
          // This is often a warning because standing can change, but if it's way off...
          if (req.minStanding - current > 50) {
            failures.push({
              id: `${quest.id}:${objective.id}:faction`,
              type: 'quest',
              severity: 'warning',
              message: `Quest "${quest.title}" objective "${objective.description}" requires ${req.minStanding} standing with ${req.faction}, but current is ${current}.`,
              corrective: `Ensure there are enough opportunities to gain ${req.minStanding - current} standing.`,
            });
          }
        }
      }

      // Check item requirement
      if (req.item) {
        const hasItem = character.inventory.some(i => i.name === req.item);
        if (!hasItem) {
          // Check if item is in worldData loot
          const itemInLoot = Object.values(state.worldData?.rooms || {}).some(r => r.loot.includes(req.item!));
          if (!itemInLoot) {
             failures.push({
              id: `${quest.id}:${objective.id}:item`,
              type: 'quest',
              severity: 'blocker',
              message: `Quest "${quest.title}" objective "${objective.description}" requires item "${req.item}", but it is not in inventory and not found in world loot.`,
              corrective: `Add item "${req.item}" to a room's loot or an NPC's inventory.`,
            });
          }
        }
      }
    }
  }
}

function checkCharacterGrowth(state: GmState, failures: BalanceFailure[]): void {
  const character = state.character;
  if (!character) return;

  // Check for XP starvation
  if (character.level < 5 && character.xp === 0 && state.scene > 10) {
    failures.push({
      id: 'character:xp_starvation',
      type: 'economy',
      severity: 'warning',
      message: `Character is still Level ${character.level} after ${state.scene} scenes.`,
      corrective: `Increase XP rewards in recent scenes or lower level-up thresholds.`,
    });
  }
}
