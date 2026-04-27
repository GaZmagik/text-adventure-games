import { describe, test, expect } from 'bun:test';
import { renderChronicle } from './chronicle';
import { createDefaultState } from '../../lib/state-store';
import { extractJsonTagAttr } from '../../tests/support/rendered-widget';

type ChronicleConfig = {
  scenes: { scene: number; events: { type: string; desc: string }[]; travel: unknown[] }[];
  currentChar: string;
  currentLocation: string;
};

function readConfig(html: string): ChronicleConfig {
  return extractJsonTagAttr<ChronicleConfig>(html, 'ta-chronicle', 'data-config');
}

describe('renderChronicle', () => {
  test('returns a fallback message when state is null', () => {
    const html = renderChronicle(null, 'station');
    expect(html).toContain('No state available');
  });

  test('renders a ta-chronicle custom element', () => {
    const state = createDefaultState();
    const html = renderChronicle(state, 'station');
    expect(html).toContain('ta-chronicle');
  });

  test('embeds data-config JSON attribute', () => {
    const state = createDefaultState();
    const html = renderChronicle(state, 'station');
    expect(html).toContain('data-config');
  });

  test('includes currentChar from character name', () => {
    const state = createDefaultState();
    state.character = { ...(state.character ?? {}), name: 'Kira' } as typeof state.character;
    const html = renderChronicle(state, 'station');
    const config = readConfig(html);
    expect(config.currentChar).toBe('Kira');
  });

  test('includes currentLocation from currentRoom', () => {
    const state = createDefaultState();
    state.currentRoom = 'Docking Bay';
    const html = renderChronicle(state, 'station');
    const config = readConfig(html);
    expect(config.currentLocation).toBe('Docking Bay');
  });

  test('falls back to Unknown when character is null and room is empty', () => {
    const state = createDefaultState();
    state.character = null;
    state.currentRoom = '';
    const html = renderChronicle(state, 'station');
    const config = readConfig(html);
    expect(config.currentChar).toBe('Unknown');
    expect(config.currentLocation).toBe('Unknown');
  });

  test('groups quest events from history', () => {
    const state = createDefaultState();
    state._stateHistory = [
      { command: 'quest add q1 Find the artifact', timestamp: '0', path: '', oldValue: null, newValue: null },
      { command: 'quest complete q1', timestamp: '1', path: '', oldValue: null, newValue: null },
    ];
    const html = renderChronicle(state, 'station');
    const config = readConfig(html);
    const allEvents = config.scenes.flatMap(s => s.events);
    expect(allEvents.some(e => e.type === 'quest')).toBe(true);
  });

  test('renders without error for empty state', () => {
    const state = createDefaultState();
    expect(() => renderChronicle(state, 'station')).not.toThrow();
  });
});
