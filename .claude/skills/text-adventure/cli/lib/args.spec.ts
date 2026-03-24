import { describe, test, expect } from 'bun:test';
import { parseArgs } from './args';

describe('parseArgs', () => {
  test('empty args returns empty positional, flags, and booleans', () => {
    const result = parseArgs([]);
    expect(result.positional).toEqual([]);
    expect(result.flags).toEqual({});
    expect(result.booleans.size).toBe(0);
  });

  test('positional only: ["foo", "bar"] populates positional array', () => {
    const result = parseArgs(['foo', 'bar']);
    expect(result.positional).toEqual(['foo', 'bar']);
    expect(result.flags).toEqual({});
    expect(result.booleans.size).toBe(0);
  });

  test('flag with value: ["--dc", "14"] populates flags record', () => {
    const result = parseArgs(['--dc', '14']);
    expect(result.flags).toEqual({ dc: '14' });
    expect(result.positional).toEqual([]);
    expect(result.booleans.size).toBe(0);
  });

  test('boolean flag: ["--raw"] with booleanFlags=["raw"] populates booleans set', () => {
    const result = parseArgs(['--raw'], ['raw']);
    expect(result.booleans.has('raw')).toBe(true);
    expect(result.flags).toEqual({});
    expect(result.positional).toEqual([]);
  });

  test('mixed: positional, flag with value, and boolean flag', () => {
    const result = parseArgs(
      ['scene', '--style', 'station', '--raw'],
      ['raw'],
    );
    expect(result.positional).toEqual(['scene']);
    expect(result.flags).toEqual({ style: 'station' });
    expect(result.booleans.has('raw')).toBe(true);
  });

  test('multiple flags: ["--dc", "14", "--escalation", "2"]', () => {
    const result = parseArgs(['--dc', '14', '--escalation', '2']);
    expect(result.flags).toEqual({ dc: '14', escalation: '2' });
    expect(result.positional).toEqual([]);
    expect(result.booleans.size).toBe(0);
  });

  test('flag at end with no value and not in booleanFlags is treated as boolean', () => {
    const result = parseArgs(['--verbose']);
    expect(result.booleans.has('verbose')).toBe(true);
    expect(result.flags).toEqual({});
  });

  test('flag at end with no value when booleanFlags provided but key not listed', () => {
    const result = parseArgs(['--orphan'], ['raw']);
    expect(result.booleans.has('orphan')).toBe(true);
    expect(result.flags).toEqual({});
  });

  test('boolean flag does not consume the next argument', () => {
    const result = parseArgs(['--dry-run', '--commands', 'a;b'], ['dry-run']);
    expect(result.booleans.has('dry-run')).toBe(true);
    expect(result.flags).toEqual({ commands: 'a;b' });
    expect(result.positional).toEqual([]);
  });

  test('positional args interleaved with flags', () => {
    const result = parseArgs(['CON', '--dc', '14']);
    expect(result.positional).toEqual(['CON']);
    expect(result.flags).toEqual({ dc: '14' });
  });

  test('multiple boolean flags', () => {
    const result = parseArgs(['--raw', '--dry-run'], ['raw', 'dry-run']);
    expect(result.booleans.has('raw')).toBe(true);
    expect(result.booleans.has('dry-run')).toBe(true);
    expect(result.flags).toEqual({});
  });

  test('booleanFlags defaults to empty when omitted', () => {
    const result = parseArgs(['--flag', 'value']);
    expect(result.flags).toEqual({ flag: 'value' });
    expect(result.booleans.size).toBe(0);
  });

  test('non-boolean flag always consumes next token even if it starts with --', () => {
    const result = parseArgs(['--style', '--raw'], ['raw']);
    expect(result.flags).toEqual({ style: '--raw' });
    expect(result.booleans.has('raw')).toBe(false); // consumed as value, not boolean
  });

  test('boolean flag before value flag works in any order', () => {
    const result = parseArgs(['--dry-run', '--commands', 'a;b'], ['dry-run']);
    expect(result.booleans.has('dry-run')).toBe(true);
    expect(result.flags).toEqual({ commands: 'a;b' });
  });
});
