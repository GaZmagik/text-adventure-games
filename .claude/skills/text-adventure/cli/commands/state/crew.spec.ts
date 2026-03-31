import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleState } from './index';
import { tryLoadState } from '../../lib/state-store';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-crew-'));
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

describe('crew dispatch', () => {
  test('no action returns fail with valid actions', async () => {
    const r = await handleState(['crew']);
    expect(r.ok).toBe(false);
    expect(r.command).toBe('state crew');
  });

  test('unknown action returns fail', async () => {
    const r = await handleState(['crew', 'mutiny']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/mutiny/i);
  });
});

// ── crew add ────────────────────────────────────────────────────────

describe('crew add', () => {
  test('creates a crew member with defaults', async () => {
    const r = await handleState(['crew', 'add', 'eng_01', '--name', 'Kira Voss', '--pronouns', 'she/her', '--role', 'engineer']);
    expect(r.ok).toBe(true);
    expect(r.command).toBe('state crew');

    const state = await tryLoadState();
    const member = state!.crewMutations!.find(c => c.id === 'eng_01');
    expect(member).toBeDefined();
    expect(member!.name).toBe('Kira Voss');
    expect(member!.pronouns).toBe('she/her');
    expect(member!.role).toBe('engineer');
    expect(member!.morale).toBe(70);
    expect(member!.stress).toBe(20);
    expect(member!.loyalty).toBe(50);
    expect(member!.status).toBe('active');
  });

  test('initialises crewMutations from undefined', async () => {
    const state = await tryLoadState();
    expect(state!.crewMutations).toBeUndefined();

    await handleState(['crew', 'add', 'nav_01', '--name', 'Jax', '--pronouns', 'he/him', '--role', 'navigator']);

    const updated = await tryLoadState();
    expect(Array.isArray(updated!.crewMutations)).toBe(true);
    expect(updated!.crewMutations!.length).toBe(1);
  });

  test('fails without id', async () => {
    const r = await handleState(['crew', 'add']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/id/i);
  });

  test('fails without --name', async () => {
    const r = await handleState(['crew', 'add', 'x', '--pronouns', 'he/him', '--role', 'cook']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/name/i);
  });

  test('fails without --pronouns', async () => {
    const r = await handleState(['crew', 'add', 'x', '--name', 'Y', '--role', 'cook']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/pronouns/i);
  });

  test('fails with invalid pronouns', async () => {
    const r = await handleState(['crew', 'add', 'x', '--name', 'Y', '--pronouns', 'ze/zir', '--role', 'cook']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/pronouns/i);
  });

  test('fails without --role', async () => {
    const r = await handleState(['crew', 'add', 'x', '--name', 'Y', '--pronouns', 'he/him']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/role/i);
  });

  test('fails on duplicate id', async () => {
    await handleState(['crew', 'add', 'eng_01', '--name', 'Kira', '--pronouns', 'she/her', '--role', 'engineer']);
    const r = await handleState(['crew', 'add', 'eng_01', '--name', 'Other', '--pronouns', 'he/him', '--role', 'medic']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/already exists/i);
  });
});

// ── crew morale ─────────────────────────────────────────────────────

describe('crew morale', () => {
  beforeEach(async () => {
    await handleState(['crew', 'add', 'eng_01', '--name', 'Kira', '--pronouns', 'she/her', '--role', 'engineer']);
  });

  test('increases morale', async () => {
    const r = await handleState(['crew', 'morale', 'eng_01', '+10']);
    expect(r.ok).toBe(true);

    const state = await tryLoadState();
    expect(state!.crewMutations!.find(c => c.id === 'eng_01')!.morale).toBe(80);
  });

  test('decreases morale', async () => {
    const r = await handleState(['crew', 'morale', 'eng_01', '-20']);
    expect(r.ok).toBe(true);

    const state = await tryLoadState();
    expect(state!.crewMutations!.find(c => c.id === 'eng_01')!.morale).toBe(50);
  });

  test('clamps morale at 0', async () => {
    await handleState(['crew', 'morale', 'eng_01', '-200']);
    const state = await tryLoadState();
    expect(state!.crewMutations!.find(c => c.id === 'eng_01')!.morale).toBe(0);
  });

  test('clamps morale at 100', async () => {
    await handleState(['crew', 'morale', 'eng_01', '+200']);
    const state = await tryLoadState();
    expect(state!.crewMutations!.find(c => c.id === 'eng_01')!.morale).toBe(100);
  });

  test('fails if member not found', async () => {
    const r = await handleState(['crew', 'morale', 'nope', '+5']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/not found/i);
  });

  test('fails with non-numeric amount', async () => {
    const r = await handleState(['crew', 'morale', 'eng_01', 'abc']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/numeric/i);
  });
});

