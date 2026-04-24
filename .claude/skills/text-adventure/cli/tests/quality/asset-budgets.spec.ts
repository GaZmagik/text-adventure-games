import { describe, expect, test } from 'bun:test';
import { readdirSync, statSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';

const SKILL_DIR = resolve(import.meta.dir, '../../..');
const BUDGET_PATH = join(import.meta.dir, 'asset-budgets.json');
const THEME_CSS_EXCLUDES = new Set(['common-widget.css', 'pregame-design.css', 'scene-design.css']);

type AssetBudgetConfig = {
  files: Record<string, number>;
  groups: {
    maxThemeCssBytes: number;
    totalCssBytes: number;
    totalGeneratedAssetsBytes: number;
    totalJsBytes: number;
  };
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

function bytes(relPath: string): number {
  return statSync(join(SKILL_DIR, relPath)).size;
}

async function readBudgets(): Promise<AssetBudgetConfig> {
  return (await Bun.file(BUDGET_PATH).json()) as AssetBudgetConfig;
}

function overBudgetMessage(relPath: string, actualBytes: number, budgetBytes: number): string {
  return `${relPath}: ${actualBytes} bytes exceeds ${budgetBytes} byte budget`;
}

describe('generated asset budgets', () => {
  test('generated CDN assets stay within reviewed size budgets', async () => {
    const budgets = await readBudgets();
    const failures: string[] = [];

    for (const [relPath, budgetBytes] of Object.entries(budgets.files).sort()) {
      const actualBytes = bytes(relPath);
      if (actualBytes > budgetBytes) {
        failures.push(overBudgetMessage(relPath, actualBytes, budgetBytes));
      }
    }

    const cssFiles = collectFiles('assets/css', path => path.endsWith('.css'));
    const jsFiles = collectFiles('assets/js', path => path.endsWith('.js'));
    const generatedAssetFiles = collectFiles('assets', _path => true);
    const themeCssFiles = cssFiles.filter(file => !THEME_CSS_EXCLUDES.has(basename(file)));

    const totalCssBytes = cssFiles.reduce((total, file) => total + bytes(file), 0);
    const totalJsBytes = jsFiles.reduce((total, file) => total + bytes(file), 0);
    const totalGeneratedAssetsBytes = generatedAssetFiles.reduce((total, file) => total + bytes(file), 0);

    if (totalCssBytes > budgets.groups.totalCssBytes) {
      failures.push(overBudgetMessage('assets/css/*.css', totalCssBytes, budgets.groups.totalCssBytes));
    }

    if (totalJsBytes > budgets.groups.totalJsBytes) {
      failures.push(overBudgetMessage('assets/js/*.js', totalJsBytes, budgets.groups.totalJsBytes));
    }

    if (totalGeneratedAssetsBytes > budgets.groups.totalGeneratedAssetsBytes) {
      failures.push(
        overBudgetMessage('assets/**/*', totalGeneratedAssetsBytes, budgets.groups.totalGeneratedAssetsBytes),
      );
    }

    for (const relPath of themeCssFiles) {
      const actualBytes = bytes(relPath);
      if (actualBytes > budgets.groups.maxThemeCssBytes) {
        failures.push(overBudgetMessage(relPath, actualBytes, budgets.groups.maxThemeCssBytes));
      }
    }

    expect(failures).toEqual([]);
  });
});
