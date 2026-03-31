import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { mkdtempSync, rmSync, readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleBuildCss } from './build-css';
import { fnv32 } from '../lib/fnv32';

// ── Shared test state ────────────────────────────────────────────────

let tmpDir: string;
let result: Awaited<ReturnType<typeof handleBuildCss>>;

// Expected style names: every .md in styles/ except style-reference.md
const STYLES_DIR = join(import.meta.dir, '../../styles/');
const expectedStyleNames = readdirSync(STYLES_DIR)
  .filter(f => f.endsWith('.md') && f !== 'style-reference.md')
  .map(f => f.replace(/\.md$/, ''))
  .sort();

beforeAll(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), 'tag-build-css-'));
  result = await handleBuildCss(['--output-dir', tmpDir]);
});

afterAll(() => {
  try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
});

// ── Command result shape ─────────────────────────────────────────────

describe('handleBuildCss()', () => {
  it('returns ok: true', () => {
    expect(result.ok).toBe(true);
  });

  it('returns command: "build-css"', () => {
    expect(result.command).toBe('build-css');
  });

  it('returns data with a styles array', () => {
    expect(result.data).toBeDefined();
    const data = result.data as Record<string, unknown>;
    expect(Array.isArray(data.styles)).toBe(true);
  });

  it('returns data with totalBytes as a positive number', () => {
    const data = result.data as Record<string, unknown>;
    expect(typeof data.totalBytes).toBe('number');
    expect(data.totalBytes as number).toBeGreaterThan(0);
  });
});

// ── Style entry shape ────────────────────────────────────────────────

describe('style entries', () => {
  it('has one entry per style file (excluding style-reference.md)', () => {
    const data = result.data as { styles: unknown[] };
    expect(data.styles.length).toBe(expectedStyleNames.length);
  });

  it('each entry has name, hash (8 hex chars), bytes (> 0), path (string)', () => {
    const data = result.data as { styles: Array<Record<string, unknown>> };
    for (const entry of data.styles) {
      expect(typeof entry.name).toBe('string');
      expect((entry.name as string).length).toBeGreaterThan(0);

      expect(typeof entry.hash).toBe('string');
      expect(entry.hash as string).toMatch(/^[0-9a-f]{8}$/);

      expect(typeof entry.bytes).toBe('number');
      expect(entry.bytes as number).toBeGreaterThan(0);

      expect(typeof entry.path).toBe('string');
      expect((entry.path as string).length).toBeGreaterThan(0);
    }
  });

  it('style names match filenames in styles/ (excluding style-reference.md)', () => {
    const data = result.data as { styles: Array<{ name: string }> };
    const actualNames = data.styles.map(s => s.name).sort();
    expect(actualNames).toEqual(expectedStyleNames);
  });
});

// ── CSS output files ─────────────────────────────────────────────────

