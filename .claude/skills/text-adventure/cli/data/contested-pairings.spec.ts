import { describe, test, expect } from 'bun:test';
import { CONTESTED_PAIRINGS, getOpposingAttribute } from './contested-pairings';

describe('CONTESTED_PAIRINGS', () => {
  test('has entries for common contested actions', () => {
    expect(CONTESTED_PAIRINGS.length).toBeGreaterThanOrEqual(8);
  });

  test('Persuade uses CHA vs WIS', () => {
    const p = CONTESTED_PAIRINGS.find(e => e.action === 'Persuade');
    expect(p).toBeDefined();
    expect(p!.playerAttribute).toContain('CHA');
    expect(p!.npcAttribute).toContain('WIS');
  });

  test('Pickpocket uses DEX vs WIS', () => {
    const p = CONTESTED_PAIRINGS.find(e => e.action === 'Pickpocket');
    expect(p).toBeDefined();
    expect(p!.playerAttribute).toContain('DEX');
    expect(p!.npcAttribute).toContain('WIS');
  });
});

describe('getOpposingAttribute', () => {
  test('CHA opposes WIS', () => { expect(getOpposingAttribute('CHA')).toBe('WIS'); });
  test('DEX opposes WIS', () => { expect(getOpposingAttribute('DEX')).toBe('WIS'); });
  test('WIS opposes CHA', () => { expect(getOpposingAttribute('WIS')).toBe('CHA'); });
  test('STR opposes STR', () => { expect(getOpposingAttribute('STR')).toBe('STR'); });
  test('INT opposes WIS', () => { expect(getOpposingAttribute('INT')).toBe('WIS'); });
  test('CON defaults to CON', () => { expect(getOpposingAttribute('CON')).toBe('CON'); });
});
