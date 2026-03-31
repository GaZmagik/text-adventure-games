import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleState } from './index';
import { tryLoadState } from '../../lib/state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-codex-'));
  process.env.TAG_STATE_DIR = tempDir;
  await handleState(['reset']);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) {
    process.env.TAG_STATE_DIR = originalEnv;
  } else {
    delete process.env.TAG_STATE_DIR;
  }
});

// ── Dispatch ────────────────────────────────────────────────────────

describe('codex dispatch', () => {
  test('no action returns fail with valid actions', async () => {
    const r = await handleState(['codex']);
    expect(r.ok).toBe(false);
    expect(r.command).toBe('state codex');
  });

  test('unknown action returns fail', async () => {
    const r = await handleState(['codex', 'explode']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/explode/i);
  });
});

// ── codex create ────────────────────────────────────────────────────

describe('codex create', () => {
  test('creates a locked entry with title and category', async () => {
    const r = await handleState(['codex', 'create', 'loc_bridge', '--title', 'The Bridge', '--category', 'location']);
    expect(r.ok).toBe(true);
    expect(r.command).toBe('state codex');

    const state = await tryLoadState();
    const entry = state!.codexMutations.find(e => e.id === 'loc_bridge');
    expect(entry).toBeDefined();
    expect(entry!.state).toBe('locked');
    expect(entry!.title).toBe('The Bridge');
    expect(entry!.category).toBe('location');
    expect(entry!.secrets).toEqual([]);
  });

  test('fails without id', async () => {
    const r = await handleState(['codex', 'create']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/id/i);
  });

  test('fails without --title', async () => {
    const r = await handleState(['codex', 'create', 'loc_01']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/title/i);
  });

  test('fails on duplicate id', async () => {
    await handleState(['codex', 'create', 'loc_01', '--title', 'A', '--category', 'location']);
    const r = await handleState(['codex', 'create', 'loc_01', '--title', 'B', '--category', 'location']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/already exists/i);
  });

  test('category defaults to "general" when omitted', async () => {
    const r = await handleState(['codex', 'create', 'item_01', '--title', 'A Key']);
    expect(r.ok).toBe(true);
    const state = await tryLoadState();
    expect(state!.codexMutations.find(e => e.id === 'item_01')!.category).toBe('general');
  });
});

// ── codex unlock ────────────────────────────────────────────────────

describe('codex unlock', () => {
  beforeEach(async () => {
    await handleState(['codex', 'create', 'fac_01', '--title', 'The Order', '--category', 'faction']);
  });

  test('transitions locked -> partial', async () => {
    const r = await handleState(['codex', 'unlock', 'fac_01', '--method', 'told', '--source', 'Brother Aldric']);
    expect(r.ok).toBe(true);

    const state = await tryLoadState();
    const entry = state!.codexMutations.find(e => e.id === 'fac_01')!;
    expect(entry.state).toBe('partial');
    expect(entry.via).toContain('told');
    expect(entry.via).toContain('Brother Aldric');
    expect(entry.discoveredAt).toBe(state!.scene);
  });

  test('fails if entry does not exist', async () => {
    const r = await handleState(['codex', 'unlock', 'nope', '--method', 'told', '--source', 'X']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/not found/i);
  });

  test('fails if already partial', async () => {
    await handleState(['codex', 'unlock', 'fac_01', '--method', 'told', '--source', 'X']);
    const r = await handleState(['codex', 'unlock', 'fac_01', '--method', 'read', '--source', 'Y']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/locked/i);
  });

  test('fails without --method', async () => {
    const r = await handleState(['codex', 'unlock', 'fac_01']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/method/i);
  });
});

// ── codex advance ───────────────────────────────────────────────────

