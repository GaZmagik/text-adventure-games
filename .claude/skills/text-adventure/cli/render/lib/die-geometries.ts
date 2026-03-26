// Die geometry configurations for all standard RPG die types.
// Provides geometry metadata consumed by the inline WebGL renderer (webgl-dice.ts).
// All vertices are pre-normalised to the unit sphere (except d10/d100 — kite faces
// require non-spherical geometry to satisfy the coplanarity constraint).
// d10 faces are winding-corrected at module init so the JS renderer needs no
// runtime correction pass.

export type DieConfig = {
  faceCount: number;
  numberRange: [number, number]; // [min, max] inclusive
  geometryType: string;          // Geometry shape identifier (informational)
  geometryArgs?: number[];       // Kept for reference
  customVertices?: number[][];   // [x, y, z] per vertex — all die types
  customFaces?: number[][];      // [a, b, c] triangle indices — all die types
  trianglesPerFace: number;      // How many triangles make one logical die face
  paired?: boolean;              // true for d100 (two d10s side-by-side)
  assign?: number[];             // face-index → number label (d4/d6/d8/d12/d20)
};

// ── Geometry helpers ──────────────────────────────────────────────────────────
function norm3(v: number[]): number[] {
  const l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

// ── D4 tetrahedron ────────────────────────────────────────────────────────────
// Vertices normalised to unit sphere. ASSIGN=[1,3,4,2] pairs sum to 5.
function d4Geometry(): { verts: number[][], faces: number[][] } {
  const verts = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].map(norm3);
  const faces = [[2, 1, 0], [0, 3, 2], [1, 3, 0], [2, 3, 1]];
  return { verts, faces };
}

// ── D6 cube ───────────────────────────────────────────────────────────────────
// Vertices normalised to unit sphere. ASSIGN=[1,6,2,5,3,4] opposite faces sum to 7.
function d6Geometry(): { verts: number[][], faces: number[][] } {
  const verts = [
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    [-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1],
  ].map(norm3);
  const faces = [
    [0, 1, 2], [0, 2, 3],  // face 0: front
    [4, 5, 6], [4, 6, 7],  // face 1: back
    [3, 2, 6], [3, 6, 5],  // face 2: top
    [0, 4, 7], [0, 7, 1],  // face 3: bottom
    [1, 7, 6], [1, 6, 2],  // face 4: right
    [0, 3, 5], [0, 5, 4],  // face 5: left
  ];
  return { verts, faces };
}

// ── D8 octahedron ─────────────────────────────────────────────────────────────
// Vertices already unit length. ASSIGN=[1,2,6,5,3,4,8,7] opposite faces sum to 9.
function d8Geometry(): { verts: number[][], faces: number[][] } {
  const verts = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const faces = [
    [0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2],
    [1, 4, 2], [1, 3, 4], [1, 5, 3], [1, 2, 5],
  ];
  return { verts, faces };
}

// ── D12 dodecahedron ──────────────────────────────────────────────────────────
// 20 vertices (normalised), 12 pentagonal faces split into 3 triangles each.
function d12Geometry(): { verts: number[][], faces: number[][] } {
  const T = (1 + Math.sqrt(5)) / 2;
  const R = 1 / T;
  const verts = [
    [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1],
    [1, -1, -1], [1, -1, 1], [1, 1, -1], [1, 1, 1],
    [0, -R, -T], [0, -R, T], [0, R, -T], [0, R, T],
    [-R, -T, 0], [-R, T, 0], [R, -T, 0], [R, T, 0],
    [-T, 0, -R], [-T, 0, R], [T, 0, -R], [T, 0, R],
  ].map(norm3);
  const flat = [
    0, 8, 4, 0, 4, 14, 0, 14, 12,  0, 8, 10, 0, 10, 2, 0, 2, 16,  0, 12, 1, 0, 1, 17, 0, 17, 16,
    1, 9, 5, 1, 5, 14, 1, 14, 12,  1, 9, 11, 1, 11, 3, 1, 3, 17,  2, 10, 6, 2, 6, 15, 2, 15, 13,
    2, 13, 3, 2, 3, 17, 2, 17, 16, 3, 11, 7, 3, 7, 15, 3, 15, 13, 4, 8, 10, 4, 10, 6, 4, 6, 18,
    4, 14, 5, 4, 5, 19, 4, 19, 18, 5, 9, 11, 5, 11, 7, 5, 7, 19,  6, 15, 7, 6, 7, 19, 6, 19, 18,
  ];
  const faces: number[][] = [];
  for (let i = 0; i < flat.length; i += 3) faces.push([flat[i], flat[i + 1], flat[i + 2]]);
  return { verts, faces };
}

