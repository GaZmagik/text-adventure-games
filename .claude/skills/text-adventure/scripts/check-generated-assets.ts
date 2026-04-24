// Generated-asset drift guard compares a fresh build-css output tree against checked-in assets.
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, relative, resolve } from 'node:path';
import { handleBuildCss } from '../cli/commands/build-css';

type DriftKind = 'missing' | 'extra' | 'different';

export type AssetDrift = {
  kind: DriftKind;
  path: string;
};

const SCRIPT_DIR = import.meta.dir;
const SKILL_DIR = resolve(SCRIPT_DIR, '..');
const ASSETS_DIR = join(SKILL_DIR, 'assets');
const PACKAGE_JSON = join(SKILL_DIR, 'package.json');

function normalisePath(path: string): string {
  return path.split('\\').join('/');
}

export function collectRelativeFiles(rootDir: string): string[] {
  const files: string[] = [];

  function walk(dir: string): void {
    for (const entry of readdirSync(dir).sort()) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile()) {
        files.push(normalisePath(relative(rootDir, fullPath)));
      }
    }
  }

  walk(rootDir);
  return files.sort();
}

export function compareAssetTrees(expectedDir: string, actualDir: string): AssetDrift[] {
  const expectedFiles = new Set(collectRelativeFiles(expectedDir));
  const actualFiles = new Set(collectRelativeFiles(actualDir));
  const allFiles = [...new Set([...expectedFiles, ...actualFiles])].sort();
  const drift: AssetDrift[] = [];

  for (const path of allFiles) {
    if (!expectedFiles.has(path)) {
      drift.push({ kind: 'extra', path });
      continue;
    }
    if (!actualFiles.has(path)) {
      drift.push({ kind: 'missing', path });
      continue;
    }

    const expected = readFileSync(join(expectedDir, path));
    const actual = readFileSync(join(actualDir, path));
    if (!expected.equals(actual)) {
      drift.push({ kind: 'different', path });
    }
  }

  return drift;
}

export function formatDriftReport(drift: AssetDrift[]): string {
  if (drift.length === 0) return 'Generated assets are up to date.';
  const lines = [
    'Generated assets are out of date.',
    '',
    ...drift.map(item => `- ${item.kind}: ${item.path}`),
    '',
    'Run: bun ./cli/tag.ts build-css --release v1.4.0',
  ];
  return lines.join('\n');
}

async function releaseVersion(): Promise<string> {
  const pkg = (await Bun.file(PACKAGE_JSON).json()) as { version?: unknown };
  if (typeof pkg.version !== 'string' || pkg.version.trim() === '') {
    throw new Error(`Cannot read package version from ${PACKAGE_JSON}.`);
  }
  return `v${pkg.version}`;
}

export async function checkGeneratedAssets(): Promise<AssetDrift[]> {
  const outputDir = mkdtempSync(join(tmpdir(), 'tag-generated-assets-'));
  try {
    const release = await releaseVersion();
    const result = await handleBuildCss(['--output-dir', outputDir, '--release', release]);
    if (!result.ok) {
      throw new Error(result.error?.message ?? 'tag build-css failed.');
    }
    return compareAssetTrees(outputDir, ASSETS_DIR);
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  const drift = await checkGeneratedAssets();
  const report = formatDriftReport(drift);
  if (drift.length > 0) {
    console.error(report);
    process.exit(1);
  }
  console.log(`${report} (${basename(ASSETS_DIR)}/)`);
}
