import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

const SKILL_DIR = resolve(import.meta.dir, '../../..');
const TEST_FUNCTIONS = new Set(['test', 'it']);
const SUITE_FUNCTIONS = new Set(['describe']);
const DISABLED_MODIFIERS = new Set(['only', 'skip']);
const SNAPSHOT_MATCHERS = new Set([
  'toMatchInlineSnapshot',
  'toMatchSnapshot',
  'toThrowErrorMatchingInlineSnapshot',
  'toThrowErrorMatchingSnapshot',
]);
const LITERAL_MATCHERS = new Set(['toBe', 'toEqual', 'toStrictEqual']);

function normalisePath(path: string): string {
  return path.split('\\').join('/');
}

function collectSpecFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(current: string): void {
    for (const entry of readdirSync(current).sort()) {
      if (entry === 'node_modules') continue;
      const fullPath = join(current, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile() && fullPath.endsWith('.spec.ts')) {
        files.push(normalisePath(relative(SKILL_DIR, fullPath)));
      }
    }
  }

  walk(dir);
  return files.sort();
}

function lineNumber(sourceFile: ts.SourceFile, node: ts.Node): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function identifierText(node: ts.Expression): string | null {
  return ts.isIdentifier(node) ? node.text : null;
}

function testCallParts(node: ts.CallExpression): { root: string; modifier: string | null } | null {
  const expression = node.expression;
  if (ts.isIdentifier(expression)) {
    return { root: expression.text, modifier: null };
  }

  if (ts.isPropertyAccessExpression(expression)) {
    const root = identifierText(expression.expression);
    if (!root) return null;
    return { root, modifier: expression.name.text };
  }

  return null;
}

function eachTestCallParts(node: ts.CallExpression): { root: string; modifier: string } | null {
  const expression = node.expression;
  if (!ts.isCallExpression(expression)) return null;
  const parts = testCallParts(expression);
  return parts?.modifier === 'each' ? { root: parts.root, modifier: parts.modifier } : null;
}

function isLiteralNode(node: ts.Node): boolean {
  return (
    ts.isStringLiteral(node) ||
    ts.isNumericLiteral(node) ||
    node.kind === ts.SyntaxKind.TrueKeyword ||
    node.kind === ts.SyntaxKind.FalseKeyword ||
    node.kind === ts.SyntaxKind.NullKeyword ||
    node.kind === ts.SyntaxKind.UndefinedKeyword
  );
}

function containsExpectCall(node: ts.Node): boolean {
  let found = false;

  function visit(current: ts.Node): void {
    if (found) return;
    if (ts.isCallExpression(current) && ts.isIdentifier(current.expression) && current.expression.text === 'expect') {
      found = true;
      return;
    }
    ts.forEachChild(current, visit);
  }

  visit(node);
  return found;
}

describe('test integrity', () => {
  test('spec files avoid focused, skipped, empty, snapshot, and tautological tests', () => {
    const failures: string[] = [];

    for (const relPath of collectSpecFiles(SKILL_DIR)) {
      const fullPath = join(SKILL_DIR, relPath);
      const sourceText = readFileSync(fullPath, 'utf-8');
      const sourceFile = ts.createSourceFile(fullPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

      function visit(node: ts.Node): void {
        if (ts.isCallExpression(node)) {
          const eachParts = eachTestCallParts(node);
          const parts = eachParts ?? testCallParts(node);
          if (parts && (TEST_FUNCTIONS.has(parts.root) || SUITE_FUNCTIONS.has(parts.root))) {
            if (parts.modifier && DISABLED_MODIFIERS.has(parts.modifier)) {
              failures.push(
                `${relPath}:${lineNumber(sourceFile, node)}: ${parts.root}.${parts.modifier} is not allowed`,
              );
            }
          }

          if (parts && TEST_FUNCTIONS.has(parts.root) && parts.modifier !== 'each') {
            const callback = node.arguments[1];
            if (!callback || (!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback))) {
              failures.push(`${relPath}:${lineNumber(sourceFile, node)}: test must provide an inline callback`);
            } else if (!containsExpectCall(callback.body)) {
              failures.push(`${relPath}:${lineNumber(sourceFile, node)}: test must contain an expect() assertion`);
            }
          }

          if (eachParts && TEST_FUNCTIONS.has(eachParts.root)) {
            const callback = node.arguments[1];
            if (!callback || (!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback))) {
              failures.push(`${relPath}:${lineNumber(sourceFile, node)}: test.each must provide an inline callback`);
            } else if (!containsExpectCall(callback.body)) {
              failures.push(`${relPath}:${lineNumber(sourceFile, node)}: test.each must contain an expect() assertion`);
            }
          }

          if (ts.isPropertyAccessExpression(node.expression)) {
            const matcher = node.expression.name.text;
            if (SNAPSHOT_MATCHERS.has(matcher)) {
              failures.push(`${relPath}:${lineNumber(sourceFile, node)}: snapshot assertions need explicit review`);
            }

            const expectCall = node.expression.expression;
            if (LITERAL_MATCHERS.has(matcher) && ts.isCallExpression(expectCall)) {
              const received = expectCall.arguments[0];
              const expected = node.arguments[0];
              if (
                received &&
                expected &&
                isLiteralNode(received) &&
                isLiteralNode(expected) &&
                received.getText(sourceFile) === expected.getText(sourceFile)
              ) {
                failures.push(
                  `${relPath}:${lineNumber(sourceFile, node)}: tautological literal assertion is not allowed`,
                );
              }
            }
          }
        }

        ts.forEachChild(node, visit);
      }

      visit(sourceFile);
    }

    expect(failures).toEqual([]);
  });
});
