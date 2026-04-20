import { describe, test, expect } from 'bun:test';
import { renderDice } from './dice';
import { createDefaultState } from '../../lib/state-store';
import { extractJsonTagAttr } from '../../tests/support/rendered-widget';

type DiceConfig = {
  dieType: string;
  stat: string;
  modifier: number;
  dc?: number;
  faceCount: number;
  labels: string[];
  numberRange: [number, number];
};

function readConfig(html: string): DiceConfig {
  return extractJsonTagAttr<DiceConfig>(html, 'ta-dice', 'data-config');
}

describe('renderDice', () => {
  test('renders a ta-dice element with geometry config for the default d20', () => {
    const state = createDefaultState();
    state._lastComputation = {
      type: 'hazard_save',
      stat: 'CON',
      roll: 15,
      modifier: 2,
      total: 17,
      dc: 14,
      outcome: 'success',
      margin: 3,
    };
    const html = renderDice(state, '');
    const config = readConfig(html);
    expect(html).toContain('<ta-dice');
    expect(config.dieType).toBe('d20');
    expect(config.faceCount).toBe(20);
    expect(config.labels).toHaveLength(20);
    expect(config.numberRange).toEqual([1, 20]);
  });

  test('prefers explicit --data values over the last computation', () => {
    const state = createDefaultState();
    state._lastComputation = {
      type: 'hazard_save',
      stat: 'CON',
      roll: 15,
      modifier: 2,
      total: 17,
      dc: 14,
      outcome: 'success',
      margin: 3,
    };
    const html = renderDice(state, '', {
      data: { dieType: 'd12', stat: 'WIS', modifier: 5, dc: 18 },
    });
    const config = readConfig(html);
    expect(config.dieType).toBe('d12');
    expect(config.stat).toBe('WIS');
    expect(config.modifier).toBe(5);
    expect(config.dc).toBe(18);
    expect(config.faceCount).toBe(12);
  });

  test('supports d2 coin-flip rendering', () => {
    const state = createDefaultState();
    const html = renderDice(state, '', { data: { dieType: 'd2' } });
    const config = readConfig(html);
    expect(config.dieType).toBe('d2');
    expect(config.faceCount).toBe(2);
    expect(config.numberRange).toEqual([1, 2]);
  });

  test('falls back to d20 when dieType is invalid', () => {
    const state = createDefaultState();
    const html = renderDice(state, '', { data: { dieType: 'bogus' } });
    const config = readConfig(html);
    expect(config.dieType).toBe('d20');
    expect(config.faceCount).toBe(20);
  });

  test('uses contested-roll stat context when available', () => {
    const state = createDefaultState();
    state._lastComputation = {
      type: 'contested_roll',
      stat: 'CHA',
      roll: 14,
      modifier: 1,
      total: 15,
      margin: 2,
      outcome: 'success',
      npcId: 'sael_vane',
      npcModifier: 3,
      dc: 13,
    };
    const html = renderDice(state, '');
    const config = readConfig(html);
    expect(config.stat).toBe('CHA');
    expect(config.modifier).toBe(1);
    expect(config.dc).toBe(13);
  });

  test('uses ??? and zero modifier when no roll computation is present', () => {
    const state = createDefaultState();
    const html = renderDice(state, '');
    const config = readConfig(html);
    expect(config.stat).toBe('???');
    expect(config.modifier).toBe(0);
    expect(config.dc).toBeUndefined();
  });
});
