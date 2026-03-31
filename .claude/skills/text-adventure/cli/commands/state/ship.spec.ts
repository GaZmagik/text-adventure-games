import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleState } from './index';
import { tryLoadState } from '../../lib/state-store';
import { DEFAULT_SHIP_SYSTEMS } from '../../lib/constants';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-ship-'));
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

describe('ship dispatch', () => {
  test('no action returns fail with valid actions', async () => {
    const r = await handleState(['ship']);
    expect(r.ok).toBe(false);
    expect(r.command).toBe('state ship');
  });

  test('unknown action returns fail', async () => {
    const r = await handleState(['ship', 'explode']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/explode/i);
  });
});

// ── ship init ───────────────────────────────────────────────────────

describe('ship init', () => {
  test('creates ship with 7 systems at 100% integrity', async () => {
    const r = await handleState(['ship', 'init', '--name', 'ISS Erebus']);
    expect(r.ok).toBe(true);
    expect(r.command).toBe('state ship');

    const state = await tryLoadState();
    const ship = state!.shipState!;
    expect(ship.name).toBe('ISS Erebus');
    expect(Object.keys(ship.systems).length).toBe(DEFAULT_SHIP_SYSTEMS.length);

    for (const sys of DEFAULT_SHIP_SYSTEMS) {
      expect(ship.systems[sys]).toBeDefined();
      expect(ship.systems[sys]!.integrity).toBe(100);
      expect(ship.systems[sys]!.status).toBe('operational');
      expect(ship.systems[sys]!.conditions).toEqual([]);
    }

    expect(ship.repairParts).toBe(10);
    expect(ship.scenesSinceRepair).toBe(0);
  });

  test('fails without --name', async () => {
    const r = await handleState(['ship', 'init']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/name/i);
  });

  test('fails if ship already initialised', async () => {
    await handleState(['ship', 'init', '--name', 'ISS Erebus']);
    const r = await handleState(['ship', 'init', '--name', 'ISS Redux']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/already/i);
  });
});

// ── ship damage ─────────────────────────────────────────────────────

describe('ship damage', () => {
  beforeEach(async () => {
    await handleState(['ship', 'init', '--name', 'ISS Erebus']);
  });

  test('reduces integrity and updates status', async () => {
    const r = await handleState(['ship', 'damage', 'hull', '30']);
    expect(r.ok).toBe(true);

    const state = await tryLoadState();
    const hull = state!.shipState!.systems['hull']!;
    expect(hull.integrity).toBe(70);
    expect(hull.status).toBe('degraded');
  });

  test('clamps integrity at 0', async () => {
    await handleState(['ship', 'damage', 'hull', '200']);
    const state = await tryLoadState();
    expect(state!.shipState!.systems['hull']!.integrity).toBe(0);
    expect(state!.shipState!.systems['hull']!.status).toBe('offline');
  });

  test('fails with unknown system', async () => {
    const r = await handleState(['ship', 'damage', 'warp_drive', '10']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/warp_drive/i);
  });

  test('fails with non-numeric amount', async () => {
    const r = await handleState(['ship', 'damage', 'hull', 'lots']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/numeric/i);
  });

  test('fails without ship init', async () => {
    await handleState(['reset']);
    const r = await handleState(['ship', 'damage', 'hull', '10']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/initialised/i);
  });
});

// ── ship repair ─────────────────────────────────────────────────────

describe('ship repair', () => {
  beforeEach(async () => {
    await handleState(['ship', 'init', '--name', 'ISS Erebus']);
    await handleState(['ship', 'damage', 'engines', '60']);
  });

  test('increases integrity and updates status', async () => {
    const r = await handleState(['ship', 'repair', 'engines', '30']);
    expect(r.ok).toBe(true);

    const state = await tryLoadState();
    const engines = state!.shipState!.systems['engines']!;
    expect(engines.integrity).toBe(70);
    expect(engines.status).toBe('degraded');
  });

  test('clamps integrity at 100', async () => {
    await handleState(['ship', 'repair', 'engines', '200']);
    const state = await tryLoadState();
    expect(state!.shipState!.systems['engines']!.integrity).toBe(100);
    expect(state!.shipState!.systems['engines']!.status).toBe('operational');
  });

  test('resets scenesSinceRepair to 0', async () => {
    const state = await tryLoadState();
    state!.shipState!.scenesSinceRepair = 5;
    const { saveState } = await import('../../lib/state-store');
    await saveState(state!);

    await handleState(['ship', 'repair', 'engines', '10']);
    const updated = await tryLoadState();
    expect(updated!.shipState!.scenesSinceRepair).toBe(0);
  });
});

// ── ship power ──────────────────────────────────────────────────────