// ── D20 icosahedron ───────────────────────────────────────────────────────────
// 12 vertices (normalised), 20 triangular faces.
function d20Geometry(): { verts: number[][], faces: number[][] } {
  const phi = (1 + Math.sqrt(5)) / 2;
  const verts = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
  ].map(norm3);
  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  return { verts, faces };
}

// ── D10 pentagonal trapezohedron vertices ─────────────────────────────────────
// 12 vertices: 2 poles + 2 rings of 5.
// Coplanarity of kite faces requires d/h = (1−cos36°)/(1+cos36°) ≈ 0.1056.
// d=0.35 violates this, making each kite's two triangles non-coplanar → visible seam.
// r=0.72 gives aspect ratio ≈ 1.39, matching a physical d10.
function d10Vertices(): number[][] {
  const r = 0.72;
  const h = 1.0;
  const d = 0.106;
  const verts: number[][] = [];

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

// ── D10 winding-corrected geometry ────────────────────────────────────────────
// Builds raw faces, applies centroid-based winding correction, and computes exact
// cross-product normals. Pre-correcting here eliminates the runtime correction pass
// in the WebGL renderer and ensures correct flat-face shading.
function d10Geometry(): { verts: number[][], faces: number[][] } {
  const verts = d10Vertices();

  // Build raw kite faces — each kite splits into 2 triangles
  const raw: number[][] = [];
  for (let i = 0; i < 5; i++) {
    const u0 = 2 + i, u1 = 2 + ((i + 1) % 5), lo = 7 + i;
    raw.push([0, u0, lo], [0, lo, u1]);  // upper kites
  }
  for (let i = 0; i < 5; i++) {
    const lo0 = 7 + i, lo1 = 7 + ((i + 1) % 5), up = 2 + ((i + 1) % 5);
    raw.push([1, lo1, up], [1, up, lo0]);  // lower kites
  }

  // Apply winding correction: for each kite face (2 triangles), check that each
  // triangle's cross-product normal agrees with the centroid-based outward direction.
  const faces = raw.map(t => [...t]);
  const FC = 10, TPF = 2;
  for (let fi = 0; fi < FC; fi++) {
    // Collect unique vertex indices for this kite
    const seen = new Set<number>();
    for (let t = 0; t < TPF; t++) faces[fi * TPF + t].forEach(idx => seen.add(idx));
    const keys = [...seen];
    let cx = 0, cy = 0, cz = 0;
    for (const idx of keys) { cx += verts[idx][0]; cy += verts[idx][1]; cz += verts[idx][2]; }
    const cn = norm3([cx / keys.length, cy / keys.length, cz / keys.length]);

    for (let t = 0; t < TPF; t++) {
      const tri = faces[fi * TPF + t];
      const [a, b, c] = [verts[tri[0]], verts[tri[1]], verts[tri[2]]];
      const cross = [
        (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]),
        (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]),
        (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]),
      ];
      if (cross[0] * cn[0] + cross[1] * cn[1] + cross[2] * cn[2] < 0) {
        [tri[1], tri[2]] = [tri[2], tri[1]];
      }
    }
  }

  return { verts, faces };
}

