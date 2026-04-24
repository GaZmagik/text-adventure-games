import { afterEach, describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectRelativeFiles, compareAssetTrees, formatDriftReport } from './check-generated-assets';

const tempDirs: string[] = [];

function makeTempDir(label: string): string {
  const path = join(tmpdir(), `tag-${label}-${crypto.randomUUID()}`);
  mkdirSync(path, { recursive: true });
  tempDirs.push(path);
  return path;
}

function writeFixture(root: string, path: string, content: string): void {
  const fullPath = join(root, path);
  mkdirSync(join(fullPath, '..'), { recursive: true });
  writeFileSync(fullPath, content, 'utf-8');
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('check-generated-assets helpers', () => {
  test('collectRelativeFiles returns sorted nested paths', () => {
    const root = makeTempDir('assets-list');
    writeFixture(root, 'js/tag-scene.js', 'scene');
    writeFixture(root, 'css/station.css', 'station');

    expect(collectRelativeFiles(root)).toEqual(['css/station.css', 'js/tag-scene.js']);
  });

  test('compareAssetTrees returns no drift for identical trees', () => {
    const expected = makeTempDir('assets-expected');
    const actual = makeTempDir('assets-actual');
    writeFixture(expected, 'css/station.css', 'station');
    writeFixture(actual, 'css/station.css', 'station');

    expect(compareAssetTrees(expected, actual)).toEqual([]);
  });

  test('compareAssetTrees reports changed, missing, and stale files', () => {
    const expected = makeTempDir('assets-expected');
    const actual = makeTempDir('assets-actual');
    writeFixture(expected, 'css/station.css', 'new');
    writeFixture(expected, 'js/tag-scene.js', 'scene');
    writeFixture(actual, 'css/station.css', 'old');
    writeFixture(actual, 'icons/stale.svg', 'stale');

    expect(compareAssetTrees(expected, actual)).toEqual([
      { kind: 'different', path: 'css/station.css' },
      { kind: 'extra', path: 'icons/stale.svg' },
      { kind: 'missing', path: 'js/tag-scene.js' },
    ]);
  });

  test('formatDriftReport gives a release command when drift exists', () => {
    const report = formatDriftReport([{ kind: 'different', path: 'css/station.css' }]);

    expect(report).toContain('Generated assets are out of date.');
    expect(report).toContain('- different: css/station.css');
    expect(report).toContain('bun ./cli/tag.ts build-css --release v1.4.0');
  });
});