describe('CSS output files', () => {
  it('creates a css/ directory inside the output directory', () => {
    expect(existsSync(join(tmpDir, 'css'))).toBe(true);
  });

  it('writes one .css file per style', () => {
    const cssFiles = readdirSync(join(tmpDir, 'css'))
      .filter(f => f.endsWith('.css'))
      .sort();
    const expectedFiles = expectedStyleNames.map(n => `${n}.css`).sort();
    expect(cssFiles).toEqual(expectedFiles);
  });

  it('CSS output contains :host and does NOT use :root as a selector', () => {
    const cssDir = join(tmpDir, 'css');
    for (const name of expectedStyleNames) {
      const css = readFileSync(join(cssDir, `${name}.css`), 'utf-8');
      expect(css).toContain(':host');
      // :root must not appear as a standalone CSS selector.
      // It may appear inside comments or variable names, but not as a selector block.
      const rootSelectorMatches = css.match(/(?:^|\n)\s*:root\s*\{/g);
      expect(rootSelectorMatches).toBeNull();
    }
  });

  it('CSS output does not contain markdown fences', () => {
    const cssDir = join(tmpDir, 'css');
    for (const name of expectedStyleNames) {
      const css = readFileSync(join(cssDir, `${name}.css`), 'utf-8');
      expect(css).not.toContain('```');
    }
  });

  it('CSS output has no multi-line comment blocks (minification strips them)', () => {
    const cssDir = join(tmpDir, 'css');
    for (const name of expectedStyleNames) {
      const css = readFileSync(join(cssDir, `${name}.css`), 'utf-8');
      expect(css).not.toMatch(/\/\*[\s\S]*?\*\//);
    }
  });
});

// ── CDN manifest ─────────────────────────────────────────────────────

describe('CDN manifest', () => {
  it('generates cdn-manifest.ts at the correct path', () => {
    const manifestPath = join(tmpDir, 'cdn-manifest.ts');
    expect(existsSync(manifestPath)).toBe(true);
  });

  it('manifest contains CDN_BASE export', () => {
    const manifest = readFileSync(join(tmpDir, 'cdn-manifest.ts'), 'utf-8');
    expect(manifest).toContain('export const CDN_BASE');
    expect(manifest).toContain('cdn.jsdelivr.net');
  });

  it('manifest contains CSS_MANIFEST export with an entry per style', () => {
    const manifest = readFileSync(join(tmpDir, 'cdn-manifest.ts'), 'utf-8');
    expect(manifest).toContain('export const CSS_MANIFEST');
    for (const name of expectedStyleNames) {
      expect(manifest).toContain(`'${name}'`);
    }
  });

  it('manifest is valid TypeScript (parseable)', () => {
    const manifest = readFileSync(join(tmpDir, 'cdn-manifest.ts'), 'utf-8');
    // Quick structural check — must contain both exports and close properly
    expect(manifest).toMatch(/export const CDN_BASE\s*=\s*'/);
    expect(manifest).toMatch(/export const CSS_MANIFEST:\s*Record<string,\s*string>\s*=\s*\{/);
    expect(manifest).toContain('};');
  });
});

// ── FNV32 hash correctness ───────────────────────────────────────────

describe('FNV32 hash correctness', () => {
  it('hashes in manifest match FNV32 of actual CSS file content', () => {
    const data = result.data as { styles: Array<{ name: string; hash: string }> };
    const cssDir = join(tmpDir, 'css');
    for (const entry of data.styles) {
      const css = readFileSync(join(cssDir, `${entry.name}.css`), 'utf-8');
      const expectedHash = fnv32(css);
      expect(entry.hash).toBe(expectedHash);
    }
  });

  it('hash changes when CSS content changes', () => {
    const content1 = ':host { --colour: red; }';
    const content2 = ':host { --colour: blue; }';
    expect(fnv32(content1)).not.toBe(fnv32(content2));
  });
});

// ── --release flag ──────────────────────────────────────────────────

describe('--release flag', () => {
  let releaseTmpDir: string;
  let releaseResult: Awaited<ReturnType<typeof handleBuildCss>>;

  beforeAll(async () => {
    releaseTmpDir = mkdtempSync(join(tmpdir(), 'tag-build-css-release-'));
    releaseResult = await handleBuildCss(['--output-dir', releaseTmpDir, '--release', 'v1.3.0']);
  });

  afterAll(() => {
    try { rmSync(releaseTmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  it('returns ok: true with --release', () => {
    expect(releaseResult.ok).toBe(true);
  });

  it('manifest CDN_BASE uses release tag instead of branch ref', () => {
    const manifest = readFileSync(join(releaseTmpDir, 'cdn-manifest.ts'), 'utf-8');
    expect(manifest).toContain('@v1.3.0/');
    expect(manifest).not.toContain('@feature/');
  });

  it('CSS output is identical regardless of --release flag', () => {
    const defaultCss = readdirSync(join(tmpDir, 'css'));
    const releaseCss = readdirSync(join(releaseTmpDir, 'css'));
    expect(releaseCss.sort()).toEqual(defaultCss.sort());
    for (const file of defaultCss) {
      const a = readFileSync(join(tmpDir, 'css', file), 'utf-8');
      const b = readFileSync(join(releaseTmpDir, 'css', file), 'utf-8');
      expect(b).toBe(a);
    }
  });
});

// ── Default CDN_BASE auto-detection ─────────────────────────────────

describe('default CDN_BASE (no --release)', () => {
  it('auto-detects current git branch in CDN_BASE', () => {
    const manifest = readFileSync(join(tmpDir, 'cdn-manifest.ts'), 'utf-8');
    // Must contain an @ ref (branch or tag) followed by the asset path
    expect(manifest).toMatch(/@[a-zA-Z0-9\-\/_.]+\/.claude\/skills/);
  });

  it('does not contain a hardcoded branch name in source', async () => {
    // The build-css.ts source should not hardcode a specific branch
    const source = await Bun.file(join(import.meta.dir, 'build-css.ts')).text();
    expect(source).not.toContain('@feature/tag-cli-');
  });
});
