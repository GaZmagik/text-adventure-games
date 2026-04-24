import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import {
  clearWorkflowMarkers,
  writeCompactionBlock,
  clearCompactionBlock,
  isCompactionBlocked,
} from './workflow-markers';
import { STATE_STORE_RUNTIME } from './state-store';

const originalHomedir = STATE_STORE_RUNTIME.homedir;
let testDir: string;

beforeEach(() => {
  testDir = join(tmpdir(), `tag-wfm-test-${randomUUID().slice(0, 8)}`);
  mkdirSync(testDir, { recursive: true });
  process.env.TAG_STATE_DIR = testDir;
  STATE_STORE_RUNTIME.homedir = () => tmpdir();
});

afterEach(() => {
  delete process.env.TAG_STATE_DIR;
  STATE_STORE_RUNTIME.homedir = originalHomedir;
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    /* cleanup */
  }
});

describe('clearWorkflowMarkers', () => {
  test('removes .last-sync, .last-verify, .needs-verify markers', () => {
    for (const name of ['.last-sync', '.last-verify', '.needs-verify']) {
      writeFileSync(join(testDir, name), 'test');
    }
    clearWorkflowMarkers();
    for (const name of ['.last-sync', '.last-verify', '.needs-verify']) {
      expect(existsSync(join(testDir, name))).toBe(false);
    }
  });

  test('does not throw when markers do not exist', () => {
    expect(() => clearWorkflowMarkers()).not.toThrow();
  });
});

describe('clearWorkflowMarkers with includePreGameVerify', () => {
  test('removes .verified-* markers when includePreGameVerify is true', () => {
    for (const name of ['.verified-scenario', '.verified-rules', '.verified-character']) {
      writeFileSync(join(testDir, name), 'marker');
    }
    writeFileSync(join(testDir, '.last-sync'), 'sync');

    clearWorkflowMarkers({ includePreGameVerify: true });

    expect(existsSync(join(testDir, '.verified-scenario'))).toBe(false);
    expect(existsSync(join(testDir, '.verified-rules'))).toBe(false);
    expect(existsSync(join(testDir, '.verified-character'))).toBe(false);
    expect(existsSync(join(testDir, '.last-sync'))).toBe(false);
  });

  test('preserves .verified-* markers when includePreGameVerify is false', () => {
    for (const name of ['.verified-scenario', '.verified-rules', '.verified-character']) {
      writeFileSync(join(testDir, name), 'marker');
    }
    writeFileSync(join(testDir, '.last-sync'), 'sync');

    clearWorkflowMarkers({ includePreGameVerify: false });

    expect(existsSync(join(testDir, '.verified-scenario'))).toBe(true);
    expect(existsSync(join(testDir, '.verified-rules'))).toBe(true);
    expect(existsSync(join(testDir, '.verified-character'))).toBe(true);
    expect(existsSync(join(testDir, '.last-sync'))).toBe(false);
  });
});

describe('compaction block marker', () => {
  test('writeCompactionBlock creates .compaction-blocked marker', () => {
    writeCompactionBlock('Module specs evicted');
    expect(existsSync(join(testDir, '.compaction-blocked'))).toBe(true);
  });

  test('writeCompactionBlock stores the reason in the marker', () => {
    writeCompactionBlock('3 new compactions detected');
    const content = readFileSync(join(testDir, '.compaction-blocked'), 'utf-8');
    expect(content).toContain('3 new compactions detected');
  });

  test('isCompactionBlocked returns false when no marker exists', () => {
    expect(isCompactionBlocked()).toBe(false);
  });

  test('isCompactionBlocked returns true after writeCompactionBlock', () => {
    writeCompactionBlock('compaction');
    expect(isCompactionBlocked()).toBe(true);
  });

  test('clearCompactionBlock removes the marker', () => {
    writeCompactionBlock('compaction');
    expect(isCompactionBlocked()).toBe(true);
    clearCompactionBlock();
    expect(isCompactionBlocked()).toBe(false);
    expect(existsSync(join(testDir, '.compaction-blocked'))).toBe(false);
  });

  test('clearCompactionBlock does not throw when no marker exists', () => {
    expect(() => clearCompactionBlock()).not.toThrow();
  });

  test('clearWorkflowMarkers does NOT remove compaction block marker', () => {
    writeCompactionBlock('compaction');
    clearWorkflowMarkers();
    expect(isCompactionBlocked()).toBe(true);
  });

  test('isCompactionBlocked returns false when state dir does not exist', () => {
    process.env.TAG_STATE_DIR = join(tmpdir(), `nonexistent-${randomUUID().slice(0, 8)}`);
    expect(isCompactionBlocked()).toBe(false);
  });
});
