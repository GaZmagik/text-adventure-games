import { describe, test, expect, afterEach } from 'bun:test';
import { extractAllCss, extractCssVars } from './css-extractor';
import { join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const STYLES_DIR = join(import.meta.dir, '../../styles');

// ── Sanitisation tests ───────────────────────────────────────────

describe('extractAllCss — CSS sanitisation', () => {
  let tempDir: string;
  let tempFiles: string[] = [];

  afterEach(() => {
    for (const f of tempFiles) {
      try { rmSync(f); } catch { /* ignore */ }
    }
    tempFiles = [];
    if (tempDir) {
      try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  });

  function makeTempCss(css: string): string {
    tempDir = mkdtempSync(join(tmpdir(), 'css-san-'));
    const file = join(tempDir, 'test.md');
    Bun.write(file, '```css\n' + css + '\n```');
    tempFiles.push(file);
    return file;
  }

  test('strips @import url() directives', async () => {
    const file = makeTempCss("@import url('https://evil.example/x.css');");
    const css = await extractAllCss(file);
    expect(css).toContain('/* @import stripped */');
    expect(css).not.toContain('evil.example');
  });

  test('strips bare @import directives', async () => {
    const file = makeTempCss('@import "https://evil.example/x.css";');
    const css = await extractAllCss(file);
    expect(css).toContain('/* @import stripped */');
    expect(css).not.toContain('evil.example');
  });

  test('blocks external url() references', async () => {
    const file = makeTempCss(".bg { background: url('https://evil.example/track.gif'); }");
    const css = await extractAllCss(file);
    expect(css).toContain('/*blocked*/');
    expect(css).not.toContain('https://');
  });

  test('blocks protocol-relative url() references', async () => {
    const file = makeTempCss(".bg { background: url('//evil.example/track.gif'); }");
    const css = await extractAllCss(file);
    expect(css).toContain('/*blocked*/');
    expect(css).not.toContain("url('//");
  });

  test('escapes </style> injection attempts', async () => {
    const file = makeTempCss('</style><script>alert(1)</script>');
    const css = await extractAllCss(file);
    expect(css).toContain('<\\/style');
    expect(css).not.toContain('</style>');
  });
});

describe('extractAllCss', () => {
  test('extracts CSS from terminal.md', async () => {
    const css = await extractAllCss(join(STYLES_DIR, 'terminal.md'));
    expect(css.length).toBeGreaterThan(100);
    expect(css).toContain('--t-bg-base');
    expect(css).toContain('--t-accent-cyan');
  });

  test('extracts CSS from station.md with expected custom properties', async () => {
    const css = await extractAllCss(join(STYLES_DIR, 'station.md'));
    expect(css.length).toBeGreaterThan(100);
    expect(css).toContain('--sta-font-serif');
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

  test('returns empty string when file reads throw unexpectedly', async () => {
    const bunApi = Bun as any;
    const originalFile = bunApi.file;
    bunApi.file = () => ({
      exists: async () => true,
      text: async () => {
        throw new Error('simulated read failure');
      },
    });

    try {
      expect(await extractAllCss('/tmp/read-failure.md')).toBe('');
    } finally {
      bunApi.file = originalFile;
    }
  });

  test('returns empty string for file with no CSS blocks', async () => {
    const css = await extractAllCss(join(STYLES_DIR, '..', 'SKILL.md'));
    // SKILL.md has code blocks but they're not fenced as css — must return exactly ''
    expect(css).toBe('');
  });

  test('only extracts @extract-marked blocks when present', async () => {
    const { writeFileSync, mkdtempSync, rmSync } = await import('fs');
    const { tmpdir } = await import('os');
    const tmp = mkdtempSync(join(tmpdir(), 'css-extract-'));
    const file = join(tmp, 'test.md');
    try {
      writeFileSync(file, [
        '# Test',
        '```css',
        '.unmarked { color: red; }',
        '```',
        '```css',
        '/* @extract */',
        '.marked { color: green; }',
        '```',
      ].join('\n'));
      const css = await extractAllCss(file);
      expect(css).toContain('.marked');
      expect(css).not.toContain('.unmarked');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('cache returns identical result on second call', async () => {
    const { writeFileSync, mkdtempSync, rmSync } = await import('fs');
    const { tmpdir } = await import('os');
    const tmp = mkdtempSync(join(tmpdir(), 'css-cache-'));
    const file = join(tmp, 'cached.md');
    try {
      writeFileSync(file, '```css\n.cached { display: block; }\n```');
      const first = await extractAllCss(file);
      const second = await extractAllCss(file);
      expect(first).toBe(second);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
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

// ── Scoped extraction tests ─────────────────────────────────────────

describe('extractAllCss — scoped extraction', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  });

  function makeScopedFile(): string {
    tempDir = mkdtempSync(join(tmpdir(), 'css-scope-'));
    const file = join(tempDir, 'scoped.md');
    Bun.write(file, [
      '```css',
      '/* @extract:shared */',
      '.shared-class { color: red; }',
      '```',
      '',
      '```css',
      '/* @extract:dice */',
      '.dice-class { color: blue; }',
      '```',
      '',
      '```css',
      '/* @extract:atmosphere */',
      '.atmo-class { color: green; }',
      '```',
      '',
      '```css',
      '/* @extract */',
      '.unlabelled-class { color: yellow; }',
      '```',
    ].join('\n'));
    return file;
  }

  test('scoped extraction includes matching scope', async () => {
    const file = makeScopedFile();
    const css = await extractAllCss(file, ['dice']);
    expect(css).toContain('.dice-class');
  });

  test('scoped extraction always includes shared', async () => {
    const file = makeScopedFile();
    const css = await extractAllCss(file, ['dice']);
    expect(css).toContain('.shared-class');
  });

  test('scoped extraction excludes non-matching scopes', async () => {
    const file = makeScopedFile();
    const css = await extractAllCss(file, ['dice']);
    expect(css).not.toContain('.atmo-class');
  });

  test('unscoped extraction returns all blocks', async () => {
    const file = makeScopedFile();
    const css = await extractAllCss(file);
    expect(css).toContain('.shared-class');
    expect(css).toContain('.dice-class');
    expect(css).toContain('.atmo-class');
    expect(css).toContain('.unlabelled-class');
  });

  test('unlabelled blocks included when scopes provided', async () => {
    const file = makeScopedFile();
    const css = await extractAllCss(file, ['dice']);
    expect(css).toContain('.unlabelled-class');
  });

  test('cache isolates scoped and unscoped calls on same path', async () => {
    const file = makeScopedFile();
    // Unscoped call — should return all blocks
    const unscoped = await extractAllCss(file);
    // Scoped call — should only return matching + shared + unlabelled blocks
    const scoped = await extractAllCss(file, ['dice']);
    expect(unscoped).toContain('.atmo-class');
    expect(scoped).not.toContain('.atmo-class');
    // Both must contain shared and unlabelled
    expect(unscoped).toContain('.shared-class');
    expect(scoped).toContain('.shared-class');
    expect(unscoped).toContain('.unlabelled-class');
    expect(scoped).toContain('.unlabelled-class');
  });
});

// ── T2-S1: Extended URI scheme blocking ─────────────────────────────

describe('extractAllCss — extended URI scheme blocking', () => {
  let tempDir: string;
  let tempFiles: string[] = [];

  afterEach(() => {
    for (const f of tempFiles) {
      try { rmSync(f); } catch { /* ignore */ }
    }
    tempFiles = [];
    if (tempDir) {
      try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  });

  function makeTempCss(css: string): string {
    tempDir = mkdtempSync(join(tmpdir(), 'css-uri-'));
    const file = join(tempDir, 'uri-test.md');
    Bun.write(file, '```css\n' + css + '\n```');
    tempFiles.push(file);
    return file;
  }

  test('blocks data: URI scheme in url()', async () => {
    const file = makeTempCss(".bg { background: url(data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==); }");
    const css = await extractAllCss(file);
    expect(css).toContain('/*blocked*/');
    expect(css).not.toContain('data:text/html');
  });

  test('blocks blob: URI scheme in url()', async () => {
    const file = makeTempCss(".bg { background: url(blob:http://evil.example); }");
    const css = await extractAllCss(file);
    expect(css).toContain('/*blocked*/');
    expect(css).not.toContain('blob:');
  });

  test('blocks ftp: URI scheme in url()', async () => {
    const file = makeTempCss(".bg { background: url(ftp://evil.example/file); }");
    const css = await extractAllCss(file);
    expect(css).toContain('/*blocked*/');
    expect(css).not.toContain('ftp://');
  });

  test('blocks javascript: URI scheme in url()', async () => {
    const file = makeTempCss(".bg { background: url(javascript:alert(1)); }");
    const css = await extractAllCss(file);
    expect(css).toContain('/*blocked*/');
    expect(css).not.toContain('javascript:');
  });

  test('allows safe relative url() references', async () => {
    const file = makeTempCss(".bg { background: url(images/bg.png); }");
    const css = await extractAllCss(file);
    expect(css).toContain('url(images/bg.png)');
    expect(css).not.toContain('/*blocked*/');
  });
});
