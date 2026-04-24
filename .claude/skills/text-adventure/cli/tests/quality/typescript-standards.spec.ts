import { describe, expect, test } from 'bun:test';
import { readdirSync, statSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';

const SKILL_DIR = resolve(import.meta.dir, '../../..');
const GENERATED_TS_FILES = new Set(['assets/cdn-manifest.ts']);
const TS_FILENAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*\.ts$/;
const TS_IGNORE_DIRECTIVE = '@ts-' + 'ignore';

function normalisePath(path: string): string {
  return path.split('\\').join('/');
}

function collectTsFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(current: string): void {
    for (const entry of readdirSync(current).sort()) {
      if (entry === 'node_modules') continue;
      const fullPath = join(current, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile() && fullPath.endsWith('.ts')) {
        files.push(normalisePath(relative(SKILL_DIR, fullPath)));
      }
    }
  }

  walk(dir);
  return files.sort();
}

function stripCommentsAndStrings(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/`(?:\\[\s\S]|[^`\\])*`/g, '``')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""');
}

function explicitAnyLineNumbers(source: string): number[] {
  const cleaned = stripCommentsAndStrings(source);
  const explicitAnyRe = /(?:[:=,<(]\s*|\bas\s+|\bsatisfies\s+|\bextends\s+)any\b|\bany\s*\[\s*\]/;
  return cleaned.split('\n').flatMap((line, index) => (explicitAnyRe.test(line) ? [index + 1] : []));
}

function hasTsIgnoreDirective(source: string): boolean {
  return source.split('\n').some(line => {
    const commentStart = line.indexOf('//');
    return commentStart >= 0 && line.slice(commentStart).includes(TS_IGNORE_DIRECTIVE);
  });
}

describe('TypeScript coding standards', () => {
  test('compiler and package settings enforce strict ESM TypeScript', async () => {
    const packageJson = (await Bun.file(join(SKILL_DIR, 'package.json')).json()) as {
      type?: string;
      scripts?: Record<string, string>;
    };
    const tsconfig = (await Bun.file(join(SKILL_DIR, 'cli/tsconfig.json')).json()) as {
      compilerOptions?: Record<string, unknown>;
    };
    const options = tsconfig.compilerOptions ?? {};

    expect(packageJson.type).toBe('module');
    expect(packageJson.scripts?.format).toContain('prettier --write');
    expect(packageJson.scripts?.lint).toContain('eslint');
    expect(packageJson.scripts?.['format:check']).toContain('prettier --check');
    expect(packageJson.scripts?.typecheck).toContain('tsc --noEmit');
    expect(packageJson.scripts?.check).toContain('lint');
    expect(packageJson.scripts?.check).toContain('format:check');
    expect(packageJson.scripts?.check).toContain('typecheck');
    expect(options.strict).toBe(true);
    expect(options.noUncheckedIndexedAccess).toBe(true);
    expect(options.exactOptionalPropertyTypes).toBe(true);
    expect(options.module).toBe('ESNext');
    expect(options.moduleResolution).toBe('bundler');
  });

  test('TypeScript source files follow project naming and module rules', async () => {
    const failures: string[] = [];

    for (const relPath of collectTsFiles(SKILL_DIR)) {
      const filename = basename(relPath);
      const source = await Bun.file(join(SKILL_DIR, relPath)).text();
      const cleaned = stripCommentsAndStrings(source);

      if (!TS_FILENAME_RE.test(filename)) {
        failures.push(`${relPath}: TypeScript filenames must be lower-case hyphenated`);
      }

      if (/\bnamespace\s+[A-Za-z_$][\w$]*\s*\{/.test(cleaned)) {
        failures.push(`${relPath}: use ES modules instead of TypeScript namespaces`);
      }

      if (/\bmodule\s+["']?[A-Za-z_$][\w$.'"/-]*["']?\s*\{/.test(cleaned)) {
        failures.push(`${relPath}: use ES modules instead of TypeScript module declarations`);
      }

      if (hasTsIgnoreDirective(source)) {
        failures.push(`${relPath}: use typed code or narrowly scoped @ts-expect-error instead of @ts-ignore`);
      }
    }

    expect(failures).toEqual([]);
  });

  test('production TypeScript avoids explicit any', async () => {
    const failures: string[] = [];

    for (const relPath of collectTsFiles(SKILL_DIR)) {
      if (relPath.endsWith('.spec.ts') || GENERATED_TS_FILES.has(relPath)) continue;

      const source = await Bun.file(join(SKILL_DIR, relPath)).text();
      for (const lineNumber of explicitAnyLineNumbers(source)) {
        failures.push(`${relPath}:${lineNumber}: explicit any is not allowed in production code`);
      }
    }

    expect(failures).toEqual([]);
  });
});
