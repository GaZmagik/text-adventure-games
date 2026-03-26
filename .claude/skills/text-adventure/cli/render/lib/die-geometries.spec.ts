import { describe, test, expect } from 'bun:test';
import { DIE_CONFIGS, type DieConfig } from './die-geometries';

const ALL_DIE_TYPES = ['d2', 'd4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as const;

describe('DIE_CONFIGS', () => {
  test('contains all 8 die types', () => {
    for (const dt of ALL_DIE_TYPES) {
      expect(DIE_CONFIGS[dt]).toBeDefined();
    }
  });

  test('each config has required fields', () => {
    for (const dt of ALL_DIE_TYPES) {
      const cfg = DIE_CONFIGS[dt];
      expect(typeof cfg.faceCount).toBe('number');
      expect(cfg.faceCount).toBeGreaterThan(0);
      expect(Array.isArray(cfg.numberRange)).toBe(true);
      expect(cfg.numberRange).toHaveLength(2);
      expect(cfg.numberRange[0]).toBeLessThanOrEqual(cfg.numberRange[1]);
      expect(typeof cfg.geometryType).toBe('string');
    }
  });

  const expectedFaces: Record<string, number> = {
    d2: 2, d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 10,
  };

  for (const [dt, expected] of Object.entries(expectedFaces)) {
    test(`${dt} has ${expected} faces`, () => {
      expect(DIE_CONFIGS[dt as keyof typeof DIE_CONFIGS].faceCount as number).toBe(expected);
    });
  }

  const expectedRanges: Record<string, [number, number]> = {
    d2: [1, 2], d4: [1, 4], d6: [1, 6], d8: [1, 8],
    d10: [1, 10], d12: [1, 12], d20: [1, 20], d100: [0, 9],
  };

  for (const [dt, [min, max]] of Object.entries(expectedRanges)) {
    test(`${dt} number range is ${min}-${max}`, () => {
      const cfg = DIE_CONFIGS[dt as keyof typeof DIE_CONFIGS];
      expect(cfg.numberRange[0]).toBe(min);
      expect(cfg.numberRange[1]).toBe(max);
    });
  }

  test('d10 has custom vertices', () => {
    expect(DIE_CONFIGS.d10.customVertices).toBeDefined();
    expect(DIE_CONFIGS.d10.customVertices!.length).toBeGreaterThan(0);
  });

  test('d100 is marked as paired', () => {
    expect(DIE_CONFIGS.d100.paired).toBe(true);
  });

  test('d2 uses CylinderGeometry', () => {
    expect(DIE_CONFIGS.d2.geometryType).toBe('CylinderGeometry');
  });

  test('d6 uses BoxGeometry', () => {
    expect(DIE_CONFIGS.d6.geometryType).toBe('BoxGeometry');
  });

  test('d20 uses IcosahedronGeometry', () => {
    expect(DIE_CONFIGS.d20.geometryType).toBe('IcosahedronGeometry');
  });
});

// ── T7: d10 vertex/face structural validation ────────────────────────

describe('d10 geometry structure', () => {
  test('has exactly 12 custom vertices (2 poles + 2 rings of 5)', () => {
    expect(DIE_CONFIGS.d10.customVertices!.length).toBe(12);
  });

  test('has exactly 20 custom faces (10 kites x 2 triangles each)', () => {
    expect(DIE_CONFIGS.d10.customFaces!.length).toBe(20);
  });

  test('every face index is within vertex bounds (>= 0 and < 12)', () => {
    const vertexCount = DIE_CONFIGS.d10.customVertices!.length;
    for (const face of DIE_CONFIGS.d10.customFaces!) {
      for (const idx of face) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(vertexCount);
      }
    }
  });
});

describe('d100 geometry structure', () => {
  test('has exactly 20 custom faces (same geometry as d10)', () => {
    expect(DIE_CONFIGS.d100.customFaces!.length).toBe(20);
  });
});
