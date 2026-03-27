import { describe, test, expect, afterEach } from 'bun:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  PATH_SECURITY_RUNTIME,
  looksLikeSafeReadPath,
  readSafeTextFile,
  resolveSafeReadPath,
} from './path-security';

let tempDir = '';

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = '';
  }
});

function makeTempDir(): string {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-path-security-'));
  return tempDir;
}

describe('looksLikeSafeReadPath', () => {
  test('accepts obvious file-like inputs and rejects plain save strings', () => {
    expect(looksLikeSafeReadPath('/tmp/world.lore.md', ['.md'])).toBe(true);
    expect(looksLikeSafeReadPath('./world.lore.md', ['.md'])).toBe(true);
    expect(looksLikeSafeReadPath('world.lore.md', ['.md'])).toBe(true);
    expect(looksLikeSafeReadPath('deadbeef.SF2:abc', ['.md'])).toBe(false);
  });
});

describe('resolveSafeReadPath', () => {
  test('resolves files inside the temp directory', () => {
    const dir = makeTempDir();
    const filePath = join(dir, 'world.lore.md');
    writeFileSync(filePath, 'ok', 'utf-8');

    expect(resolveSafeReadPath(filePath, { kind: 'Lore', extensions: ['.md'] })).toBe(filePath);
  });

  test('throws a file-not-found error for missing paths', () => {
    const dir = makeTempDir();
    const filePath = join(dir, 'missing.lore.md');

    expect(() => resolveSafeReadPath(filePath, { kind: 'Lore', extensions: ['.md'] }))
      .toThrow('Lore file not found');
  });

  test('requires a non-root home directory during validation', () => {
    const dir = makeTempDir();
    const filePath = join(dir, 'world.lore.md');
    writeFileSync(filePath, 'ok', 'utf-8');

    const originalHomedir = PATH_SECURITY_RUNTIME.homedir;
    PATH_SECURITY_RUNTIME.homedir = () => '/';
    try {
      expect(() => resolveSafeReadPath(filePath, { kind: 'Lore', extensions: ['.md'] }))
        .toThrow('non-root home directory');
    } finally {
      PATH_SECURITY_RUNTIME.homedir = originalHomedir;
    }
  });
});

describe('resolveSafeReadPath — /mnt/ prefix', () => {
  test('accepts files under /mnt/ directory', () => {
    const dir = makeTempDir();
    const mntDir = join(dir, 'mnt-test');
    mkdirSync(mntDir);
    const filePath = join(mntDir, 'world.save.md');
    writeFileSync(filePath, 'save data', 'utf-8');

    // Simulate /mnt/ prefix by mocking realpathSync to return a /mnt/ path
    const originalRealpath = PATH_SECURITY_RUNTIME.realpathSync;
    PATH_SECURITY_RUNTIME.realpathSync = (() => '/mnt/user-data/uploads/world.save.md') as unknown as typeof PATH_SECURITY_RUNTIME.realpathSync;
    try {
      const result = resolveSafeReadPath(filePath, { kind: 'Save', extensions: ['.md'] });
      expect(result).toBe('/mnt/user-data/uploads/world.save.md');
    } finally {
      PATH_SECURITY_RUNTIME.realpathSync = originalRealpath;
    }
  });

  test('rejects files outside home, tmp, and /mnt/', () => {
    const dir = makeTempDir();
    const filePath = join(dir, 'world.save.md');
    writeFileSync(filePath, 'save data', 'utf-8');

    const originalRealpath = PATH_SECURITY_RUNTIME.realpathSync;
    PATH_SECURITY_RUNTIME.realpathSync = (() => '/etc/shadow') as unknown as typeof PATH_SECURITY_RUNTIME.realpathSync;
    try {
      expect(() => resolveSafeReadPath(filePath, { kind: 'Save', extensions: ['.md'] }))
        .toThrow('must be within the home, temp, or /mnt/ directory');
    } finally {
      PATH_SECURITY_RUNTIME.realpathSync = originalRealpath;
    }
  });
});

describe('readSafeTextFile', () => {
  test('reads normal text files', async () => {
    const dir = makeTempDir();
    const filePath = join(dir, 'world.lore.md');
    writeFileSync(filePath, 'hello world', 'utf-8');

    await expect(readSafeTextFile(filePath, 'Lore')).resolves.toBe('hello world');
  });

  test('reports read failures cleanly', async () => {
    const dir = makeTempDir();
    const folderPath = join(dir, 'folder');
    mkdirSync(folderPath);

    const bunApi = Bun as any;
    const originalFile = bunApi.file;
    bunApi.file = () => ({
      size: 0,
      exists: async () => true,
      text: async () => {
        throw new Error('simulated read failure');
      },
    });

    try {
      await expect(readSafeTextFile(folderPath, 'Lore')).rejects.toThrow('Lore file could not be read.');
    } finally {
      bunApi.file = originalFile;
    }
  });
});
