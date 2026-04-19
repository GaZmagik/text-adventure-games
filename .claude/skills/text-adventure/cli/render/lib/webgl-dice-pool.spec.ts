import { describe, test, expect, spyOn } from 'bun:test';
import { generateWebGLDicePoolCode } from './webgl-dice-pool';
import { DIE_CONFIGS } from './die-geometries';
import { FONT_SCALE } from './die-textures';
import {
  append,
  createRenderRuntime,
  executeGeneratedCode,
  makeElement,
} from '../../tests/support/runtime-harness';

function serialiseConfig(dieType: keyof typeof DIE_CONFIGS) {
  const config = DIE_CONFIGS[dieType];
  return {
    faceCount: config.faceCount,
    numberRange: [...config.numberRange],
    geometryType: config.geometryType,
    geometryArgs: 'geometryArgs' in config && config.geometryArgs ? [...config.geometryArgs] : [],
    customVertices: 'customVertices' in config ? config.customVertices ?? null : null,
    customFaces: 'customFaces' in config ? config.customFaces ?? null : null,
    assign: 'assign' in config ? config.assign ?? null : null,
    trianglesPerFace: config.trianglesPerFace,
    paired: 'paired' in config && !!config.paired,
  };
}

function mountPool(env: ReturnType<typeof createRenderRuntime>) {
  const root = append(env.document.body, makeElement(env.document, 'div', { id: 'dice-pool-target' }), env.document);
  const canvas = append(root, makeElement(env.document, 'canvas', { id: 'dice-pool-canvas' }), env.document);
  const hint = append(env.document.body, makeElement(env.document, 'div', { id: 'dice-pool-hint' }), env.document);
  const result = append(env.document.body, makeElement(env.document, 'div', { id: 'dice-pool-result' }), env.document);
  const total = append(result, makeElement(env.document, 'div', { id: 'dice-pool-total' }), env.document);
  const modifier = append(result, makeElement(env.document, 'div', { id: 'dice-pool-modifier' }), env.document);
  const groups = append(result, makeElement(env.document, 'div', { id: 'dice-pool-groups' }), env.document);

  return { root, canvas, hint, result, total, modifier, groups };
}

describe('generateWebGLDicePoolCode', () => {
  const code = generateWebGLDicePoolCode();

  test('returns a non-empty string', () => {
    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThan(0);
  });

  test('is under 22KB', () => {
    expect(code.length).toBeLessThan(22 * 1024);
  });

  test('creates a WebGL context', () => {
    expect(code).toContain('getContext');
    expect(code).toContain('webgl');
  });

  test('contains core math and mesh helpers', () => {
    for (const fn of ['v3s', 'v3x', 'v3d', 'v3n', 'qnm', 'qAl', 'qsl', 'm4m', 'm4p', 'm4q', 'buildMesh', 'createAtlas']) {
      expect(code).toContain(`function ${fn}(`);
    }
  });

  test('contains pool-specific rendering helpers', () => {
    expect(code).toContain('poolLayout');
    expect(code).toContain('slotOffset');
    expect(code).toContain('renderResults');
    expect(code).toContain('POOL_GROUPS');
  });

  test('supports requestAnimationFrame and reduced motion', () => {
    expect(code).toContain('requestAnimationFrame');
    expect(code).toContain('prefers-reduced-motion');
  });

  test('is valid JS (parseable by new Function)', () => {
    expect(() => new Function(code)).not.toThrow();
  });

  test('executes sanitisation, capping, and omission reporting deterministically', () => {
    const env = createRenderRuntime({ reducedMotion: true });
    const { root, canvas, hint, result, total, modifier, groups } = mountPool(env);

    executeGeneratedCode(code, env, {
      POOL_LABEL: 'Volley',
      POOL_GROUPS: [
        { dieType: 'd6', count: 2 },
        { dieType: 'bogus', count: 4 },
        { dieType: 'd8', count: 5 },
      ],
      POOL_MODIFIER: 2,
      POOL_CONFIG_MAP: {
        d6: serialiseConfig('d6'),
        d8: serialiseConfig('d8'),
      },
      POOL_FONT_MAP: {
        d6: FONT_SCALE.d6,
        d8: FONT_SCALE.d8,
      },
      POOL_MAX_DICE: 3,
    });

    const randomSpy = spyOn(Math, 'random').mockReturnValue(0);
    try {
      root.dispatch('click');
    } finally {
      randomSpy.mockRestore();
    }

    expect(hint.classList.contains('is-hidden')).toBe(true);
    expect(result.classList.contains('is-visible')).toBe(true);
    expect(total.textContent).toBe('5');
    expect(modifier.textContent).toBe('Displayed subtotal 3 + 2 = 5 (3 of 7 dice shown)');
    expect(groups.children).toHaveLength(3);
    expect(groups.children[0]!.children[1]!.textContent).toBe('1, 1 = 2');
    expect(groups.children[1]!.children[1]!.textContent).toBe('1');
    expect(groups.children[2]!.children[1]!.textContent).toContain('4 dice omitted');
    expect(canvas.getAttribute('aria-label')).toContain('4 dice omitted');
  });

  test('returns early when no valid pool groups survive sanitisation', () => {
    const env = createRenderRuntime({ reducedMotion: true });
    const { root, result, groups } = mountPool(env);

    executeGeneratedCode(code, env, {
      POOL_LABEL: 'Broken Pool',
      POOL_GROUPS: [{ dieType: 'bogus', count: 99 }],
      POOL_MODIFIER: 0,
      POOL_CONFIG_MAP: {},
      POOL_FONT_MAP: {},
      POOL_MAX_DICE: 3,
    });

    root.dispatch('click');

    expect(root.listeners.get('click')).toBeUndefined();
    expect(result.classList.contains('is-visible')).toBe(false);
    expect(groups.children).toHaveLength(0);
  });

  test('animates and settles through requestAnimationFrame when reduced motion is disabled', () => {
    const env = createRenderRuntime({ reducedMotion: false });
    const { root, result, total, modifier, groups } = mountPool(env);

    executeGeneratedCode(code, env, {
      POOL_LABEL: 'Volley',
      POOL_GROUPS: [{ dieType: 'd6', count: 2 }, { dieType: 'd8', count: 1 }],
      POOL_MODIFIER: 2,
      POOL_CONFIG_MAP: {
        d6: serialiseConfig('d6'),
        d8: serialiseConfig('d8'),
      },
      POOL_FONT_MAP: {
        d6: FONT_SCALE.d6,
        d8: FONT_SCALE.d8,
      },
      POOL_MAX_DICE: 24,
    });

    const randomSpy = spyOn(Math, 'random').mockReturnValue(0);
    try {
      root.dispatch('click');
      expect(result.classList.contains('is-visible')).toBe(false);
      env.flushAnimationFrames();
    } finally {
      randomSpy.mockRestore();
    }

    expect(result.classList.contains('is-visible')).toBe(true);
    expect(total.textContent).toBe('5');
    expect(modifier.textContent).toBe('Subtotal 3 + 2 = 5');
    expect(groups.children).toHaveLength(2);
  });
});
