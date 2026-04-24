import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

const SKILL_DIR = resolve(import.meta.dir, '../../..');
const GENERATED_TS_FILES = new Set(['assets/cdn-manifest.ts']);

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

function hasExportModifier(node: ts.Node): boolean {
  return (
    ts.canHaveModifiers(node) && (ts.getModifiers(node)?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword) ?? false)
  );
}

function lineNumber(sourceFile: ts.SourceFile, node: ts.Node): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

describe('public API typing', () => {
  test('exported function APIs declare return types', () => {
    const failures: string[] = [];

    for (const relPath of collectTsFiles(SKILL_DIR)) {
      if (relPath.endsWith('.spec.ts') || GENERATED_TS_FILES.has(relPath)) continue;

      const fullPath = join(SKILL_DIR, relPath);
      const sourceText = readFileSync(fullPath, 'utf-8');
      const sourceFile = ts.createSourceFile(fullPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

      function visit(node: ts.Node): void {
        if (ts.isFunctionDeclaration(node) && hasExportModifier(node) && !node.type) {
          const name = node.name?.getText(sourceFile) ?? '<anonymous>';
          failures.push(
            `${relPath}:${lineNumber(sourceFile, node)}: exported function ${name} needs an explicit return type`,
          );
        }

        if (ts.isVariableStatement(node) && hasExportModifier(node)) {
          for (const declaration of node.declarationList.declarations) {
            const initializer = declaration.initializer;
            const isFunctionValue =
              initializer !== undefined && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer));
            if (isFunctionValue && !initializer.type && !declaration.type) {
              failures.push(
                `${relPath}:${lineNumber(sourceFile, declaration)}: exported function variable ${declaration.name.getText(sourceFile)} needs an explicit return type or variable type`,
              );
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
