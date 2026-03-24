import { describe, test, expect } from 'bun:test';
import { SOUNDSCAPE_ENGINE_CODE } from './soundscape';

describe('SOUNDSCAPE_ENGINE_CODE', () => {
  test('returns a non-empty string', () => {
    expect(typeof SOUNDSCAPE_ENGINE_CODE).toBe('string');
    expect(SOUNDSCAPE_ENGINE_CODE.length).toBeGreaterThan(0);
  });

  test('contains SoundscapeEngine constructor', () => {
    expect(SOUNDSCAPE_ENGINE_CODE).toContain('SoundscapeEngine');
  });

  test('uses Web Audio API (AudioContext)', () => {
    expect(SOUNDSCAPE_ENGINE_CODE).toMatch(/AudioContext|webkitAudioContext/);
  });

  test('contains createOscillator for tone generation', () => {
    expect(SOUNDSCAPE_ENGINE_CODE).toContain('createOscillator');
  });

  test('is under 5KB', () => {
    expect(SOUNDSCAPE_ENGINE_CODE.length).toBeLessThan(5 * 1024);
  });

  // Prototype methods
  test('defines init method', () => {
    expect(SOUNDSCAPE_ENGINE_CODE).toContain('.init');
  });

  test('defines play method with sound type generators', () => {
    expect(SOUNDSCAPE_ENGINE_CODE).toContain('.play');
    expect(SOUNDSCAPE_ENGINE_CODE).toContain('generators');
  });

  test('defines stop method', () => {
    expect(SOUNDSCAPE_ENGINE_CODE).toContain('.stop');
  });

  test('defines genDrone for low-frequency drones', () => {
    expect(SOUNDSCAPE_ENGINE_CODE).toContain('genDrone');
  });

  test('defines genNoise for filtered noise', () => {
    expect(SOUNDSCAPE_ENGINE_CODE).toContain('genNoise');
  });

  test('defines genAlarm for alternating-frequency alarm', () => {
    expect(SOUNDSCAPE_ENGINE_CODE).toContain('genAlarm');
  });

  // Sound types
  test('includes all 8 sound presets', () => {
    for (const preset of ['ship-engine', 'rain', 'wind', 'forest', 'mechanical', 'terminal', 'alarm', 'silence']) {
      expect(SOUNDSCAPE_ENGINE_CODE).toContain(preset);
    }
  });

  // ── Structural validity ────────────────────────────────────────────
  test('is valid JS (parseable by new Function)', () => {
    // new Function(code) parses without executing — validates syntax only.
    // This is safe: the code string is a build-time constant, not user input.
    expect(() => new Function(SOUNDSCAPE_ENGINE_CODE)).not.toThrow();
  });

  test('defines constructor and all 6 prototype methods', () => {
    // Constructor
    expect(SOUNDSCAPE_ENGINE_CODE).toMatch(/var SoundscapeEngine\s*=\s*function/);
    // 6 prototype methods
    for (const method of ['init', 'play', 'stop', 'genDrone', 'genNoise', 'genAlarm']) {
      expect(SOUNDSCAPE_ENGINE_CODE).toContain(`SoundscapeEngine.prototype.${method}`);
    }
  });

  // Audio node management
  test('creates BiquadFilter for noise shaping', () => {
    expect(SOUNDSCAPE_ENGINE_CODE).toContain('createBiquadFilter');
  });

  test('uses gain nodes for volume control', () => {
    expect(SOUNDSCAPE_ENGINE_CODE).toContain('createGain');
  });

  test('uses linearRampToValueAtTime for fade in/out', () => {
    expect(SOUNDSCAPE_ENGINE_CODE).toContain('linearRampToValueAtTime');
  });
});
