import { describe, expect, test } from 'bun:test';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const SKILL_DIR = resolve(import.meta.dir, '../../..');
const GENERATED_TS_FILES = new Set(['assets/cdn-manifest.ts']);
const COMMENT_RE = /\/\*\*?[\s\S]*?\*\/|(^|\n)\s*\/\/[^\n]*/g;

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

function commentText(raw: string): string {
  return raw
    .replace(/^\/\*\*?/, '')
    .replace(/\*\/$/, '')
    .split('\n')
    .map(line =>
      line
        .replace(/^\s*\*?\s?/, '')
        .replace(/^\s*\/\//, '')
        .trim(),
    )
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasNonTrivialComment(source: string): boolean {
  return [...source.matchAll(COMMENT_RE)]
    .map(match => commentText(match[0]))
    .some(text => text.length >= 40 && text.split(/\s+/).length >= 6);
}

describe('TypeScript documentation coverage', () => {
  test('production files have explanatory comments and test files have test structure', async () => {
    const failures: string[] = [];

    for (const relPath of collectTsFiles(SKILL_DIR)) {
      const source = await Bun.file(join(SKILL_DIR, relPath)).text();

      if (GENERATED_TS_FILES.has(relPath)) {
        if (!source.includes('Auto-generated') || !source.includes('do not edit manually')) {
          failures.push(`${relPath}: generated file must identify itself as generated`);
        }
        continue;
      }

      if (relPath.endsWith('.spec.ts')) {
        if (!/\bdescribe\s*\(/.test(source) || !/\b(?:test|it)\s*\(/.test(source)) {
          failures.push(`${relPath}: spec file must contain describe() and test()/it()`);
        }
        continue;
      }

      if (!hasNonTrivialComment(source)) {
        failures.push(`${relPath}: production file needs a non-trivial explanatory comment or JSDoc block`);
      }
    }

    expect(failures).toEqual([]);
  });
});
