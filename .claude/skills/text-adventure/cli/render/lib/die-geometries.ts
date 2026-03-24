// Die geometry configurations for all standard RPG die types.
// Provides geometry metadata consumed by the inline WebGL renderer (webgl-dice.ts).

export type DieConfig = {
  faceCount: number;
  numberRange: [number, number]; // [min, max] inclusive
  geometryType: string;          // Geometry shape identifier used by the WebGL renderer
  geometryArgs?: number[];       // Constructor args for standard geometries
  customVertices?: number[][];   // [x, y, z] per vertex — d10 only
  customFaces?: number[][];      // [a, b, c] triangle indices — d10 only
  trianglesPerFace: number;      // How many triangles make one logical die face
  paired?: boolean;              // true for d100 (two d10s side-by-side)
};

// ── D10 pentagonal trapezohedron vertices ────────────────────────────
// 12 vertices: 2 poles + 2 rings of 5
function d10Vertices(): number[][] {
  const verts: number[][] = [];
  const r = 0.9;
  const h = 1.0;
  const d = 0.35;

  // 0: top pole, 1: bottom pole
  verts.push([0, h, 0]);
  verts.push([0, -h, 0]);

  // 2–6: upper ring (y = +d, angles 0°, 72°, 144°, 216°, 288°)
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 * Math.PI) / 180;
    verts.push([+(r * Math.cos(a)).toFixed(4), d, +(r * Math.sin(a)).toFixed(4)]);
  }

  // 7–11: lower ring (y = −d, angles 36°, 108°, 180°, 252°, 324°)
  for (let i = 0; i < 5; i++) {
    const a = ((i * 72 + 36) * Math.PI) / 180;
    verts.push([+(r * Math.cos(a)).toFixed(4), -d, +(r * Math.sin(a)).toFixed(4)]);
  }

  return verts;
}

// Each kite face splits into 2 triangles.
// Upper kites share the top pole (idx 0); lower kites share the bottom pole (idx 1).
function d10Faces(): number[][] {
  const tris: number[][] = [];

  for (let i = 0; i < 5; i++) {
    const u0 = 2 + i;
    const u1 = 2 + ((i + 1) % 5);
    const lo = 7 + i;
    // Upper kite: top, upper[i], lower[i], upper[i+1]
    tris.push([0, u0, lo]);
    tris.push([0, lo, u1]);
  }

  for (let i = 0; i < 5; i++) {
    const lo0 = 7 + i;
    const lo1 = 7 + ((i + 1) % 5);
    const up = 2 + ((i + 1) % 5);
    // Lower kite: bottom, lower[i+1], upper[i+1], lower[i]
    tris.push([1, lo1, up]);
    tris.push([1, up, lo0]);
  }

  return tris;
}

// ── Lazy-init caches for d10/d100 geometry (shared) ──────────────────
let _d10Verts: number[][] | null = null;
let _d10Faces: number[][] | null = null;
function getD10Verts(): number[][] { return _d10Verts ??= d10Vertices(); }
function getD10Faces(): number[][] { return _d10Faces ??= d10Faces(); }

// ── Configs ──────────────────────────────────────────────────────────

export const DIE_CONFIGS = {
  d2: {
    faceCount: 2,
    numberRange: [1, 2] as [number, number],
    geometryType: 'CylinderGeometry',
    geometryArgs: [0.8, 0.8, 0.15, 32], // radius top, bottom, height, segments
    trianglesPerFace: 1, // handled specially — top and bottom caps
  },
  d4: {
    faceCount: 4,
    numberRange: [1, 4] as [number, number],
    geometryType: 'TetrahedronGeometry',
    geometryArgs: [1, 0],
    trianglesPerFace: 1,
  },
  d6: {
    faceCount: 6,
    numberRange: [1, 6] as [number, number],
    geometryType: 'BoxGeometry',
    geometryArgs: [1.4, 1.4, 1.4],
    trianglesPerFace: 2,
  },
  d8: {
    faceCount: 8,
    numberRange: [1, 8] as [number, number],
    geometryType: 'OctahedronGeometry',
    geometryArgs: [1, 0],
    trianglesPerFace: 1,
  },
  d10: {
    faceCount: 10,
    numberRange: [0, 9] as [number, number],
    geometryType: 'BufferGeometry',
    get customVertices() { return getD10Verts(); },
    get customFaces() { return getD10Faces(); },
    trianglesPerFace: 2,
  },
  d12: {
    faceCount: 12,
    numberRange: [1, 12] as [number, number],
    geometryType: 'DodecahedronGeometry',
    geometryArgs: [1, 0],
    trianglesPerFace: 3, // pentagons triangulated into 3 triangles
  },
  d20: {
    faceCount: 20,
    numberRange: [1, 20] as [number, number],
    geometryType: 'IcosahedronGeometry',
    geometryArgs: [1, 0],
    trianglesPerFace: 1,
  },
  d100: {
    faceCount: 10,
    numberRange: [0, 9] as [number, number],
    geometryType: 'BufferGeometry',
    get customVertices() { return getD10Verts(); },
    get customFaces() { return getD10Faces(); },
    trianglesPerFace: 2,
    paired: true,
  },
} as const satisfies Record<string, DieConfig>;
