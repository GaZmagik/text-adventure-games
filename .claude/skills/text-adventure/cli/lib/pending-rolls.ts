// Pending-roll helpers reconcile rendered action metadata with later compute command results.
import type { PendingRoll, RollRecord, RollType } from '../types';

const PENDING_TO_ROLL_TYPE: Record<PendingRoll['type'], RollType> = {
  contest: 'contested_roll',
  hazard: 'hazard_save',
};

type PendingRollCriteria = Pick<PendingRoll, 'type' | 'stat'> &
  Partial<Pick<PendingRoll, 'action' | 'npc' | 'dc' | 'skill'>>;

type PendingRollMatch = {
  pending: PendingRoll;
  rollIndex: number;
};

type PendingRollResolution = {
  resolved: PendingRollMatch[];
  unresolved: PendingRoll[];
};

function hasDefinedMismatch<T>(pendingValue: T | undefined, rollValue: T | undefined): boolean {
  return pendingValue !== undefined && rollValue !== undefined && pendingValue !== rollValue;
}

function pendingRollScore(pending: PendingRoll, roll: RollRecord): number {
  let score = 0;
  if (pending.action !== undefined && roll.action === pending.action) score += 8;
  if (pending.npc !== undefined && roll.npcId === pending.npc) score += 4;
  if (pending.dc !== undefined && roll.dc === pending.dc) score += 2;
  if (pending.skill !== undefined && roll.skill === pending.skill) score += 1;
  return score;
}

function rollMatchesPending(pending: PendingRoll, roll: RollRecord, scene: number): boolean {
  if (roll.scene !== scene) return false;
  if (roll.type !== PENDING_TO_ROLL_TYPE[pending.type]) return false;
  if (roll.stat !== pending.stat) return false;
  if (hasDefinedMismatch(pending.action, roll.action)) return false;
  if (hasDefinedMismatch(pending.npc, roll.npcId)) return false;
  if (hasDefinedMismatch(pending.dc, roll.dc)) return false;
  if (hasDefinedMismatch(pending.skill, roll.skill)) return false;
  return true;
}

export function resolvePendingRolls(
  pendingRolls: PendingRoll[] | undefined,
  rollHistory: RollRecord[],
  scene: number,
): PendingRollResolution {
  if (!pendingRolls || pendingRolls.length === 0) {
    return { resolved: [], unresolved: [] };
  }

  const resolved: PendingRollMatch[] = [];
  const unresolved: PendingRoll[] = [];
  const usedRollIndexes = new Set<number>();

  for (const pending of pendingRolls) {
    let bestRollIndex = -1;
    let bestScore = -1;

    for (let i = 0; i < rollHistory.length; i++) {
      if (usedRollIndexes.has(i)) continue;
      const roll = rollHistory[i]!;
      if (!rollMatchesPending(pending, roll, scene)) continue;
      const score = pendingRollScore(pending, roll);
      if (score > bestScore) {
        bestScore = score;
        bestRollIndex = i;
      }
    }

    if (bestRollIndex >= 0) {
      usedRollIndexes.add(bestRollIndex);
      resolved.push({ pending, rollIndex: bestRollIndex });
    } else {
      unresolved.push(pending);
    }
  }

  return { resolved, unresolved };
}

export function selectPendingRollForResolution(
  pendingRolls: PendingRoll[] | undefined,
  rollHistory: RollRecord[],
  scene: number,
  criteria: PendingRollCriteria,
): PendingRoll | null {
  const { unresolved } = resolvePendingRolls(pendingRolls, rollHistory, scene);
  const candidates = unresolved.filter(pending => {
    if (pending.type !== criteria.type) return false;
    if (pending.stat !== criteria.stat) return false;
    if (criteria.action !== undefined && pending.action !== criteria.action) return false;
    if (criteria.npc !== undefined && pending.npc !== criteria.npc) return false;
    if (criteria.dc !== undefined && pending.dc !== criteria.dc) return false;
    if (criteria.skill !== undefined && pending.skill !== criteria.skill) return false;
    return true;
  });

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.action - b.action);
  return candidates[0] ?? null;
}

export function buildPendingRollCommand(pending: PendingRoll): string {
  if (pending.type === 'contest') {
    const npcSegment = pending.npc ?? '<npc_id>';
    return `tag compute contest ${pending.stat} ${npcSegment}`;
  }

  const dcSegment = pending.dc !== undefined ? String(pending.dc) : '<N>';
  return `tag compute hazard ${pending.stat} --dc ${dcSegment}`;
}
