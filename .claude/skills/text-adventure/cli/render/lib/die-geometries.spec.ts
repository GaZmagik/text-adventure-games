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

// ── trianglesPerFace ─────────────────────────────────────────────────

describe('trianglesPerFace', () => {
  const expected: Record<string, number> = {
    d2: 1, d4: 1, d6: 2, d8: 1, d10: 2, d12: 3, d20: 1, d100: 2,
  };
  for (const [dt, tpf] of Object.entries(expected)) {
    test(`${dt} has trianglesPerFace=${tpf}`, () => {
      expect(DIE_CONFIGS[dt as keyof typeof DIE_CONFIGS].trianglesPerFace as number).toBe(tpf);
    });
  }
});

// ── assign arrays (face-index → label) ──────────────────────────────

describe('assign arrays', () => {
  test('d4 assign has 4 entries matching [1,3,4,2]', () => {
    expect(DIE_CONFIGS.d4.assign).toEqual([1, 3, 4, 2]);
  });

  test('d6 assign has 6 entries matching [1,6,2,5,3,4]', () => {
    expect(DIE_CONFIGS.d6.assign).toEqual([1, 6, 2, 5, 3, 4]);
  });

  test('d8 assign has 8 entries matching [1,2,6,5,3,4,8,7]', () => {
    expect(DIE_CONFIGS.d8.assign).toEqual([1, 2, 6, 5, 3, 4, 8, 7]);
  });

  test('d12 assign has 12 entries', () => {
    expect(DIE_CONFIGS.d12.assign).toHaveLength(12);
    // every value 1-12 appears exactly once
    const vals = [...DIE_CONFIGS.d12.assign!].sort((a, b) => a - b);
    expect(vals).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  test('d20 assign has 20 entries', () => {
    expect(DIE_CONFIGS.d20.assign).toHaveLength(20);
    // every value 1-20 appears exactly once
    const vals = ([...DIE_CONFIGS.d20.assign!] as number[]).sort((a, b) => a - b);
    expect(vals).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  test('d10 and d100 have no assign (label lookup is modular)', () => {
    expect((DIE_CONFIGS.d10 as { assign?: number[] }).assign).toBeUndefined();
    expect((DIE_CONFIGS.d100 as { assign?: number[] }).assign).toBeUndefined();
  });
});

// ── standard polyhedra geometry counts ──────────────────────────────

describe('standard polyhedra geometry', () => {
  test('d4 has 4 vertices and 4 faces', () => {
    expect(DIE_CONFIGS.d4.customVertices!.length).toBe(4);
    expect(DIE_CONFIGS.d4.customFaces!.length).toBe(4);
  });

  test('d6 has 8 vertices and 12 triangle faces (6 quads × 2)', () => {
    expect(DIE_CONFIGS.d6.customVertices!.length).toBe(8);
    expect(DIE_CONFIGS.d6.customFaces!.length).toBe(12);
  });

  test('d8 has 6 vertices and 8 faces', () => {
    expect(DIE_CONFIGS.d8.customVertices!.length).toBe(6);
    expect(DIE_CONFIGS.d8.customFaces!.length).toBe(8);
  });

  test('d12 has 20 vertices and 36 triangle faces (12 pentagons × 3)', () => {
    expect(DIE_CONFIGS.d12.customVertices!.length).toBe(20);
    expect(DIE_CONFIGS.d12.customFaces!.length).toBe(36);
  });

  test('d20 has 12 vertices and 20 faces', () => {
    expect(DIE_CONFIGS.d20.customVertices!.length).toBe(12);
    expect(DIE_CONFIGS.d20.customFaces!.length).toBe(20);
  });

  test('all face indices are within vertex bounds for each standard polyhedron', () => {
    for (const dt of ['d4', 'd6', 'd8', 'd12', 'd20'] as const) {
      const cfg = DIE_CONFIGS[dt];
      const vCount = cfg.customVertices!.length;
      for (const face of cfg.customFaces!) {
        for (const idx of face) {
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThan(vCount);
        }
      }
    }
  });
});
