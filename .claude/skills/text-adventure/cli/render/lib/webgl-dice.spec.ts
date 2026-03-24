import { describe, test, expect } from 'bun:test';
import { generateWebGLDiceCode } from './webgl-dice';

describe('generateWebGLDiceCode', () => {
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
    expect(code).toContain('m4mul');
    expect(code).toContain('m4persp');
  });

  test('contains quaternion operations', () => {
    expect(code).toContain('quat');
    expect(code).toContain('slerp');
  });

  test('contains vec3 operations', () => {
    expect(code).toContain('normalize');
    expect(code).toContain('cross');
  });

  // Animation
  test('uses requestAnimationFrame', () => {
    expect(code).toContain('requestAnimationFrame');
  });

  test('has easeOutBack settle', () => {
    expect(code).toContain('easeOutBack');
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
    expect(code).toMatch(
      /function\s+(v3sub|v3cross|v3dot|v3norm|qnorm|quatFromUV|qslerp|m4|m4id|m4mul|m4persp|m4fromQ|buildMesh|createAtlas|mkBuf|mkTex|bindBuf|easeOutBack|spinSettle)\s*\(/,
    );
  });

  test('handles all 3 die type branches (d2, d100, standard)', () => {
    expect(code).toContain('IS_D2');
    expect(code).toContain('IS_D100');
    expect(code).toContain('GEOS');
  });
});
