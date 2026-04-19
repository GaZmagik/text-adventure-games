import { describe, test, expect } from 'bun:test';
import { containsForbiddenKeys } from './security';

describe('containsForbiddenKeys', () => {
  test('returns false for safe objects', () => {
    expect(containsForbiddenKeys({})).toBe(false);
    expect(containsForbiddenKeys({ name: 'test', value: 42 })).toBe(false);
    expect(containsForbiddenKeys({ nested: { safe: true } })).toBe(false);
  });

  test('returns false for primitives and null', () => {
    expect(containsForbiddenKeys(null)).toBe(false);
    expect(containsForbiddenKeys(undefined)).toBe(false);
    expect(containsForbiddenKeys('string')).toBe(false);
    expect(containsForbiddenKeys(42)).toBe(false);
  });

  test('detects __proto__ at top level', () => {
    const obj = JSON.parse('{"__proto__": {"polluted": true}}');
    expect(containsForbiddenKeys(obj)).toBe(true);
  });

  test('detects constructor at top level', () => {
    const obj = JSON.parse('{"constructor": {"prototype": {}}}');
    expect(containsForbiddenKeys(obj)).toBe(true);
  });

  test('detects prototype at top level', () => {
    const obj = JSON.parse('{"prototype": {}}');
    expect(containsForbiddenKeys(obj)).toBe(true);
  });

  test('detects forbidden keys nested deep', () => {
    const obj = JSON.parse('{"a": {"b": {"__proto__": true}}}');
    expect(containsForbiddenKeys(obj)).toBe(true);
  });

  test('handles arrays with forbidden keys inside objects', () => {
    expect(containsForbiddenKeys([1, 2, 3])).toBe(false);
    const arrWithObj = JSON.parse('[{"__proto__": true}]');
    expect(containsForbiddenKeys(arrWithObj)).toBe(true);
  });
});