describe('codex advance', () => {
  beforeEach(async () => {
    await handleState(['codex', 'create', 'fac_01', '--title', 'The Order', '--category', 'faction']);
    await handleState(['codex', 'unlock', 'fac_01', '--method', 'told', '--source', 'Aldric']);
  });

  test('transitions partial -> discovered', async () => {
    const r = await handleState(['codex', 'advance', 'fac_01', '--method', 'read', '--source', "Aldric's journal"]);
    expect(r.ok).toBe(true);

    const state = await tryLoadState();
    const entry = state!.codexMutations.find(e => e.id === 'fac_01')!;
    expect(entry.state).toBe('discovered');
  });

  test('fails if entry is still locked', async () => {
    await handleState(['codex', 'create', 'loc_01', '--title', 'Hall', '--category', 'location']);
    const r = await handleState(['codex', 'advance', 'loc_01', '--method', 'read', '--source', 'X']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/partial/i);
  });

  test('fails if entry is already discovered', async () => {
    await handleState(['codex', 'advance', 'fac_01', '--method', 'read', '--source', 'X']);
    const r = await handleState(['codex', 'advance', 'fac_01', '--method', 'deduced', '--source', 'Y']);
    expect(r.ok).toBe(false);
  });

  test('fails without --method', async () => {
    const r = await handleState(['codex', 'advance', 'fac_01']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/method/i);
  });
});

// ── codex secret ────────────────────────────────────────────────────

describe('codex secret', () => {
  beforeEach(async () => {
    await handleState(['codex', 'create', 'chr_01', '--title', 'Aldric', '--category', 'character']);
  });

  test('appends a secret to the entry', async () => {
    const r = await handleState(['codex', 'secret', 'chr_01', '--text', 'He stole the robes from a corpse.']);
    expect(r.ok).toBe(true);

    const state = await tryLoadState();
    const entry = state!.codexMutations.find(e => e.id === 'chr_01')!;
    expect(entry.secrets).toContain('He stole the robes from a corpse.');
  });

  test('appends multiple secrets', async () => {
    await handleState(['codex', 'secret', 'chr_01', '--text', 'First secret']);
    await handleState(['codex', 'secret', 'chr_01', '--text', 'Second secret']);

    const state = await tryLoadState();
    const entry = state!.codexMutations.find(e => e.id === 'chr_01')!;
    expect(entry.secrets!.length).toBe(2);
  });

  test('fails if entry does not exist', async () => {
    const r = await handleState(['codex', 'secret', 'nope', '--text', 'X']);
    expect(r.ok).toBe(false);
  });

  test('fails without --text', async () => {
    const r = await handleState(['codex', 'secret', 'chr_01']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/text/i);
  });

  test('fails if entry is redacted', async () => {
    await handleState(['codex', 'redact', 'chr_01', '--reason', 'mindwipe']);
    const r = await handleState(['codex', 'secret', 'chr_01', '--text', 'Too late']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/redacted/i);
  });
});

// ── codex redact ────────────────────────────────────────────────────

describe('codex redact', () => {
  beforeEach(async () => {
    await handleState(['codex', 'create', 'evt_01', '--title', 'The War', '--category', 'event']);
  });

  test('sets state to redacted', async () => {
    const r = await handleState(['codex', 'redact', 'evt_01', '--reason', 'mindwipe trap']);
    expect(r.ok).toBe(true);

    const state = await tryLoadState();
    const entry = state!.codexMutations.find(e => e.id === 'evt_01')!;
    expect(entry.state).toBe('redacted');
  });

  test('fails if entry does not exist', async () => {
    const r = await handleState(['codex', 'redact', 'nope', '--reason', 'X']);
    expect(r.ok).toBe(false);
  });

  test('fails if already redacted', async () => {
    await handleState(['codex', 'redact', 'evt_01', '--reason', 'first']);
    const r = await handleState(['codex', 'redact', 'evt_01', '--reason', 'second']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/already redacted/i);
  });

  test('fails without --reason', async () => {
    const r = await handleState(['codex', 'redact', 'evt_01']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/reason/i);
  });

  test('redact works from any non-redacted state', async () => {
    await handleState(['codex', 'unlock', 'evt_01', '--method', 'told', '--source', 'X']);
    const r = await handleState(['codex', 'redact', 'evt_01', '--reason', 'memory loss']);
    expect(r.ok).toBe(true);

    const state = await tryLoadState();
    expect(state!.codexMutations.find(e => e.id === 'evt_01')!.state).toBe('redacted');
  });
});

// ── History tracking ────────────────────────────────────────────────

describe('codex history', () => {
  test('codex create records a state history entry', async () => {
    await handleState(['codex', 'create', 'loc_01', '--title', 'Hall', '--category', 'location']);
    const state = await tryLoadState();
    const last = state!._stateHistory[state!._stateHistory.length - 1];
    expect(last).toBeDefined();
    expect(last!.command).toContain('codex');
  });
});
