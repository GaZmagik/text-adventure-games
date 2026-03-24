import { describe, test, expect } from 'bun:test';
import { esc } from './html';

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
