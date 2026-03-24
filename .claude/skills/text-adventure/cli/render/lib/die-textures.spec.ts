import { describe, test, expect } from 'bun:test';
import { FONT_SCALE } from './die-textures';
import type { DieType } from '../../types';

describe('FONT_SCALE', () => {
  test('has entries for all standard die types including d100', () => {
    for (const dt of ['d2', 'd4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as DieType[]) {
      expect(typeof FONT_SCALE[dt]).toBe('number');
      expect(FONT_SCALE[dt]).toBeGreaterThan(0);
      expect(FONT_SCALE[dt]).toBeLessThanOrEqual(1);
    }
  });

  test('d6 has larger font scale than d20', () => {
    expect(FONT_SCALE.d6).toBeGreaterThan(FONT_SCALE.d20);
  });

  test('d100 has smaller scale than d10 for two-digit labels', () => {
    expect(FONT_SCALE.d100).toBeLessThan(FONT_SCALE.d10);
  });
});
