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
    // Corrupt checksum to a different valid hex value
    const corrupted = '00000000' + save.slice(8);
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

  // ── T2-TEST1: Legacy save format coverage ────────────────────────

  test('decodes valid legacy SF1 format (FORMAT:CHECKSUM:PAYLOAD)', () => {
    const payload = btoa(JSON.stringify({ v: 1, scene: 3, legacy: true }));
    const checksum = fnv32(payload);
    const legacySave = `SF1:${checksum}:${payload}`;
    const result = validateAndDecode(legacySave);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.mode).toBe('full');
      expect(result.payload.legacy).toBe(true);
      expect(result.payload.scene).toBe(3);
    }
  });

  test('legacy SF1 with LZ-compressed payload returns LZ_COMPRESSED error', () => {
    // Non-base64 binary data simulates an LZ-compressed payload that fails atob
    const lzPayload = '\x00\x01\x02\x03\x04';
    const checksum = fnv32(lzPayload);
    const legacySave = `SF1:${checksum}:${lzPayload}`;
    const result = validateAndDecode(legacySave);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('SF1_LZ_COMPRESSED');
    }
  });

  test('payload that is a JSON array returns BAD_FORMAT', () => {
    const payload = btoa(JSON.stringify([1, 2, 3]));
    const code = 'SF2:' + payload;
    const save = attachChecksum(code);
    const result = validateAndDecode(save);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('BAD_FORMAT');
    }
  });

  test('payload that is a JSON primitive (string) returns BAD_FORMAT', () => {
    const payload = btoa(JSON.stringify('hello'));
    const code = 'SF2:' + payload;
    const save = attachChecksum(code);
    const result = validateAndDecode(save);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('BAD_FORMAT');
    }
  });

  test('payload that is a JSON primitive (number) returns BAD_FORMAT', () => {
    const payload = btoa(JSON.stringify(42));
    const code = 'SF2:' + payload;
    const save = attachChecksum(code);
    const result = validateAndDecode(save);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('BAD_FORMAT');
    }
  });

  test('payload that is JSON null returns BAD_FORMAT', () => {
    const payload = btoa(JSON.stringify(null));
    const code = 'SC1:' + payload;
    const save = attachChecksum(code);
    const result = validateAndDecode(save);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('BAD_FORMAT');
    }
  });
});
