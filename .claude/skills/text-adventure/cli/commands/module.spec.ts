import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleModule } from './module';
import { handleState } from './state';
import { loadState } from '../lib/state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-module-test-'));
  process.env.TAG_STATE_DIR = tempDir;
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) process.env.TAG_STATE_DIR = originalEnv;
  else delete process.env.TAG_STATE_DIR;
});

describe('tag module activate', () => {
  test('returns module content for a valid module', async () => {
    await handleState(['reset']);
    const result = await handleModule(['activate', 'prose-craft']);
    expect(result.ok).toBe(true);
    const data = result.data as { module: string; modulePath: string; addedToActive: boolean; addedToRead: boolean };
    expect(data.module).toBe('prose-craft');
    expect(data.modulePath).toContain('prose-craft');
  });

  test('adds module to modulesActive if not present', async () => {
    await handleState(['reset']);
    const result = await handleModule(['activate', 'prose-craft']);
    expect(result.ok).toBe(true);
    const state = await loadState();
    expect(state.modulesActive).toContain('prose-craft');
  });

  test('adds module to _modulesRead', async () => {
    await handleState(['reset']);
    await handleModule(['activate', 'prose-craft']);
    const state = await loadState();
    expect((state as any)._modulesRead).toContain('prose-craft');
  });

  test('does not duplicate in modulesActive', async () => {
    await handleState(['reset']);
    await handleState(['set', 'modulesActive', '["prose-craft"]']);
    await handleModule(['activate', 'prose-craft']);
    const state = await loadState();
    expect(state.modulesActive.filter(m => m === 'prose-craft').length).toBe(1);
  });

  test('fails for unknown module', async () => {
    await handleState(['reset']);
    const result = await handleModule(['activate', 'nonexistent-module']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('not found');
  });

  test('fails without state', async () => {
    const result = await handleModule(['activate', 'prose-craft']);
    expect(result.ok).toBe(false);
  });
});

describe('tag module activate-tier', () => {
  test('activates all tier 1 modules and returns content', async () => {
    await handleState(['reset']);
    const result = await handleModule(['activate-tier', '1']);
    expect(result.ok).toBe(true);
    const data = result.data as { tier: number; modules: { name: string; modulePath: string }[] };
    expect(data.tier).toBe(1);
    expect(data.modules.length).toBeGreaterThanOrEqual(6);
    expect(data.modules.some(m => m.name === 'prose-craft')).toBe(true);
    expect(data.modules.every(m => m.modulePath.length > 0)).toBe(true);
  });

  test('adds all tier modules to _modulesRead', async () => {
    await handleState(['reset']);
    await handleModule(['activate-tier', '1']);
    const state = await loadState();
    const read = (state as any)._modulesRead as string[];
    expect(read).toContain('prose-craft');
    expect(read).toContain('gm-checklist');
    expect(read).toContain('core-systems');
  });

  test('fails for invalid tier', async () => {
    await handleState(['reset']);
    const result = await handleModule(['activate-tier', '4']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('tier');
  });
});

describe('prose-craft epoch stamping', () => {
  test('activating prose-craft stamps _proseCraftEpoch with _compactionCount', async () => {
    await handleState(['reset']);
    await handleState(['set', '_compactionCount', '5']);
    await handleModule(['activate', 'prose-craft']);
    const state = await loadState();
    expect(state._proseCraftEpoch).toBe(5);
  });

  test('activating prose-craft stamps _proseCraftEpoch as 0 when no compaction', async () => {
    await handleState(['reset']);
    await handleModule(['activate', 'prose-craft']);
    const state = await loadState();
    expect(state._proseCraftEpoch).toBe(0);
  });

  test('activate-tier 1 stamps _proseCraftEpoch', async () => {
    await handleState(['reset']);
    await handleState(['set', '_compactionCount', '2']);
    await handleModule(['activate-tier', '1']);
    const state = await loadState();
    expect(state._proseCraftEpoch).toBe(2);
  });

  test('activating a non-prose-craft module does not stamp _proseCraftEpoch', async () => {
    await handleState(['reset']);
    await handleModule(['activate', 'core-systems']);
    const state = await loadState();
    expect(state._proseCraftEpoch).toBeUndefined();
  });
});

describe('tag module status', () => {
  test('shows which modules are active vs read', async () => {
    await handleState(['reset']);
    await handleState(['set', 'modulesActive', '["prose-craft","bestiary"]']);
    await handleModule(['activate', 'prose-craft']);
    const result = await handleModule(['status']);
    expect(result.ok).toBe(true);
    const data = result.data as { active: string[]; read: string[]; unread: string[] };
    expect(data.active).toContain('prose-craft');
    expect(data.active).toContain('bestiary');
    expect(data.read).toContain('prose-craft');
    expect(data.unread).toContain('bestiary');
  });
});