// ── crew stress ─────────────────────────────────────────────────────

describe('crew stress', () => {
  beforeEach(async () => {
    await handleState(['crew', 'add', 'eng_01', '--name', 'Kira', '--pronouns', 'she/her', '--role', 'engineer']);
  });

  test('increases stress', async () => {
    await handleState(['crew', 'stress', 'eng_01', '+15']);
    const state = await tryLoadState();
    expect(state!.crewMutations!.find(c => c.id === 'eng_01')!.stress).toBe(35);
  });

  test('clamps stress at 0', async () => {
    await handleState(['crew', 'stress', 'eng_01', '-100']);
    const state = await tryLoadState();
    expect(state!.crewMutations!.find(c => c.id === 'eng_01')!.stress).toBe(0);
  });

  test('clamps stress at 100', async () => {
    await handleState(['crew', 'stress', 'eng_01', '+200']);
    const state = await tryLoadState();
    expect(state!.crewMutations!.find(c => c.id === 'eng_01')!.stress).toBe(100);
  });
});

// ── crew loyalty ────────────────────────────────────────────────────

describe('crew loyalty', () => {
  beforeEach(async () => {
    await handleState(['crew', 'add', 'eng_01', '--name', 'Kira', '--pronouns', 'she/her', '--role', 'engineer']);
  });

  test('increases loyalty', async () => {
    await handleState(['crew', 'loyalty', 'eng_01', '+20']);
    const state = await tryLoadState();
    expect(state!.crewMutations!.find(c => c.id === 'eng_01')!.loyalty).toBe(70);
  });

  test('clamps loyalty at 0 and 100', async () => {
    await handleState(['crew', 'loyalty', 'eng_01', '-200']);
    let state = await tryLoadState();
    expect(state!.crewMutations!.find(c => c.id === 'eng_01')!.loyalty).toBe(0);

    await handleState(['crew', 'loyalty', 'eng_01', '+999']);
    state = await tryLoadState();
    expect(state!.crewMutations!.find(c => c.id === 'eng_01')!.loyalty).toBe(100);
  });
});

// ── crew status ─────────────────────────────────────────────────────

describe('crew status', () => {
  beforeEach(async () => {
    await handleState(['crew', 'add', 'eng_01', '--name', 'Kira', '--pronouns', 'she/her', '--role', 'engineer']);
  });

  test('changes status to a valid value', async () => {
    const r = await handleState(['crew', 'status', 'eng_01', 'injured']);
    expect(r.ok).toBe(true);

    const state = await tryLoadState();
    expect(state!.crewMutations!.find(c => c.id === 'eng_01')!.status).toBe('injured');
  });

  test('fails with invalid status', async () => {
    const r = await handleState(['crew', 'status', 'eng_01', 'vibing']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/vibing/i);
  });

  test('fails if member not found', async () => {
    const r = await handleState(['crew', 'status', 'nope', 'dead']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/not found/i);
  });
});

// ── crew assign ─────────────────────────────────────────────────────

describe('crew assign', () => {
  beforeEach(async () => {
    await handleState(['crew', 'add', 'eng_01', '--name', 'Kira', '--pronouns', 'she/her', '--role', 'engineer']);
  });

  test('assigns a task', async () => {
    const r = await handleState(['crew', 'assign', 'eng_01', 'repair hull']);
    expect(r.ok).toBe(true);

    const state = await tryLoadState();
    expect(state!.crewMutations!.find(c => c.id === 'eng_01')!.task).toBe('repair hull');
  });

  test('clears task with "none"', async () => {
    await handleState(['crew', 'assign', 'eng_01', 'repair hull']);
    await handleState(['crew', 'assign', 'eng_01', 'none']);

    const state = await tryLoadState();
    expect(state!.crewMutations!.find(c => c.id === 'eng_01')!.task).toBeUndefined();
  });

  test('fails if member not found', async () => {
    const r = await handleState(['crew', 'assign', 'nope', 'something']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/not found/i);
  });
});

// ── History tracking ────────────────────────────────────────────────

describe('crew history', () => {
  test('crew add records a state history entry', async () => {
    await handleState(['crew', 'add', 'nav_01', '--name', 'Jax', '--pronouns', 'he/him', '--role', 'nav']);
    const state = await tryLoadState();
    const last = state!._stateHistory[state!._stateHistory.length - 1];
    expect(last).toBeDefined();
    expect(last!.command).toContain('crew');
  });
});
