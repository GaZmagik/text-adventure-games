import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { extractCssFromContent } from '../../render/css-extractor';

const SKILL_DIR = resolve(import.meta.dir, '../../..');
const GENERATED_CSS_DIR = 'assets/css';
const STYLE_SOURCE_DIR = 'styles';
const RENDER_SOURCE_ROOTS = ['cli/render/lib', 'cli/render/templates'];

type CssSource = {
  relPath: string;
  text: string;
};

type VarUsage = {
  name: string;
  hasFallback: boolean;
  relPath: string;
  line: number;
};

function normalisePath(path: string): string {
  return path.split('\\').join('/');
}

function collectFiles(root: string, predicate: (path: string) => boolean): string[] {
  const files: string[] = [];

  function walk(current: string): void {
    for (const entry of readdirSync(current).sort()) {
      const fullPath = join(current, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile() && predicate(fullPath)) {
        files.push(normalisePath(relative(SKILL_DIR, fullPath)));
      }
    }
  }

  walk(join(SKILL_DIR, root));
  return files.sort();
}

function lineNumberForIndex(text: string, index: number): number {
  return text.slice(0, index).split('\n').length;
}

function generatedCssSources(): CssSource[] {
  return collectFiles(GENERATED_CSS_DIR, path => path.endsWith('.css')).map(relPath => ({
    relPath,
    text: readFileSync(join(SKILL_DIR, relPath), 'utf-8'),
  }));
}

function styleSourceCssSources(): CssSource[] {
  return collectFiles(STYLE_SOURCE_DIR, path => path.endsWith('.md')).map(relPath => ({
    relPath,
    text: extractCssFromContent(readFileSync(join(SKILL_DIR, relPath), 'utf-8')),
  }));
}

function renderSourceCssSources(): CssSource[] {
  return RENDER_SOURCE_ROOTS.flatMap(root =>
    collectFiles(root, path => path.endsWith('.ts') && !path.endsWith('.spec.ts')),
  ).map(relPath => ({
    relPath,
    text: readFileSync(join(SKILL_DIR, relPath), 'utf-8'),
  }));
}

function customPropertyDeclarations(sources: readonly CssSource[]): Set<string> {
  const declarations = new Set<string>();

  for (const source of sources) {
    for (const match of source.text.matchAll(/(?<![\w-])(--[A-Za-z_][\w-]*)\s*:/g)) {
      declarations.add(match[1]!);
    }
  }

  return declarations;
}

function customPropertyUsages(sources: readonly CssSource[]): VarUsage[] {
  const usages: VarUsage[] = [];

  for (const source of sources) {
    for (const match of source.text.matchAll(/var\(\s*(--[A-Za-z_][\w-]*)([^)]*)\)/g)) {
      usages.push({
        name: match[1]!,
        hasFallback: (match[2] ?? '').includes(','),
        relPath: source.relPath,
        line: lineNumberForIndex(source.text, match.index ?? 0),
      });
    }
  }

  return usages;
}

function unresolvedUsages(usages: readonly VarUsage[], declarations: ReadonlySet<string>): string[] {
  return usages
    .filter(usage => !usage.hasFallback && !declarations.has(usage.name))
    .map(usage => `${usage.relPath}:${usage.line}: ${usage.name} must be declared or used with a fallback`)
    .sort();
}

describe('CSS variable consistency', () => {
  test('generated CSS custom property usages resolve inside generated assets', () => {
    const sources = generatedCssSources();
    const declarations = customPropertyDeclarations(sources);
    const usages = customPropertyUsages(sources);

    expect(unresolvedUsages(usages, declarations)).toEqual([]);
  });

  test('style and render source custom property usages are declared or fallbacked', () => {
    const sources = [...styleSourceCssSources(), ...renderSourceCssSources()];
    const declarations = customPropertyDeclarations([...generatedCssSources(), ...sources]);
    const usages = customPropertyUsages(sources);

    expect(unresolvedUsages(usages, declarations)).toEqual([]);
  });
});