// ── Lazy-init caches ──────────────────────────────────────────────────────────
let _d4: { verts: number[][], faces: number[][] } | null = null;
let _d6: { verts: number[][], faces: number[][] } | null = null;
let _d8: { verts: number[][], faces: number[][] } | null = null;
let _d12: { verts: number[][], faces: number[][] } | null = null;
let _d20: { verts: number[][], faces: number[][] } | null = null;
let _d10: { verts: number[][], faces: number[][] } | null = null;

function getD4(): { verts: number[][], faces: number[][] } { return (_d4 ??= d4Geometry()); }
function getD6(): { verts: number[][], faces: number[][] } { return (_d6 ??= d6Geometry()); }
function getD8(): { verts: number[][], faces: number[][] } { return (_d8 ??= d8Geometry()); }
function getD12(): { verts: number[][], faces: number[][] } { return (_d12 ??= d12Geometry()); }
function getD20(): { verts: number[][], faces: number[][] } { return (_d20 ??= d20Geometry()); }
function getD10(): { verts: number[][], faces: number[][] } { return (_d10 ??= d10Geometry()); }

// ── Configs ───────────────────────────────────────────────────────────────────

export const DIE_CONFIGS = {
  d2: {
    faceCount: 2,
    numberRange: [1, 2] as [number, number],
    geometryType: 'CylinderGeometry',
    geometryArgs: [0.8, 0.8, 0.15, 32],
    trianglesPerFace: 1, // coin caps — handled specially in renderer
  },
  d4: {
    faceCount: 4,
    numberRange: [1, 4] as [number, number],
    geometryType: 'TetrahedronGeometry',
    geometryArgs: [1, 0],
    get customVertices() { return getD4().verts; },
    get customFaces() { return getD4().faces; },
    trianglesPerFace: 1,
    assign: [1, 3, 4, 2],  // opposite pairs sum to 5
  },
  d6: {
    faceCount: 6,
    numberRange: [1, 6] as [number, number],
    geometryType: 'BoxGeometry',
    geometryArgs: [1.4, 1.4, 1.4],
    get customVertices() { return getD6().verts; },
    get customFaces() { return getD6().faces; },
    trianglesPerFace: 2,
    assign: [1, 6, 2, 5, 3, 4],  // opposite faces sum to 7
  },
  d8: {
    faceCount: 8,
    numberRange: [1, 8] as [number, number],
    geometryType: 'OctahedronGeometry',
    geometryArgs: [1, 0],
    get customVertices() { return getD8().verts; },
    get customFaces() { return getD8().faces; },
    trianglesPerFace: 1,
    assign: [1, 2, 6, 5, 3, 4, 8, 7],  // opposite pairs sum to 9
  },
  d10: {
    faceCount: 10,
    numberRange: [1, 10] as [number, number],
    geometryType: 'BufferGeometry',
    get customVertices() { return getD10().verts; },
    get customFaces() { return getD10().faces; },
    trianglesPerFace: 2,
  },
  d12: {
    faceCount: 12,
    numberRange: [1, 12] as [number, number],
    geometryType: 'DodecahedronGeometry',
    geometryArgs: [1, 0],
    get customVertices() { return getD12().verts; },
    get customFaces() { return getD12().faces; },
    trianglesPerFace: 3,  // pentagons triangulated into 3 triangles
    assign: [1, 2, 3, 4, 5, 9, 6, 12, 8, 7, 11, 10],
  },
  d20: {
    faceCount: 20,
    numberRange: [1, 20] as [number, number],
    geometryType: 'IcosahedronGeometry',
    geometryArgs: [1, 0],
    get customVertices() { return getD20().verts; },
    get customFaces() { return getD20().faces; },
    trianglesPerFace: 1,
    assign: [6, 10, 5, 13, 20, 17, 2, 14, 3, 12, 8, 16, 11, 15, 1, 18, 9, 4, 19, 7],
  },
  d100: {
    faceCount: 10,
    numberRange: [0, 9] as [number, number],
    geometryType: 'BufferGeometry',
    get customVertices() { return getD10().verts; },
    get customFaces() { return getD10().faces; },
    trianglesPerFace: 2,
    paired: true,
  },
} as const satisfies Record<string, DieConfig>;
