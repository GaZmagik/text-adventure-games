import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { WIDGET_TYPE_NAMES } from '../../metadata';
import { TEMPLATE_KEYS } from '../../commands/render';

const SKILL_DIR = resolve(import.meta.dir, '../../..');
const TEMPLATE_DIR = join(SKILL_DIR, 'cli/render/templates');

function normalisePath(path: string): string {
  return path.split('\\').join('/');
}

function collectTemplateFiles(): string[] {
  return readdirSync(TEMPLATE_DIR)
    .sort()
    .filter(entry => entry.endsWith('.ts') && !entry.endsWith('.spec.ts'))
    .filter(entry => statSync(join(TEMPLATE_DIR, entry)).isFile())
    .map(entry => normalisePath(relative(SKILL_DIR, join(TEMPLATE_DIR, entry))));
}

function widgetTypeFromTemplatePath(relPath: string): string {
  return relPath.replace(/^cli\/render\/templates\//, '').replace(/\.ts$/, '');
}

function expectedRenderExportName(widgetType: string): string {
  const suffix = widgetType
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return `render${suffix}`;
}

function exportedFunctionNames(sourceFile: ts.SourceFile): Set<string> {
  const names = new Set<string>();

  function hasExportModifier(node: ts.Node & { modifiers?: ts.NodeArray<ts.ModifierLike> }): boolean {
    return !!node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
  }

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && hasExportModifier(statement) && statement.name) {
      names.add(statement.name.text);
      continue;
    }

    if (!ts.isVariableStatement(statement) || !hasExportModifier(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;
      const init = declaration.initializer;
      if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
        names.add(declaration.name.text);
      }
    }
  }

  return names;
}

describe('metadata sync', () => {
  test('template files, metadata widget names, and render registry stay aligned', () => {
    const templateFiles = collectTemplateFiles();
    const fileWidgetTypes = templateFiles.map(widgetTypeFromTemplatePath).sort();
    const metadataWidgetTypes = [...WIDGET_TYPE_NAMES].sort();
    const renderRegistryWidgetTypes = [...TEMPLATE_KEYS].sort();

    expect(fileWidgetTypes).toEqual(metadataWidgetTypes);
    expect(fileWidgetTypes).toEqual(renderRegistryWidgetTypes);
  });

  test('every template file exports its expected render function', () => {
    const failures: string[] = [];

    for (const relPath of collectTemplateFiles()) {
      const fullPath = join(SKILL_DIR, relPath);
      const sourceText = readFileSync(fullPath, 'utf-8');
      const sourceFile = ts.createSourceFile(fullPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
      const exportNames = exportedFunctionNames(sourceFile);
      const widgetType = widgetTypeFromTemplatePath(relPath);
      const expectedExport = expectedRenderExportName(widgetType);

      if (!exportNames.has(expectedExport)) {
        failures.push(
          `${relPath}: expected exported render function ${expectedExport}() for widget type "${widgetType}"`,
        );
      }
    }

    expect(failures).toEqual([]);
  });
});
