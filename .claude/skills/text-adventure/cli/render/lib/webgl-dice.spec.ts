import { describe, test, expect } from 'bun:test';
import { generateWebGLDiceCode } from './webgl-dice';

describe('generateWebGLDiceCode', () => {
  // WebGL dice tests use substring/token-presence checks because the output
  // is a minified JS string that requires a browser WebGL context to execute.
  // Structural validation beyond token presence is not feasible without a headless browser.
  const code = generateWebGLDiceCode();

  test('returns a non-empty string', () => {
    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThan(0);
  });

  test('is under 17KB', () => {
    expect(code.length).toBeLessThan(17 * 1024);
  });

  // WebGL context and setup
  test('creates a WebGL context', () => {
    expect(code).toContain('getContext');
    expect(code).toMatch(/webgl/);
  });

  test('compiles shaders', () => {
    expect(code).toContain('createShader');
    expect(code).toContain('createProgram');
    expect(code).toContain('shaderSource');
  });

  test('contains vertex and fragment shader source', () => {
    expect(code).toContain('gl_Position');
    expect(code).toContain('gl_FragColor');
  });

  test('sets up buffers', () => {
    expect(code).toContain('createBuffer');
    expect(code).toContain('bufferData');
  });

  test('creates texture from canvas', () => {
    expect(code).toContain('createTexture');
    expect(code).toContain('texImage2D');
  });

  // Math library
  test('contains mat4 operations', () => {
    expect(code).toContain('m4m');   // matrix multiply
    expect(code).toContain('m4p');   // perspective
    expect(code).toContain('m4q');   // from quaternion
  });

  test('contains quaternion operations', () => {
    expect(code).toContain('qnm');   // normalize
    expect(code).toContain('qAl');   // align (from→to)
    expect(code).toContain('qsl');   // slerp
  });

  test('contains vec3 operations', () => {
    expect(code).toContain('normalize');  // in GLSL shader source
    expect(code).toContain('v3x');        // cross product
    expect(code).toContain('v3d');        // dot product
  });

  // Animation
  test('uses requestAnimationFrame', () => {
    expect(code).toContain('requestAnimationFrame');
  });

  test('has easeOutBack settle', () => {
    expect(code).toContain('eOB');   // easeOutBack
  });

  // Accessibility
  test('supports prefers-reduced-motion', () => {
    expect(code).toContain('prefers-reduced-motion');
  });

  // Texture atlas approach
  test('creates texture atlas with numbered faces', () => {
    expect(code).toContain('fillText');
    expect(code).toContain('atlas');
  });

  // ── Structural validity ────────────────────────────────────────────
  test('is valid JS (parseable by new Function)', () => {
    // new Function(code) parses without executing — validates syntax only.
    // This is safe: the code string is a build-time constant, not user input.
    expect(() => new Function(code)).not.toThrow();
  });

  test('contains all expected function definitions', () => {
    // Compact renamed functions (v3s=sub, v3x=cross, v3d=dot, v3n=norm,
    // qnm=norm, qAl=align, qsl=slerp, m4m=mul, m4p=persp, m4q=fromQuat,
    // m4i=identity, eOB=easeOutBack)
    for (const fn of ['v3s','v3x','v3d','v3n','qnm','qAl','qsl','m4m','m4p','m4q','m4i',
                      'buildMesh','createAtlas','mkBuf','mkTex','bindBuf','spinSettle','eOB']) {
      expect(code).toContain(`function ${fn}(`);
    }
  });

  test('handles all 3 die type branches (d2, d100, standard)', () => {
    expect(code).toContain('IS_D2');
    expect(code).toContain('IS_D100');
    expect(code).toContain('CONFIG.customVertices');  // all geometry from CONFIG, no GEOS table
  });
});
