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

  test('wires all data-prompt buttons through shared prompt handling', () => {
    expect(SCENE_SCRIPT_CODE).toContain(`root.querySelectorAll('[data-prompt]')`);
    expect(SCENE_SCRIPT_CODE).toContain(`document.execCommand('copy')`);
  });

  test('contains level-up and POI handling', () => {
    expect(SCENE_SCRIPT_CODE).toContain('levelup-confirm');
    expect(SCENE_SCRIPT_CODE).toContain('data-poi');
  });

  test('contains optional audio runtime hook', () => {
    expect(SCENE_SCRIPT_CODE).toContain('SoundscapeEngine');
  });
});
