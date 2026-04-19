import { describe, test, expect } from 'bun:test';
import { MODULE_PANEL_MAP } from './module-panel-map';

describe('MODULE_PANEL_MAP', () => {
  test('contains all expected module keys', () => {
    const expectedKeys = [
      'lore-codex',
      'ship-systems',
      'crew-manifest',
      'star-chart',
      'geo-map',
      'core-systems',
    ];
    for (const key of expectedKeys) {
      expect(MODULE_PANEL_MAP).toHaveProperty(key);
    }
  });

  test('maps to expected panel names', () => {
    expect(MODULE_PANEL_MAP['lore-codex']).toBe('codex');
    expect(MODULE_PANEL_MAP['ship-systems']).toBe('ship');
    expect(MODULE_PANEL_MAP['crew-manifest']).toBe('crew');
    expect(MODULE_PANEL_MAP['star-chart']).toBe('nav');
    expect(MODULE_PANEL_MAP['geo-map']).toBe('map');
    expect(MODULE_PANEL_MAP['core-systems']).toBe('quests');
  });

  test('has exactly 6 entries', () => {
    expect(Object.keys(MODULE_PANEL_MAP).length).toBe(6);
  });
});
