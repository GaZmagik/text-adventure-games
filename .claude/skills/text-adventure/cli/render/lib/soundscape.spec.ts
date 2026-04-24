import { describe, test, expect } from 'bun:test';
import { SOUNDSCAPE_ENGINE_CODE } from './soundscape';

/** Minimal mock shapes — Web Audio API types are unavailable in Bun's type system.
 *  Index signatures use `any` because createNode() spreads arbitrary extras (frequency,
 *  gain, type, buffer, etc.) whose nested shapes vary per node kind. */
interface MockAudioNode {
  started: boolean;
  stopped: boolean;
  disconnected: boolean;
  [key: string]: any;
}
interface MockAudioParam {
  value: number;
  [key: string]: any;
}

function createHarness() {
  const button = { textContent: '' };
  const timers: { id: number; delay: number; cleared: boolean; callback: () => void }[] = [];
  const oscillators: MockAudioNode[] = [];
  const gains: MockAudioNode[] = [];
  const filters: MockAudioNode[] = [];
  const sources: MockAudioNode[] = [];
  let nextTimerId = 1;

  function createNode(extra: Record<string, unknown> = {}) {
    return {
      started: false,
      stopped: false,
      disconnected: false,
      connect() {},
      disconnect() {
        this.disconnected = true;
      },
      start() {
        this.started = true;
      },
      stop() {
        this.stopped = true;
      },
      ...extra,
    };
  }

  class FakeAudioContext {
    currentTime = 10;
    sampleRate = 8;
    destination = {};

    createOscillator() {
      const frequency: MockAudioParam & { calls: Array<{ value: number; time: number }> } = {
        value: 0,
        calls: [] as Array<{ value: number; time: number }>,
        setValueAtTime(value: number, time: number) {
          this.value = value;
          this.calls.push({ value, time });
        },
      };
      const osc = createNode({
        type: 'sine',
        frequency,
      });
      oscillators.push(osc);
      return osc;
    }

    createGain() {
      const gainValue: MockAudioParam & {
        setCalls: Array<{ value: number; time: number }>;
        rampCalls: Array<{ value: number; time: number }>;
      } = {
        value: 0,
        setCalls: [] as Array<{ value: number; time: number }>,
        rampCalls: [] as Array<{ value: number; time: number }>,
        setValueAtTime(value: number, time: number) {
          this.value = value;
          this.setCalls.push({ value, time });
        },
        linearRampToValueAtTime(value: number, time: number) {
          this.value = value;
          this.rampCalls.push({ value, time });
        },
      };
      const gain = createNode({
        gain: gainValue,
      });
      gains.push(gain);
      return gain;
    }

    createBuffer(_channels: number, length: number, sampleRate: number) {
      const data = new Float32Array(length);
      return {
        length,
        sampleRate,
        getChannelData() {
          return data;
        },
      };
    }

    createBufferSource() {
      const source = createNode({ buffer: null });
      sources.push(source);
      return source;
    }

    createBiquadFilter() {
      const filter = createNode({
        type: '',
        frequency: { value: 0 },
      });
      filters.push(filter);
      return filter;
    }
  }

  const SoundscapeEngine = new Function(
    'window',
    'document',
    'setTimeout',
    'clearTimeout',
    `${SOUNDSCAPE_ENGINE_CODE}; return SoundscapeEngine;`,
  )(
    { AudioContext: FakeAudioContext, webkitAudioContext: FakeAudioContext },
    { getElementById: (id: string) => (id === 'audio-btn' ? button : null) },
    (callback: () => void, delay: number) => {
      const timer = { id: nextTimerId++, delay, cleared: false, callback };
      timers.push(timer);
      return timer.id;
    },
    (id: number) => {
      const timer = timers.find(entry => entry.id === id);
      if (timer) timer.cleared = true;
    },
  ) as new () => any;

  return { SoundscapeEngine, button, timers, oscillators, gains, filters, sources };
}

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
  test('includes all 12 sound presets', () => {
    for (const preset of [
      'ship-engine',
      'rain',
      'wind',
      'forest',
      'mechanical',
      'terminal',
      'alarm',
      'silence',
      'heartbeat',
      'station-ambience',
      'underwater',
      'fire',
    ]) {
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

  test('play initialises audio, clamps duration, and schedules cleanup', () => {
    const harness = createHarness();
    const engine = new harness.SoundscapeEngine();

    engine.play('ship-engine', 99);

    expect(engine.playing).toBe(true);
    expect(engine.ctx).toBeDefined();
    expect(harness.timers).toHaveLength(1);
    expect(harness.timers[0]!.delay).toBe(30000);
    expect(harness.oscillators).toHaveLength(2);
    expect(harness.sources).toHaveLength(1);
    expect(harness.filters[0]!.type).toBe('lowpass');
    expect(harness.gains.some(gain => gain.gain.rampCalls.some((call: { time: number }) => call.time === 40))).toBe(
      true,
    );
  });

  test('alarm and fallback presets produce real node behaviour and stop tears them down', () => {
    const harness = createHarness();
    const engine = new harness.SoundscapeEngine();

    engine.play('alarm', 2);
    expect(harness.oscillators).toHaveLength(1);
    expect(harness.oscillators[0]!.frequency.calls).toEqual([
      { value: 440, time: 10 },
      { value: 880, time: 11 },
    ]);

    engine.stop();
    expect(engine.playing).toBe(false);
    expect(engine.nodes).toEqual([]);
    expect(harness.timers[0]!.cleared).toBe(true);
    expect(harness.button.textContent).toBe('♫ Play');

    const fallbackHarness = createHarness();
    const fallbackEngine = new fallbackHarness.SoundscapeEngine();
    fallbackEngine.play('not-a-real-preset', 1);
    expect(fallbackHarness.filters[0]!.type).toBe('lowpass');
    expect(fallbackHarness.sources).toHaveLength(1);
  });
});
