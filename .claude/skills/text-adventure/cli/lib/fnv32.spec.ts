import { describe, test, expect } from 'bun:test';
import { fnv32, attachChecksum, validateAndDecode } from './fnv32';

describe('fnv32', () => {
  test('returns 8-character hex string', () => {
    const hash = fnv32('hello');
    expect(hash).toHaveLength(8);
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  test('same input gives same hash', () => {
    expect(fnv32('test')).toBe(fnv32('test'));
  });

  test('different inputs give different hashes', () => {
    expect(fnv32('hello')).not.toBe(fnv32('world'));
  });

  test('empty string gives valid hash', () => {
    const hash = fnv32('');
    expect(hash).toHaveLength(8);
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  test('produces known FNV-1a hash for "hello"', () => {
    expect(fnv32('hello')).toBe('a82fb4a1');
  });
});

describe('attachChecksum', () => {
  test('prepends 8-char hash + dot', () => {
    const result = attachChecksum('SC1:abc123');
    expect(result).toMatch(/^[0-9a-f]{8}\.SC1:abc123$/);
  });

  test('checksum matches fnv32 of the code', () => {
    const code = 'SF2:eyJ0ZXN0IjoxfQ==';
    const result = attachChecksum(code);
    const checksum = result.slice(0, 8);
    expect(checksum).toBe(fnv32(code));
  });
});

describe('validateAndDecode', () => {
  test('valid checksummed string passes', () => {
    const code = 'SC1:' + btoa(JSON.stringify({ v: 1, test: true }));
    const save = attachChecksum(code);
    const result = validateAndDecode(save);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.payload).toBeDefined();
      expect(result.payload.test).toBe(true);
      expect(result.mode).toBe('compact');
    }
  });

  test('SF2 uncompressed full mode works', () => {
    const code = 'SF2:' + btoa(JSON.stringify({ v: 1, mode: 'full', data: 'test' }));
    const save = attachChecksum(code);
    const result = validateAndDecode(save);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.mode).toBe('full');
      expect(result.payload.data).toBe('test');
    }
  });

  test('detects checksum corruption', () => {
    const code = 'SC1:' + btoa(JSON.stringify({ v: 1 }));
    const save = attachChecksum(code);
    // Corrupt one character
    const corrupted = 'xxxxxxxx' + save.slice(8);
    const result = validateAndDecode(corrupted);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('CHECKSUM');
    }
  });

  test('detects missing checksum format', () => {
    const result = validateAndDecode('notavalidsave');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('FORMAT');
    }
  });

  test('detects unknown version prefix', () => {
    const code = 'XX9:' + btoa('{}');
    const save = attachChecksum(code);
    const result = validateAndDecode(save);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('VERSION');
    }
  });
});
