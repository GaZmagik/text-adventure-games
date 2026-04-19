import { describe, test, expect } from 'bun:test';
import { MODULE_DIGESTS } from './module-digests';
import { KNOWN_MODULES } from '../lib/constants';

describe('MODULE_DIGESTS', () => {
  test('every KNOWN_MODULES entry has a digest in MODULE_DIGESTS', () => {
    for (const mod of KNOWN_MODULES) {
      expect(MODULE_DIGESTS).toHaveProperty(mod);
      expect(typeof MODULE_DIGESTS[mod]).toBe('string');
      expect(MODULE_DIGESTS[mod]!.length).toBeGreaterThan(0);
    }
  });

  test('every MODULE_DIGESTS key exists in KNOWN_MODULES', () => {
    const knownSet = new Set<string>(KNOWN_MODULES);
    for (const key of Object.keys(MODULE_DIGESTS)) {
      expect(knownSet.has(key)).toBe(true);
    }
  });
});
