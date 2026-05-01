import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const SKILL_DIR = resolve(import.meta.dir, '../../..');
const REPO_ROOT = resolve(SKILL_DIR, '../../..');
const PACKAGE_JSON_PATH = join(SKILL_DIR, 'package.json');
const PLAYWRIGHT_CONFIG_PATH = join(SKILL_DIR, 'playwright.config.ts');
const ZIP_SCRIPT_PATH = join(REPO_ROOT, 'scripts', 'zip.sh');
const ZIP_OUTPUT_PATH = join(REPO_ROOT, 'text-adventure.zip');
const LOCAL_PATH_PATTERNS = [/\/home\/(?!claude\/)/, /file:\/\//i, /\/Users\//, /[A-Z]:\\\\/];

type DistributionAudit = {
  entries: string[];
  textEntries: Record<string, string>;
};

let distributionAuditPromise: Promise<DistributionAudit> | null = null;

function decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function runCommand(args: string[], cwd: string): string {
  const result = Bun.spawnSync(args, {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  if (result.exitCode !== 0) {
    throw new Error(
      `${args.join(' ')} failed with exit ${result.exitCode}\n${decode(result.stderr).trim() || decode(result.stdout).trim()}`,
    );
  }
  return decode(result.stdout);
}

function isTextEntry(entry: string): boolean {
  return /\.(?:css|js|json|md|sh|svg|ts)$/i.test(entry);
}

async function buildDistributionAudit(): Promise<DistributionAudit> {
  runCommand(['bash', ZIP_SCRIPT_PATH], REPO_ROOT);
  const entries = runCommand(['unzip', '-Z', '-1', ZIP_OUTPUT_PATH], REPO_ROOT)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .sort();

  const textEntries: Record<string, string> = {};
  for (const entry of entries) {
    if (!isTextEntry(entry)) continue;
    textEntries[entry] = runCommand(['unzip', '-p', ZIP_OUTPUT_PATH, entry], REPO_ROOT);
  }

  return { entries, textEntries };
}

function distributionAudit(): Promise<DistributionAudit> {
  if (!distributionAuditPromise) {
    distributionAuditPromise = buildDistributionAudit();
  }
  return distributionAuditPromise;
}

describe('package surface', () => {
  test('package.json keeps the runtime surface intentionally narrow', async () => {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf-8')) as {
      name?: unknown;
      type?: unknown;
      bin?: unknown;
      dependencies?: unknown;
      optionalDependencies?: unknown;
      peerDependencies?: unknown;
      exports?: unknown;
      files?: unknown;
      publishConfig?: unknown;
    };

    expect(pkg.name).toBe('tag-cli');
    expect(pkg.type).toBe('module');
    expect(pkg.bin).toEqual({ tag: './cli/tag.ts' });
    expect(pkg.dependencies ?? {}).toEqual({});
    expect(pkg.optionalDependencies ?? {}).toEqual({});
    expect(pkg.peerDependencies ?? {}).toEqual({});
    expect(pkg.exports).toBeUndefined();
    expect(pkg.files).toBeUndefined();
    expect(pkg.publishConfig).toBeUndefined();
  });

  test('browser regression tests are wired into project scripts and Playwright discovery', () => {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf-8')) as {
      scripts?: Record<string, string>;
    };
    const config = readFileSync(PLAYWRIGHT_CONFIG_PATH, 'utf-8');

    expect(pkg.scripts?.test).toContain('test:browser');
    expect(pkg.scripts?.['test:browser']).toContain('playwright test');
    expect(config).toContain('*.playwright.ts');
  });

  test('distribution zip excludes dev-only files and retains required runtime assets', async () => {
    const { entries } = await distributionAudit();

    const forbiddenPatterns = [
      /^cli\/tests\//,
      /^scripts\//,
      /^docs\//,
      /^playwright-report\//,
      /^test-results\//,
      /^node_modules\//,
      /^coverage\//,
      /^scratch\//,
      /\.spec\.ts$/,
      /^playwright\.config\.ts$/,
      /^bun\.lock$/,
    ];

    const forbidden = entries.filter(entry => forbiddenPatterns.some(pattern => pattern.test(entry)));
    expect(forbidden).toEqual([]);

    expect(entries).toContain('SKILL.md');
    expect(entries).toContain('README.md');
    expect(entries).toContain('package.json');
    expect(entries).toContain('setup.sh');
    expect(entries).toContain('cli/tag.ts');
    expect(entries).toContain('assets/cdn-manifest.ts');
    expect(entries).toContain('assets/data/names/base.json');
    expect(entries).toContain('assets/data/names/real-world.json');
    expect(entries).toContain('assets/data/names/sci-fi.json');
  });

  test('shipped text surface contains no local machine paths or preview-server URLs', async () => {
    const { textEntries } = await distributionAudit();
    const failures: string[] = [];

    for (const [entry, content] of Object.entries(textEntries)) {
      for (const pattern of LOCAL_PATH_PATTERNS) {
        if (pattern.test(content)) {
          failures.push(`${entry}: matches ${pattern}`);
        }
      }
      if (/127\.0\.0\.1|localhost/.test(content)) {
        failures.push(`${entry}: contains local preview URL`);
      }
    }

    expect(failures).toEqual([]);
  });

  test('distribution zip does not leak checked-in generated bundle sources from the wrong tree slice', async () => {
    const { entries } = await distributionAudit();
    const runtimeBundleEntries = entries.filter(
      entry => entry.startsWith('assets/') && /\.(css|js|svg|json|ts)$/i.test(entry),
    );

    expect(runtimeBundleEntries.map(entry => basename(entry)).sort()).toEqual(
      expect.arrayContaining(['cdn-manifest.ts', 'base.json', 'real-world.json', 'sci-fi.json']),
    );
  });
});
