import { describe, test, expect, spyOn } from 'bun:test';
import { generateWebGLDiceCode } from './webgl-dice';
import { DIE_CONFIGS } from './die-geometries';
import { FONT_SCALE } from './die-textures';
import { append, createRenderRuntime, executeGeneratedCode, makeElement } from '../../tests/support/runtime-harness';

function mountStandardDice(env: ReturnType<typeof createRenderRuntime>) {
  const root = append(env.document.body, makeElement(env.document, 'div', { classes: ['widget-dice'] }), env.document);
  const clickZone = append(root, makeElement(env.document, 'div', { id: 'cz' }), env.document);
  append(clickZone, makeElement(env.document, 'canvas', { id: 'cv' }), env.document);
  const hint = append(root, makeElement(env.document, 'div', { id: 'hi' }), env.document);
  const result = append(root, makeElement(env.document, 'div', { id: 'ra' }), env.document);
  const value = append(result, makeElement(env.document, 'div', { id: 'xv' }), env.document);
  append(result, makeElement(env.document, 'div', { id: 'xm' }), env.document);
  const total = append(result, makeElement(env.document, 'div', { id: 'xt' }), env.document);
  const dc = append(result, makeElement(env.document, 'div', { id: 'xd' }), env.document);
  const outcome = append(result, makeElement(env.document, 'div', { id: 'xo' }), env.document);
  const margin = append(result, makeElement(env.document, 'div', { id: 'xg' }), env.document);

  return { clickZone, hint, result, value, total, dc, outcome, margin };
}

function mountCoinDice(env: ReturnType<typeof createRenderRuntime>) {
  const root = append(env.document.body, makeElement(env.document, 'div', { classes: ['widget-dice'] }), env.document);
  const clickZone = append(root, makeElement(env.document, 'div', { id: 'cz' }), env.document);
  append(clickZone, makeElement(env.document, 'canvas', { id: 'cv' }), env.document);
  const hint = append(root, makeElement(env.document, 'div', { id: 'hi' }), env.document);
  const result = append(root, makeElement(env.document, 'div', { id: 'ra' }), env.document);
  const value = append(result, makeElement(env.document, 'div', { id: 'xv' }), env.document);
  const outcome = append(result, makeElement(env.document, 'div', { id: 'xo' }), env.document);

  return { clickZone, hint, result, value, outcome };
}

function mountD100Dice(env: ReturnType<typeof createRenderRuntime>) {
  const root = append(
    env.document.body,
    makeElement(env.document, 'div', { classes: ['widget-dice', 'widget-dice-d100'] }),
    env.document,
  );
  const rollArea = append(root, makeElement(env.document, 'div', { id: 'rollArea' }), env.document);
  const dw1 = append(rollArea, makeElement(env.document, 'div', { classes: ['dw'] }), env.document);
  const cz1 = append(dw1, makeElement(env.document, 'div', { classes: ['cz'] }), env.document);
  append(cz1, makeElement(env.document, 'canvas', { id: 'cvT' }), env.document);
  const dw2 = append(rollArea, makeElement(env.document, 'div', { classes: ['dw'] }), env.document);
  const cz2 = append(dw2, makeElement(env.document, 'div', { classes: ['cz'] }), env.document);
  append(cz2, makeElement(env.document, 'canvas', { id: 'cvU' }), env.document);
  const hint = append(root, makeElement(env.document, 'div', { id: 'hi' }), env.document);
  const result = append(root, makeElement(env.document, 'div', { id: 'ra' }), env.document);
  const tens = append(result, makeElement(env.document, 'div', { id: 'xvT' }), env.document);
  const units = append(result, makeElement(env.document, 'div', { id: 'xvU' }), env.document);
  const total = append(result, makeElement(env.document, 'div', { id: 'xt' }), env.document);

  return { rollArea, hint, result, tens, units, total };
}

