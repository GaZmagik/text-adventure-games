import { describe, test, expect } from 'bun:test';
import { ok, fail, noState, npcNotFound, styleNotSet } from './errors';

describe('ok', () => {
  test('returns success result with data', () => {
    const result = ok({ hp: 42 }, 'state get');
    expect(result.ok).toBe(true);
    expect(result.command).toBe('state get');
    expect(result.data).toEqual({ hp: 42 });
    expect(result.error).toBeUndefined();
  });
});

describe('fail', () => {
  test('returns failure result with corrective message', () => {
    const result = fail('Something broke', 'tag state reset', 'state get');
    expect(result.ok).toBe(false);
    expect(result.command).toBe('state get');
    expect(result.error).toBeDefined();
    expect(result.error!.message).toBe('Something broke');
    expect(result.error!.corrective).toBe('tag state reset');
  });
});

describe('noState', () => {
  test('returns structured no-state error', () => {
    const result = noState();
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('No game state found');
    expect(result.error!.corrective).toContain('tag state reset');
  });
});

describe('npcNotFound', () => {
  test('returns error with NPC id and corrective create-npc command', () => {
    const result = npcNotFound('guard_01');
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('guard_01');
    expect(result.error!.corrective).toContain('tag state create-npc guard_01');
    expect(result.error!.corrective).toContain('--tier');
    expect(result.error!.corrective).toContain('--pronouns');
  });
});

describe('styleNotSet', () => {
  test('returns error with corrective set style command', () => {
    const result = styleNotSet();
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('visual style');
    expect(result.error!.corrective).toContain('tag state set visualStyle');
  });
});
