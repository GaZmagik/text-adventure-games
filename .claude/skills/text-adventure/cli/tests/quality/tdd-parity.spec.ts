import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const SKILL_DIR = resolve(import.meta.dir, '../../..');
const TDD_IGNORE = '.tddignore';

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

async function readTddIgnore(): Promise<Set<string>> {
  const source = await Bun.file(join(SKILL_DIR, TDD_IGNORE)).text();
  return new Set(
    source
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#')),
  );
}

describe('TDD parity', () => {
  test('production TypeScript files have colocated specs or active .tddignore exceptions', async () => {
    const allTsFiles = collectTsFiles(SKILL_DIR);
    const specFiles = new Set(allTsFiles.filter(file => file.endsWith('.spec.ts')));
    const ignored = await readTddIgnore();
    const failures: string[] = [];

    for (const relPath of allTsFiles) {
      if (relPath.endsWith('.spec.ts') || relPath.endsWith('.playwright.ts')) continue;

      const expectedSpec = relPath.replace(/\.ts$/, '.spec.ts');
      if (specFiles.has(expectedSpec)) continue;
      if (ignored.has(relPath)) continue;

      failures.push(`${relPath}: missing colocated spec ${expectedSpec} or documented ${TDD_IGNORE} exception`);
    }

    expect(failures).toEqual([]);
  });

  test('.tddignore entries are current production TypeScript files without colocated specs', async () => {
    const allTsFiles = new Set(collectTsFiles(SKILL_DIR));
    const specFiles = new Set([...allTsFiles].filter(file => file.endsWith('.spec.ts')));
    const ignored = await readTddIgnore();
    const failures: string[] = [];

    expect(existsSync(join(SKILL_DIR, TDD_IGNORE))).toBe(true);

    for (const relPath of [...ignored].sort()) {
      if (!relPath.endsWith('.ts')) {
        failures.push(`${relPath}: ${TDD_IGNORE} entries must point to TypeScript source files`);
        continue;
      }

      if (!allTsFiles.has(relPath)) {
        failures.push(`${relPath}: ${TDD_IGNORE} entry points to a missing file`);
        continue;
      }

      if (relPath.endsWith('.spec.ts')) {
        failures.push(`${relPath}: spec files do not need ${TDD_IGNORE} exceptions`);
        continue;
      }

      const expectedSpec = relPath.replace(/\.ts$/, '.spec.ts');
      if (specFiles.has(expectedSpec)) {
        failures.push(`${relPath}: stale ${TDD_IGNORE} entry because ${expectedSpec} exists`);
      }
    }

    expect(failures).toEqual([]);
  });
});