describe('generateWebGLDiceCode', () => {
  const standardCode = generateWebGLDiceCode({
    dieType: 'd20',
    config: DIE_CONFIGS.d20,
    fontScale: FONT_SCALE.d20,
    modifier: 3,
    dc: 15,
  });

  const coinCode = generateWebGLDiceCode({
    dieType: 'd2',
    config: DIE_CONFIGS.d2,
    fontScale: FONT_SCALE.d2,
    modifier: 0,
    dc: null,
  });

  const d100Code = generateWebGLDiceCode({
    dieType: 'd100',
    config: DIE_CONFIGS.d100,
    fontScale: FONT_SCALE.d100,
    modifier: 0,
    dc: 50,
  });

  const d12Code = generateWebGLDiceCode({
    dieType: 'd12',
    config: DIE_CONFIGS.d12,
    fontScale: FONT_SCALE.d12,
    modifier: 1,
    dc: 10,
  });

  test('returns non-empty strings for all 3 render modes', () => {
    expect(standardCode.length).toBeGreaterThan(0);
    expect(coinCode.length).toBeGreaterThan(0);
    expect(d100Code.length).toBeGreaterThan(0);
    expect(d12Code.length).toBeGreaterThan(0);
  });

  test('specialized standard code stays under 18KB', () => {
    expect(standardCode.length).toBeLessThan(18 * 1024);
  });

  test('compiles shaders and creates a WebGL context', () => {
    expect(standardCode).toContain('getContext');
    expect(standardCode).toContain('createShader');
    expect(standardCode).toContain('createProgram');
    expect(standardCode).toContain('gl_Position');
    expect(standardCode).toContain('gl_FragColor');
  });

  test('contains the expected math and buffer helpers', () => {
    for (const fn of [
      'v3s',
      'v3x',
      'v3d',
      'v3n',
      'qnm',
      'qAl',
      'qsl',
      'm4m',
      'm4p',
      'm4q',
      'm4i',
      'buildMesh',
      'mkB',
      'mkT',
      'spinSettle',
      'eOB',
    ]) {
      expect(standardCode).toContain(`function ${fn}(`);
    }
  });

  test('uses requestAnimationFrame for idle and settle animation', () => {
    expect(standardCode).toContain('requestAnimationFrame');
    expect(coinCode).toContain('requestAnimationFrame');
    expect(d100Code).toContain('requestAnimationFrame');
  });

  test('supports prefers-reduced-motion', () => {
    expect(standardCode).toContain('prefers-reduced-motion');
  });

  test('standard output contains only the standard roll path', () => {
    expect(standardCode).toContain('var MOD=3,DC=15,rolling=false,locked=false;');
    expect(standardCode).toContain('function doRoll(');
    expect(standardCode).toContain('function showRes(roll)');
    expect(standardCode).not.toContain('function doFlip(');
    expect(standardCode).not.toContain('function showRes(tv,uv)');
    expect(standardCode).not.toContain('HEADS');
  });

  test('coin output contains only the coin flip path', () => {
    expect(coinCode).toContain('function doFlip(');
    expect(coinCode).toContain('HEADS');
    expect(coinCode).toContain('TAILS');
    expect(coinCode).not.toContain('function doRoll(');
    expect(coinCode).not.toContain('var MOD=');
    expect(coinCode).not.toContain('function showRes(tv,uv)');
  });

  test('d100 output contains the percentile-specific face assignment', () => {
    expect(d100Code).toContain('ASSIGN=[1,3,5,7,9,0,8,6,4,2]');
    expect(d100Code).toContain('function showRes(tv,uv)');
    expect(d100Code).toContain('tot===0)tot=100');
    expect(d100Code).not.toContain('function doFlip(');
  });

  test('d12 output uses the specialised outcome ladder', () => {
    expect(d12Code).toContain("lbl='CRIT SUCCESS'");
    expect(d12Code).toContain("lbl='NARROW FAILURE'");
    expect(d12Code).not.toContain("lbl='CRITICAL SUCCESS'");
  });

  test('standard mode can generate fallback sequential labels when a config has no assign map', () => {
    const { assign: _unused, ...configWithoutAssign } = DIE_CONFIGS.d6;
    const customCode = generateWebGLDiceCode({
      dieType: 'd6',
      config: configWithoutAssign,
      fontScale: FONT_SCALE.d6,
      modifier: 0,
      dc: 10,
    });
    expect(customCode).toContain('ASSIGN=[1,2,3,4,5,6]');
  });

  test('all modes are valid JS', () => {
    expect(() => new Function(standardCode)).not.toThrow();
    expect(() => new Function(coinCode)).not.toThrow();
    expect(() => new Function(d100Code)).not.toThrow();
    expect(() => new Function(d12Code)).not.toThrow();
  });

  test('coin code executes and resolves a deterministic HEADS result', () => {
    const env = createRenderRuntime({ reducedMotion: true });
    const { clickZone, hint, result, value, outcome } = mountCoinDice(env);

    executeGeneratedCode(coinCode, env);

    const randomSpy = spyOn(Math, 'random').mockReturnValue(0);
    try {
      clickZone.dispatch('click');
    } finally {
      randomSpy.mockRestore();
    }

    expect(hint.classList.contains('hd')).toBe(true);
    expect(result.classList.contains('v')).toBe(true);
    expect(value.textContent).toBe('HEADS');
    expect(outcome.textContent).toBe('HEADS');
  });

  test('d100 code executes and maps 00 + 0 to 100', () => {
    const env = createRenderRuntime({ reducedMotion: true });
    const { rollArea, hint, result, tens, units, total } = mountD100Dice(env);

    executeGeneratedCode(d100Code, env);

    const randomSpy = spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0);
    try {
      rollArea.dispatch('click');
    } finally {
      randomSpy.mockRestore();
    }

    expect(hint.classList.contains('hd')).toBe(true);
    expect(result.classList.contains('v')).toBe(true);
    expect(tens.textContent).toBe('00');
    expect(units.textContent).toBe('0');
    expect(total.textContent).toBe('100');
  });

  test('d12 code executes the specialised outcome ladder', () => {
    const env = createRenderRuntime({ reducedMotion: true });
    const { clickZone, result, value, total, dc, outcome, margin } = mountStandardDice(env);

    executeGeneratedCode(d12Code, env);

    const randomSpy = spyOn(Math, 'random').mockReturnValue(0);
    try {
      clickZone.dispatch('click');
    } finally {
      randomSpy.mockRestore();
    }

    expect(result.classList.contains('v')).toBe(true);
    expect(value.textContent).toBe('1');
    expect(total.textContent).toBe('2');
    expect(dc.textContent).toBe('DC 10');
    expect(outcome.textContent).toBe('CRIT FAILURE');
    expect(margin.textContent).toBe('Failed by 8');
  });

  test('standard code animates and settles when reduced motion is disabled', () => {
    const env = createRenderRuntime({ reducedMotion: false });
    const { clickZone, result, total, outcome } = mountStandardDice(env);

    executeGeneratedCode(standardCode, env);

    const randomSpy = spyOn(Math, 'random').mockReturnValue(0);
    try {
      clickZone.dispatch('click');
      expect(result.classList.contains('v')).toBe(false);
      env.flushAnimationFrames();
    } finally {
      randomSpy.mockRestore();
    }

    expect(result.classList.contains('v')).toBe(true);
    expect(total.textContent).toBe('4');
    expect(outcome.textContent).toBe('CRITICAL FAILURE');
  });
});
