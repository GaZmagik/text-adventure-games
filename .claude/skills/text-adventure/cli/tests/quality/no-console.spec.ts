import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

const SKILL_DIR = resolve(import.meta.dir, '../../..');
const CLI_DIR = join(SKILL_DIR, 'cli');
const ALLOWED_FILE_PATHS = new Set(['cli/tag.ts']);
const ALLOWED_PATH_PREFIXES = ['cli/commands/', 'cli/tests/'];
const CONSOLE_METHODS = new Set(['log', 'warn', 'error']);
const CONSOLE_GLOBAL_OWNERS = new Set(['globalThis', 'window', 'self']);

function normalisePath(path: string): string {
  return path.split('\\').join('/');
}

function collectCliProductionFiles(): string[] {
  const files: string[] = [];

  function walk(current: string): void {
    for (const entry of readdirSync(current).sort()) {
      if (entry === 'node_modules') continue;
      const fullPath = join(current, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!stat.isFile() || !fullPath.endsWith('.ts') || fullPath.endsWith('.spec.ts')) continue;

      const relPath = normalisePath(relative(SKILL_DIR, fullPath));
      if (ALLOWED_FILE_PATHS.has(relPath)) continue;
      if (ALLOWED_PATH_PREFIXES.some(prefix => relPath.startsWith(prefix))) continue;
      files.push(relPath);
    }
  }

  walk(CLI_DIR);
  return files.sort();
}

function lineNumber(sourceFile: ts.SourceFile, node: ts.Node): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function isConsoleObject(node: ts.Expression): boolean {
  if (ts.isIdentifier(node)) return node.text === 'console';
  return (
    ts.isPropertyAccessExpression(node) &&
    node.name.text === 'console' &&
    ts.isIdentifier(node.expression) &&
    CONSOLE_GLOBAL_OWNERS.has(node.expression.text)
  );
}

describe('console leakage guard', () => {
  test('non-command CLI production code does not call console loggers', () => {
    const failures: string[] = [];

    for (const relPath of collectCliProductionFiles()) {
      const fullPath = join(SKILL_DIR, relPath);
      const sourceText = readFileSync(fullPath, 'utf-8');
      const sourceFile = ts.createSourceFile(fullPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

      function visit(node: ts.Node): void {
        if (
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          CONSOLE_METHODS.has(node.expression.name.text) &&
          isConsoleObject(node.expression.expression)
        ) {
          failures.push(
            `${relPath}:${lineNumber(sourceFile, node.expression)}: console.${node.expression.name.text} is only allowed in cli/commands/** and cli/tag.ts`,
          );
        }

        ts.forEachChild(node, visit);
      }

      visit(sourceFile);
    }

    expect(failures).toEqual([]);
  });
});
