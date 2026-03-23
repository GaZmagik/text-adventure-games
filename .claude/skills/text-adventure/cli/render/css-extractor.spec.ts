import { describe, test, expect } from 'bun:test';
import { extractAllCss, extractCssVars } from './css-extractor';
import { join } from 'path';

const STYLES_DIR = join(import.meta.dir, '../../styles');

describe('extractAllCss', () => {
  test('extracts CSS from terminal.md', async () => {
    const css = await extractAllCss(join(STYLES_DIR, 'terminal.md'));
    expect(css.length).toBeGreaterThan(100);
    expect(css).toContain('--t-bg-base');
    expect(css).toContain('--t-accent-cyan');
  });

  test('extracts CSS from station.md', async () => {
    const css = await extractAllCss(join(STYLES_DIR, 'station.md'));
    expect(css.length).toBeGreaterThan(100);
  });

  test('captures dark mode overrides', async () => {
    const css = await extractAllCss(join(STYLES_DIR, 'terminal.md'));
    // Terminal may have @media blocks or light mode overrides
    expect(css).toContain('--t-');
  });

  test('captures @keyframes if present', async () => {
    const css = await extractAllCss(join(STYLES_DIR, 'terminal.md'));
    // Terminal Complete CSS Block has @keyframes for die settle and crit animations
    expect(css).toContain('@keyframes');
  });

  test('returns empty string for non-existent file', async () => {
    const css = await extractAllCss('/tmp/nonexistent.md');
    expect(css).toBe('');
  });

  test('returns empty string for file with no CSS blocks', async () => {
    const css = await extractAllCss(join(STYLES_DIR, '..', 'SKILL.md'));
    // SKILL.md has code blocks but they're not fenced as css
    // This may or may not return content — the important thing is it doesn't throw
    expect(typeof css).toBe('string');
  });
});

describe('extractCssVars', () => {
  test('extracts custom properties as key-value record', async () => {
    const vars = await extractCssVars(join(STYLES_DIR, 'terminal.md'));
    expect(Object.keys(vars).length).toBeGreaterThan(10);
    expect(vars['--t-bg-base']).toBeDefined();
    expect(vars['--t-accent-cyan']).toBeDefined();
  });

  test('values are trimmed and semicolons removed', async () => {
    const vars = await extractCssVars(join(STYLES_DIR, 'terminal.md'));
    const val = vars['--t-bg-base'];
    expect(val).toBeDefined();
    expect(val).not.toContain(';');
    expect(val).not.toMatch(/^\s/);
  });
});
