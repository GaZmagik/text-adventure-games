import { describe, test, expect } from 'bun:test';
import { VERSION } from './version';

describe('VERSION', () => {
  test('matches semver format', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
