import { describe, expect, test } from 'bun:test';
import { extractJsonTagAttr } from '../../tests/support/rendered-widget';
import { MAX_DICE_POOL_TOTAL, renderDicePool } from './dice-pool';

type DicePoolPayload = {
  label: string;
  expression: string;
  modifier: number;
  pool: Array<{ dieType: string; count: number }>;
  maxDice: number;
  truncationNote: string;
};

function readPool(html: string): DicePoolPayload {
  return extractJsonTagAttr<DicePoolPayload>(html, 'ta-dice-pool', 'data-config');
}

describe('renderDicePool', () => {
  test('normalises valid dice pool options into WebGL config data', () => {
    const pool = readPool(
      renderDicePool(null, '', {
        data: {
          label: 'Attack Pool',
          modifier: 3,
          pool: [
            { dieType: 'd20', count: 2 },
            { dieType: 'd6', count: 4 },
          ],
        },
      }),
    );

    expect(pool.label).toBe('Attack Pool');
    expect(pool.modifier).toBe(3);
    expect(pool.expression).toBe('2d20 + 4d6');
    expect(pool.maxDice).toBe(MAX_DICE_POOL_TOTAL);
  });

  test('caps oversized pools to protect rendering performance', () => {
    const pool = readPool(
      renderDicePool(null, '', {
        data: {
          pool: [
            { dieType: 'd20', count: 30 },
            { dieType: 'd6', count: 10 },
          ],
        },
      }),
    );

    expect(pool.pool.reduce((sum, group) => sum + group.count, 0)).toBe(MAX_DICE_POOL_TOTAL);
    expect(pool.truncationNote).toContain('Displaying 24 of 34 dice');
    expect(pool.truncationNote).toContain('for stability');
  });

  test('falls back to a small d6 pool for invalid input', () => {
    const pool = readPool(renderDicePool(null, '', { data: { pool: [{ dieType: 'bad', count: 99 }] } }));

    expect(pool.pool).toEqual([{ dieType: 'd6', count: 2 }]);
    expect(pool.expression).toBe('2d6');
  });
});