describe('ship power', () => {
  beforeEach(async () => {
    await handleState(['ship', 'init', '--name', 'ISS Erebus']);
  });

  test('moves power between systems', async () => {
    const stateBefore = await tryLoadState();
    const fromBefore = stateBefore!.shipState!.powerAllocations['sensors']!;
    const toBefore = stateBefore!.shipState!.powerAllocations['weapons']!;

    const r = await handleState(['ship', 'power', 'sensors', 'weapons', '5']);
    expect(r.ok).toBe(true);

    const state = await tryLoadState();
    expect(state!.shipState!.powerAllocations['sensors']).toBe(fromBefore - 5);
    expect(state!.shipState!.powerAllocations['weapons']).toBe(toBefore + 5);
  });

  test('fails if source has insufficient power', async () => {
    const r = await handleState(['ship', 'power', 'sensors', 'weapons', '9999']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/insufficient/i);
  });

  test('fails with unknown system', async () => {
    const r = await handleState(['ship', 'power', 'sensors', 'warp_drive', '5']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/warp_drive/i);
  });

  test('fails with non-numeric units', async () => {
    const r = await handleState(['ship', 'power', 'sensors', 'weapons', 'max']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/numeric/i);
  });
});

// ── ship condition ──────────────────────────────────────────────────

describe('ship condition', () => {
  beforeEach(async () => {
    await handleState(['ship', 'init', '--name', 'ISS Erebus']);
  });

  test('adds a condition to a system', async () => {
    const r = await handleState(['ship', 'condition', 'add', 'hull', 'venting']);
    expect(r.ok).toBe(true);

    const state = await tryLoadState();
    expect(state!.shipState!.systems['hull']!.conditions).toContain('venting');
  });

  test('removes a condition from a system', async () => {
    await handleState(['ship', 'condition', 'add', 'hull', 'venting']);
    const r = await handleState(['ship', 'condition', 'remove', 'hull', 'venting']);
    expect(r.ok).toBe(true);

    const state = await tryLoadState();
    expect(state!.shipState!.systems['hull']!.conditions).not.toContain('venting');
  });

  test('add is idempotent (no duplicate)', async () => {
    await handleState(['ship', 'condition', 'add', 'hull', 'venting']);
    await handleState(['ship', 'condition', 'add', 'hull', 'venting']);

    const state = await tryLoadState();
    expect(state!.shipState!.systems['hull']!.conditions.filter(c => c === 'venting').length).toBe(1);
  });

  test('fails to remove nonexistent condition', async () => {
    const r = await handleState(['ship', 'condition', 'remove', 'hull', 'exploding']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/exploding/i);
  });

  test('fails with invalid operation', async () => {
    const r = await handleState(['ship', 'condition', 'toggle', 'hull', 'venting']);
    expect(r.ok).toBe(false);
  });
});

// ── ship parts ──────────────────────────────────────────────────────

describe('ship parts', () => {
  beforeEach(async () => {
    await handleState(['ship', 'init', '--name', 'ISS Erebus']);
  });

  test('increases repair parts', async () => {
    await handleState(['ship', 'parts', '+5']);
    const state = await tryLoadState();
    expect(state!.shipState!.repairParts).toBe(15);
  });

  test('decreases repair parts', async () => {
    await handleState(['ship', 'parts', '-3']);
    const state = await tryLoadState();
    expect(state!.shipState!.repairParts).toBe(7);
  });

  test('clamps at 0', async () => {
    await handleState(['ship', 'parts', '-999']);
    const state = await tryLoadState();
    expect(state!.shipState!.repairParts).toBe(0);
  });

  test('fails with non-numeric amount', async () => {
    const r = await handleState(['ship', 'parts', 'plenty']);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/numeric/i);
  });
});

// ── Status mapping thresholds ───────────────────────────────────────

describe('integrity-to-status mapping', () => {
  beforeEach(async () => {
    await handleState(['ship', 'init', '--name', 'ISS Erebus']);
  });

  test('100 -> operational', async () => {
    const state = await tryLoadState();
    expect(state!.shipState!.systems['hull']!.status).toBe('operational');
  });

  test('76 -> operational', async () => {
    await handleState(['ship', 'damage', 'hull', '24']);
    const state = await tryLoadState();
    expect(state!.shipState!.systems['hull']!.status).toBe('operational');
  });

  test('75 -> degraded', async () => {
    await handleState(['ship', 'damage', 'hull', '25']);
    const state = await tryLoadState();
    expect(state!.shipState!.systems['hull']!.status).toBe('degraded');
  });

  test('51 -> degraded', async () => {
    await handleState(['ship', 'damage', 'hull', '49']);
    const state = await tryLoadState();
    expect(state!.shipState!.systems['hull']!.status).toBe('degraded');
  });

  test('26 -> critical', async () => {
    await handleState(['ship', 'damage', 'hull', '74']);
    const state = await tryLoadState();
    expect(state!.shipState!.systems['hull']!.status).toBe('critical');
  });

  test('1 -> failing', async () => {
    await handleState(['ship', 'damage', 'hull', '99']);
    const state = await tryLoadState();
    expect(state!.shipState!.systems['hull']!.status).toBe('failing');
  });

  test('0 -> offline', async () => {
    await handleState(['ship', 'damage', 'hull', '100']);
    const state = await tryLoadState();
    expect(state!.shipState!.systems['hull']!.status).toBe('offline');
  });
});

// ── History tracking ────────────────────────────────────────────────

describe('ship history', () => {
  test('ship init records a state history entry', async () => {
    await handleState(['ship', 'init', '--name', 'ISS Erebus']);
    const state = await tryLoadState();
    const last = state!._stateHistory[state!._stateHistory.length - 1];
    expect(last).toBeDefined();
    expect(last!.command).toContain('ship');
  });
});
