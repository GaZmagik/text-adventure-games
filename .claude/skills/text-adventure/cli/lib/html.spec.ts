import { describe, test, expect } from 'bun:test';
import { esc, formatModifier, serialiseInlineScriptData } from './html';

describe('esc', () => {
  test('escapes &, <, >, "', () => {
    expect(esc('a & b < c > d "e"')).toBe('a &amp; b &lt; c &gt; d &quot;e&quot;');
  });
  test('escapes single quotes for attribute safety', () => {
    expect(esc("it's a \"test\" & <more>")).toBe("it&#39;s a &quot;test&quot; &amp; &lt;more&gt;");
  });
  test('returns empty string for null/undefined/empty', () => {
    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
    expect(esc('')).toBe('');
  });
  test('passes through safe strings', () => {
    expect(esc('hello world')).toBe('hello world');
  });
});

describe('formatModifier', () => {
  test('prefixes positive numbers with +', () => {
    expect(formatModifier(3)).toBe('+3');
  });
  test('prefixes zero with +', () => {
    expect(formatModifier(0)).toBe('+0');
  });
  test('negative numbers retain their minus sign', () => {
    expect(formatModifier(-1)).toBe('-1');
  });
  test('large positive modifier', () => {
    expect(formatModifier(10)).toBe('+10');
  });
});

describe('serialiseInlineScriptData', () => {
  test('escapes closing script payloads safely', () => {
    expect(serialiseInlineScriptData('</script><script>alert(1)</script>')).toContain('\\u003c/script\\u003e');
  });

  test('escapes HTML-significant characters in nested data', () => {
    const serialised = serialiseInlineScriptData({
      label: '<danger>',
      note: '& unsafe',
    });
    expect(serialised).toContain('\\u003cdanger\\u003e');
    expect(serialised).toContain('\\u0026 unsafe');
  });

  test('escapes unicode line separators', () => {
    const serialised = serialiseInlineScriptData('a\u2028b\u2029c');
    expect(serialised).toContain('\\u2028');
    expect(serialised).toContain('\\u2029');
  });
});
