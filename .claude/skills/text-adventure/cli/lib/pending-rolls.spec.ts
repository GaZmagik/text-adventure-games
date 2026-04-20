import { describe, test, expect } from 'bun:test';
import {
  resolvePendingRolls,
  selectPendingRollForResolution,
  buildPendingRollCommand,
} from './pending-rolls';
import type { PendingRoll, RollRecord } from '../types';

describe('pending-rolls', () => {
  const mockPending: PendingRoll = {
    type: 'hazard',
    stat: 'CON',
    dc: 14,
    action: 1,
  };

  const mockRoll: RollRecord = {
    type: 'hazard_save',
    stat: 'CON',
    dc: 14,
    action: 1,
    roll: 10,
    modifier: 2,
    total: 12,
    outcome: 'failure',
    scene: 1,
  };

  describe('resolvePendingRolls', () => {
    test('returns empty arrays if no pending rolls', () => {
      const result = resolvePendingRolls(undefined, [], 1);
      expect(result.resolved).toEqual([]);
      expect(result.unresolved).toEqual([]);
    });

    test('resolves a perfect match', () => {
      const result = resolvePendingRolls([mockPending], [mockRoll], 1);
      expect(result.resolved.length).toBe(1);
      expect(result.unresolved.length).toBe(0);
      expect(result.resolved[0]!.pending).toBe(mockPending);
      expect(result.resolved[0]!.rollIndex).toBe(0);
    });

    test('leaves pending unresolved if scene differs', () => {
      const rollOtherScene: RollRecord = { ...mockRoll, scene: 2 };
      const result = resolvePendingRolls([mockPending], [rollOtherScene], 1);
      expect(result.resolved.length).toBe(0);
      expect(result.unresolved.length).toBe(1);
    });

    test('resolves multiple pending rolls correctly without reusing rolls', () => {
      const pending1: PendingRoll = { type: 'hazard', stat: 'CON', action: 1 };
      const pending2: PendingRoll = { type: 'hazard', stat: 'CON', action: 2 };
      
      const roll1: RollRecord = { ...mockRoll, action: 1, scene: 1 };
      const roll2: RollRecord = { ...mockRoll, action: 2, scene: 1 };

      const result = resolvePendingRolls([pending1, pending2], [roll1, roll2], 1);
      expect(result.resolved.length).toBe(2);
      expect(result.resolved.find(r => r.pending.action === 1)?.rollIndex).toBe(0);
      expect(result.resolved.find(r => r.pending.action === 2)?.rollIndex).toBe(1);
    });
  });

  describe('selectPendingRollForResolution', () => {
    test('returns null if no pending rolls match criteria', () => {
      const result = selectPendingRollForResolution([mockPending], [mockRoll], 1, { type: 'hazard', stat: 'DEX' });
      expect(result).toBeNull();
    });

    test('returns the lowest action matching pending roll', () => {
      const pending1: PendingRoll = { type: 'hazard', stat: 'DEX', action: 2 };
      const pending2: PendingRoll = { type: 'hazard', stat: 'DEX', action: 1 };
      
      const result = selectPendingRollForResolution([pending1, pending2], [], 1, { type: 'hazard', stat: 'DEX' });
      expect(result).toBe(pending2);
    });
  });

  describe('buildPendingRollCommand', () => {
    test('builds hazard command with DC', () => {
      expect(buildPendingRollCommand(mockPending)).toBe('tag compute hazard CON --dc 14');
    });

    test('builds hazard command without DC', () => {
      const noDc: PendingRoll = { type: 'hazard', stat: 'DEX', action: 1 };
      expect(buildPendingRollCommand(noDc)).toBe('tag compute hazard DEX --dc <N>');
    });

    test('builds contest command with npc', () => {
      const contest: PendingRoll = { type: 'contest', stat: 'STR', npc: 'goblin_1', action: 1 };
      expect(buildPendingRollCommand(contest)).toBe('tag compute contest STR goblin_1');
    });

    test('builds contest command without npc', () => {
      const contest: PendingRoll = { type: 'contest', stat: 'INT', action: 1 };
      expect(buildPendingRollCommand(contest)).toBe('tag compute contest INT <npc_id>');
    });
  });
});
