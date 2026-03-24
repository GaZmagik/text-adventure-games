import { describe, test, expect } from 'bun:test';
import { SCENE_SCRIPT_CODE } from './scene-script';
import { SOUNDSCAPE_ENGINE_CODE } from './soundscape';

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

  test('contains soundscape placeholder for injection', () => {
    expect(SCENE_SCRIPT_CODE).toContain('${SOUNDSCAPE_ENGINE_CODE}');
  });

  test('is a self-executing function (IIFE)', () => {
    expect(SCENE_SCRIPT_CODE.trim()).toMatch(/^\(function\s*\(\)/);
  });
});

describe('SOUNDSCAPE_ENGINE_CODE', () => {
  test('is a non-empty string', () => {
    expect(typeof SOUNDSCAPE_ENGINE_CODE).toBe('string');
    expect(SOUNDSCAPE_ENGINE_CODE.length).toBeGreaterThan(50);
  });

  test('references AudioContext', () => {
    expect(SOUNDSCAPE_ENGINE_CODE).toContain('AudioContext');
  });
});
