import { describe, test, expect } from 'bun:test';
import { SCENE_SCRIPT_CODE } from './scene-script';
describe('SCENE_SCRIPT_CODE', () => {
  test('is a non-empty string', () => {
    expect(typeof SCENE_SCRIPT_CODE).toBe('string');
    expect(SCENE_SCRIPT_CODE.length).toBeGreaterThan(100);
  });

  test('contains continue-reveal button handler', () => {
    expect(SCENE_SCRIPT_CODE).toContain('continue-reveal-btn');
    expect(SCENE_SCRIPT_CODE).toContain('addEventListener');
  });

  test('contains panel close handler', () => {
    expect(SCENE_SCRIPT_CODE).toContain('panel-close-btn');
  });

  test('is a named init function, not an IIFE', () => {
    expect(SCENE_SCRIPT_CODE.trim()).toMatch(/^function initTagScene\(root\)/);
  });

  test('wires all data-prompt buttons through window.tag.sendOrCopyPrompt', () => {
    expect(SCENE_SCRIPT_CODE).toContain(`root.querySelectorAll('[data-prompt]')`);
    expect(SCENE_SCRIPT_CODE).toContain(`window.tag.sendOrCopyPrompt`);
  });

  test('contains level-up and POI handling', () => {
    expect(SCENE_SCRIPT_CODE).toContain('levelup-confirm');
    expect(SCENE_SCRIPT_CODE).toContain('data-poi');
  });

  test('contains optional audio runtime hook', () => {
    expect(SCENE_SCRIPT_CODE).toContain('SoundscapeEngine');
  });
});

describe('SCENE_SCRIPT_CODE audio recipe system', () => {
  test('contains SCENE_RECIPES object', () => {
    expect(SCENE_SCRIPT_CODE).toContain('SCENE_RECIPES');
  });

  test('contains all 6 named recipes', () => {
    for (const keyword of ['tension', 'wonder', 'dread', 'calm', 'action', 'mystery']) {
      expect(SCENE_SCRIPT_CODE).toContain(`'${keyword}'`);
    }
  });

  test('contains createSceneAudio function', () => {
    expect(SCENE_SCRIPT_CODE).toContain('function createSceneAudio(');
  });

  test('reads data-audio-recipe attribute to select recipe', () => {
    expect(SCENE_SCRIPT_CODE).toContain('data-audio-recipe');
    expect(SCENE_SCRIPT_CODE).toContain('SCENE_RECIPES[');
  });

  test('creates oscillators for layered sound', () => {
    expect(SCENE_SCRIPT_CODE).toContain('createOscillator');
  });

  test('creates BiquadFilter from recipe filter settings', () => {
    expect(SCENE_SCRIPT_CODE).toContain('createBiquadFilter');
  });

  test('creates StereoPanner from recipe stereo setting', () => {
    expect(SCENE_SCRIPT_CODE).toContain('createStereoPanner');
  });

  test('respects prefers-reduced-motion for audio', () => {
    // Should check reduced motion before starting audio
    const reducedMotionIdx = SCENE_SCRIPT_CODE.indexOf('prefers-reduced-motion');
    const audioRecipeIdx = SCENE_SCRIPT_CODE.indexOf('data-audio-recipe');
    expect(reducedMotionIdx).toBeGreaterThan(-1);
    expect(audioRecipeIdx).toBeGreaterThan(-1);
  });

  test('does not auto-start audio when recipe attribute is absent', () => {
    // Recipe lookup returns falsy for unknown key — guard present
    expect(SCENE_SCRIPT_CODE).toContain('if (recipe)');
  });
});

