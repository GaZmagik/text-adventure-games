import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

const SKILL_DIR = resolve(import.meta.dir, '../../..');
const BROWSER_FACING_RENDER_ROOTS = ['cli/render/templates', 'cli/render/lib'];
const HOST_GLOBALS = new Set(['Bun', 'process']);
const NODE_BUILTINS = new Set(builtinModules.map(moduleName => moduleName.replace(/^node:/, '').split('/')[0]));

function normalisePath(path: string): string {
  return path.split('\\').join('/');
}

function collectProductionTsFiles(root: string): string[] {
  const files: string[] = [];

  function walk(current: string): void {
    for (const entry of readdirSync(current).sort()) {
      const fullPath = join(current, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile() && fullPath.endsWith('.ts') && !fullPath.endsWith('.spec.ts')) {
        files.push(normalisePath(relative(SKILL_DIR, fullPath)));
      }
    }
  }

  walk(join(SKILL_DIR, root));
  return files.sort();
}

function isNodeBuiltinSpecifier(specifier: string): boolean {
  const bareSpecifier = specifier.replace(/^node:/, '');
  const packageName = bareSpecifier.split('/')[0];
  return specifier.startsWith('node:') || NODE_BUILTINS.has(packageName);
}

function lineNumber(sourceFile: ts.SourceFile, node: ts.Node): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function literalText(node: ts.Node): string | null {
  return ts.isStringLiteralLike(node) ? node.text : null;
}

function hostGlobalReferenceName(node: ts.Identifier): string | null {
  if (!HOST_GLOBALS.has(node.text)) return null;

  if (ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) {
    return null;
  }

  if (ts.isPropertyAssignment(node.parent) && node.parent.name === node) {
    return null;
  }

  return node.text;
}

describe('architectural import boundaries', () => {
  test('browser-facing render code avoids Node modules and host runtime globals', () => {
    const failures: string[] = [];
    const relPaths = BROWSER_FACING_RENDER_ROOTS.flatMap(root => collectProductionTsFiles(root));

    for (const relPath of relPaths) {
      const fullPath = join(SKILL_DIR, relPath);
      const sourceText = readFileSync(fullPath, 'utf-8');
      const sourceFile = ts.createSourceFile(fullPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

      function checkModuleSpecifier(node: ts.Node, specifier: string): void {
        if (!isNodeBuiltinSpecifier(specifier)) return;
        failures.push(
          `${relPath}:${lineNumber(sourceFile, node)}: browser-facing render code must not import ${specifier}`,
        );
      }

      function visit(node: ts.Node): void {
        if (ts.isImportDeclaration(node)) {
          const specifier = literalText(node.moduleSpecifier);
          if (specifier) checkModuleSpecifier(node.moduleSpecifier, specifier);
        }

        if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
          const specifier = literalText(node.moduleSpecifier);
          if (specifier) checkModuleSpecifier(node.moduleSpecifier, specifier);
        }

        if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
          const specifier = literalText(node.moduleReference.expression);
          if (specifier) checkModuleSpecifier(node.moduleReference.expression, specifier);
        }

        if (ts.isCallExpression(node)) {
          if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
            const firstArgument = node.arguments[0];
            const specifier = firstArgument ? literalText(firstArgument) : null;
            if (firstArgument && specifier) checkModuleSpecifier(firstArgument, specifier);
          }

          if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
            const firstArgument = node.arguments[0];
            const specifier = firstArgument ? literalText(firstArgument) : null;
            if (firstArgument && specifier) checkModuleSpecifier(firstArgument, specifier);
          }
        }

        if (ts.isIdentifier(node)) {
          const globalName = hostGlobalReferenceName(node);
          if (globalName) {
            failures.push(
              `${relPath}:${lineNumber(sourceFile, node)}: browser-facing render code must not reference ${globalName}`,
            );
          }
        }

        ts.forEachChild(node, visit);
      }

      visit(sourceFile);
    }

    expect(failures).toEqual([]);
  });
});
