import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleExport } from './export';
import { saveState, createDefaultState, loadState } from '../lib/state-store';
import { attachChecksum } from '../lib/fnv32';
import { extractLorePayload, extractFrontmatterField, encodeLorePayload, extractMechanicalData } from '../lib/lore-serialiser';
import type { NpcMutation, Pronouns, BestiaryTier } from '../types';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

function makeNpc(overrides: Partial<NpcMutation> = {}): NpcMutation {
  return {
    id: 'npc-kira', name: 'Kira Voss', pronouns: 'she/her' as Pronouns,
    role: 'Smuggler', tier: 'rival' as BestiaryTier, level: 3,
    stats: { STR: 10, DEX: 16, CON: 12, INT: 14, WIS: 10, CHA: 13 },
    modifiers: { STR: 0, DEX: 3, CON: 1, INT: 2, WIS: 0, CHA: 1 },
    hp: 22, maxHp: 22, ac: 14, soak: 1, damageDice: '1d8+3',
    status: 'active', alive: true, trust: 30, disposition: 'friendly',
    dispositionSeed: 42, ...overrides,
  };
}

beforeEach(async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-export-'));
  process.env.TAG_STATE_DIR = tempDir;
  const state = createDefaultState();
  state.scene = 8;
  state.seed = 'export-seed-01';
  state.theme = 'sci-fi';
  state.modulesActive = ['core-systems', 'bestiary'];
  state.factions = { 'Rebellion': 40, 'Empire': -70 };
  state.rosterMutations = [makeNpc()];
  state.quests = [{
    id: 'q1', title: 'Escape the Station', status: 'active',
    objectives: [{ id: 'o1', description: 'Find the hangar', completed: false }],
    clues: ['A keycard'],
  }];
  state.character = {
    name: 'Zara', class: 'Pilot', hp: 15, maxHp: 18, ac: 12,
    level: 3, xp: 900, currency: 50, currencyName: 'credits',
    stats: { STR: 10, DEX: 14, CON: 12, INT: 13, WIS: 10, CHA: 11 },
    modifiers: { STR: 0, DEX: 2, CON: 1, INT: 1, WIS: 0, CHA: 0 },
    proficiencyBonus: 2, proficiencies: ['Piloting'],
    abilities: [], inventory: [], conditions: [],
    equipment: { weapon: 'Blaster Pistol', armour: 'Flight Suit' },
  };
  await saveState(state);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) process.env.TAG_STATE_DIR = originalEnv;
  else delete process.env.TAG_STATE_DIR;
});

// ── generate ─────────────────────────────────────────────────────────

describe('export generate', () => {
  test('produces ok result with loreContent', async () => {
    const result = await handleExport(['generate']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(typeof data.loreContent).toBe('string');
    expect((data.loreContent as string).length).toBeGreaterThan(0);
  });

  test('loreContent contains YAML frontmatter', async () => {
    const result = await handleExport(['generate']);
    const data = result.data as Record<string, unknown>;
    const content = data.loreContent as string;
    expect(content.startsWith('---\n')).toBe(true);
    expect(extractFrontmatterField(content, 'format')).toBe('text-adventure-lore');
    expect(extractFrontmatterField(content, 'rulebook')).toBe('d20_system');
  });

  test('loreContent contains checksummed LORE payload comment', async () => {
    const result = await handleExport(['generate']);
    const data = result.data as Record<string, unknown>;
    const content = data.loreContent as string;
    const payload = extractLorePayload(content);
    expect(payload).not.toBeNull();
    expect(payload!).toMatch(/^[0-9a-f]{8}\.LF1:/);
  });

  test('data includes title, counts, characterName, scene', async () => {
    const result = await handleExport(['generate']);
    const data = result.data as Record<string, unknown>;
    expect(typeof data.title).toBe('string');
    expect(data.npcCount).toBe(1);
    expect(data.factionCount).toBe(2);
    expect(data.questCount).toBe(1);
    expect(data.characterName).toBe('Zara');
    expect(data.scene).toBe(8);
  });

  test('fails without state file', async () => {
    rmSync(tempDir, { recursive: true, force: true });
    const result = await handleExport(['generate']);
    expect(result.ok).toBe(false);
    expect(result.error!.corrective).toContain('tag state reset');
  });

  test('command field is export generate', async () => {
    const result = await handleExport(['generate']);
    expect(result.command).toBe('export generate');
  });
});

// ── load ─────────────────────────────────────────────────────────────

describe('export load', () => {
  test('round-trips: generate then load restores mechanical state', async () => {
    const genResult = await handleExport(['generate']);
    expect(genResult.ok).toBe(true);
    const content = (genResult.data as Record<string, unknown>).loreContent as string;

    // Write to .lore.md file
    const lorePath = join(tempDir, 'adventure.lore.md');
    writeFileSync(lorePath, content, 'utf-8');

    // Reset state
    const fresh = createDefaultState();
    await saveState(fresh);

    // Load from file
    const loadResult = await handleExport(['load', lorePath]);
    expect(loadResult.ok).toBe(true);

    const restored = await loadState();
    // Session fields should be reset
    expect(restored.scene).toBe(0);
    expect(restored.visitedRooms).toEqual([]);
    expect(restored.rollHistory).toEqual([]);
    expect(restored.character).toBeNull();
    expect(restored._stateHistory).toEqual([]);

    // Mechanical data should be present
    expect(restored.factions).toEqual({ 'Rebellion': 40, 'Empire': -70 });
    expect(restored.rosterMutations).toHaveLength(1);
    expect(restored.rosterMutations[0]!.name).toBe('Kira Voss');
    expect(restored.quests).toHaveLength(1);
    expect(restored.worldFlags.rulebook).toBe('d20_system');
  });

  test('restores rulebook from system frontmatter alias when payload omits it', async () => {
    const payload = attachChecksum(encodeLorePayload(extractMechanicalData(createDefaultState())));
    const lorePath = join(tempDir, 'system-alias.lore.md');
    writeFileSync(lorePath, [
      '---',
      'format: text-adventure-lore',
      'version: 1',
      'edited: false',
      'system: d20_system',
      '---',
      '',
      `<!-- LORE:${payload} -->`,
      '',
    ].join('\n'), 'utf-8');

    const result = await handleExport(['load', lorePath]);
    expect(result.ok).toBe(true);

    const restored = await loadState();
    expect(restored.worldFlags.rulebook).toBe('d20_system');

    const warnings = ((result.data as Record<string, unknown>).warnings ?? []) as string[];
    expect(warnings.some(w => w.includes('worldFlags.rulebook'))).toBe(true);
  });

  test('fails without file path argument', async () => {
    const result = await handleExport(['load']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Usage');
  });

  test('fails when the input does not look like a file path', async () => {
    const result = await handleExport(['load', 'not-a-path']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('readable file path');
  });

  test('fails for file outside home/tmp directory', async () => {
    const result = await handleExport(['load', '/etc/passwd']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('home, temp, or /mnt/ directory');
  });

  test('fails when file has no LORE payload', async () => {
    const noPayloadPath = join(tempDir, 'empty.lore.md');
    writeFileSync(noPayloadPath, '# Just a document\n\nNo payload here.\n', 'utf-8');
    const result = await handleExport(['load', noPayloadPath]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('payload');
  });

  test('includes edited flag from frontmatter', async () => {
    const genResult = await handleExport(['generate']);
    const content = (genResult.data as Record<string, unknown>).loreContent as string;
    const lorePath = join(tempDir, 'edited-test.lore.md');
    // Overwrite edited: false to edited: true in frontmatter
    const edited = content.replace('edited: false', 'edited: true');
    writeFileSync(lorePath, edited, 'utf-8');

    // Need to re-generate payload with the edited content? No — payload is from original.
    // The edited flag comes from frontmatter, not the payload.
    const loadResult = await handleExport(['load', lorePath]);
    expect(loadResult.ok).toBe(true);
    const data = loadResult.data as Record<string, unknown>;
    expect(data.edited).toBe(true);
  });

  test('load response includes npcCount and factionCount', async () => {
    const genResult = await handleExport(['generate']);
    const content = (genResult.data as Record<string, unknown>).loreContent as string;
    const lorePath = join(tempDir, 'counts.lore.md');
    writeFileSync(lorePath, content, 'utf-8');

    const fresh = createDefaultState();
    await saveState(fresh);

    const loadResult = await handleExport(['load', lorePath]);
    expect(loadResult.ok).toBe(true);
    const data = loadResult.data as Record<string, unknown>;
    expect(data.npcCount).toBe(1);
    expect(data.factionCount).toBe(2);
  });

  test('rejects oversized file', async () => {
    const bigPath = join(tempDir, 'big.lore.md');
    writeFileSync(bigPath, Buffer.alloc(11 * 1024 * 1024));
    const result = await handleExport(['load', bigPath]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('size');
  });

  test('command field is export load', async () => {
    const genResult = await handleExport(['generate']);
    const content = (genResult.data as Record<string, unknown>).loreContent as string;
    const lorePath = join(tempDir, 'cmd-test.lore.md');
    writeFileSync(lorePath, content, 'utf-8');
    const fresh = createDefaultState();
    await saveState(fresh);
    const loadResult = await handleExport(['load', lorePath]);
    expect(loadResult.command).toBe('export load');
  });

  test('strips unknown nested keys on import and reports warnings', async () => {
    const polluted = await loadState();
    (polluted.time as Record<string, unknown>).season = 'winter';
    (polluted.rosterMutations[0] as Record<string, unknown>).alias = 'Ghost';
    await saveState(polluted);

    const genResult = await handleExport(['generate']);
    const content = (genResult.data as Record<string, unknown>).loreContent as string;
    const lorePath = join(tempDir, 'polluted.lore.md');
    writeFileSync(lorePath, content, 'utf-8');

    const fresh = createDefaultState();
    await saveState(fresh);

    const loadResult = await handleExport(['load', lorePath]);
    expect(loadResult.ok).toBe(true);
    const warnings = ((loadResult.data as Record<string, unknown>).warnings ?? []) as string[];
    expect(warnings.some(w => w.includes('time.season'))).toBe(true);
    expect(warnings.some(w => w.includes('rosterMutations.0.alias'))).toBe(true);

    const restored = await loadState();
    expect('season' in (restored.time as Record<string, unknown>)).toBe(false);
    expect('alias' in (restored.rosterMutations[0] as Record<string, unknown>)).toBe(false);
  });

  test('fails when the embedded lore payload checksum is invalid', async () => {
    const lorePath = join(tempDir, 'invalid-payload.lore.md');
    const badPayload = `00000000.LF1:${btoa(JSON.stringify({ _version: 1 }))}`;
    writeFileSync(lorePath, `---\nedited: false\n---\n\n<!-- LORE:${badPayload} -->\n`, 'utf-8');

    const result = await handleExport(['load', lorePath]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Lore payload validation failed');
  });

  test('fails when decoded lore state is structurally invalid', async () => {
    const lorePath = join(tempDir, 'invalid-state.lore.md');
    const payload = attachChecksum(`LF1:${btoa(JSON.stringify({ _version: 'broken' }))}`);
    writeFileSync(lorePath, `---\nedited: false\n---\n\n<!-- LORE:${payload} -->\n`, 'utf-8');

    const result = await handleExport(['load', lorePath]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Lore state is structurally invalid');
  });
});

// ── validate ─────────────────────────────────────────────────────────

describe('export validate', () => {
  test('valid lore file passes validation', async () => {
    const genResult = await handleExport(['generate']);
    const content = (genResult.data as Record<string, unknown>).loreContent as string;
    const lorePath = join(tempDir, 'valid.lore.md');
    writeFileSync(lorePath, content, 'utf-8');

    const result = await handleExport(['validate', lorePath]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.valid).toBe(true);
    expect(data.npcCount).toBe(1);
    expect(data.factionCount).toBe(2);
  });

  test('validate does not persist state', async () => {
    const genResult = await handleExport(['generate']);
    const content = (genResult.data as Record<string, unknown>).loreContent as string;
    const lorePath = join(tempDir, 'nopersist.lore.md');
    writeFileSync(lorePath, content, 'utf-8');

    // Reset to fresh state
    const fresh = createDefaultState();
    await saveState(fresh);

    await handleExport(['validate', lorePath]);

    // State should still be the fresh default
    const current = await loadState();
    expect(current.rosterMutations).toEqual([]);
    expect(current.factions).toEqual({});
  });

  test('reports invalid for file without payload', async () => {
    const noPayloadPath = join(tempDir, 'nope.lore.md');
    writeFileSync(noPayloadPath, '# Nothing\n', 'utf-8');
    const result = await handleExport(['validate', noPayloadPath]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.valid).toBe(false);
  });

  test('fails without file path argument', async () => {
    const result = await handleExport(['validate']);
    expect(result.ok).toBe(false);
  });

  test('fails when validate input does not look like a file path', async () => {
    const result = await handleExport(['validate', 'not-a-path']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('readable file path');
  });

  test('includes edited flag', async () => {
    const genResult = await handleExport(['generate']);
    const content = (genResult.data as Record<string, unknown>).loreContent as string;
    const lorePath = join(tempDir, 'edited-val.lore.md');
    writeFileSync(lorePath, content, 'utf-8');

    const result = await handleExport(['validate', lorePath]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.edited).toBe(false);
  });

  test('command field is export validate', async () => {
    const genResult = await handleExport(['generate']);
    const content = (genResult.data as Record<string, unknown>).loreContent as string;
    const lorePath = join(tempDir, 'cmd-val.lore.md');
    writeFileSync(lorePath, content, 'utf-8');
    const result = await handleExport(['validate', lorePath]);
    expect(result.command).toBe('export validate');
  });

  test('reports invalid when lore payload decode fails', async () => {
    const lorePath = join(tempDir, 'validate-invalid-payload.lore.md');
    writeFileSync(lorePath, `<!-- LORE:00000000.LF1:${btoa(JSON.stringify({ _version: 1 }))} -->`, 'utf-8');

    const result = await handleExport(['validate', lorePath]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.valid).toBe(false);
    expect((data.errors as string[])[0]).toContain('Lore payload validation failed');
  });

  test('reports invalid when lore state is structurally invalid', async () => {
    const lorePath = join(tempDir, 'validate-invalid-state.lore.md');
    const payload = attachChecksum(`LF1:${btoa(JSON.stringify({ _version: 'broken' }))}`);
    writeFileSync(lorePath, `<!-- LORE:${payload} -->`, 'utf-8');

    const result = await handleExport(['validate', lorePath]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.valid).toBe(false);
    expect((data.errors as string[])[0]).toContain('Lore state is structurally invalid');
  });
});

// ── dispatch ─────────────────────────────────────────────────────────

describe('export dispatch', () => {
  test('unknown subcommand returns error', async () => {
    const result = await handleExport(['unknown']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Unknown');
  });

  test('no subcommand returns error', async () => {
    const result = await handleExport([]);
    expect(result.ok).toBe(false);
  });
});

// ── path security ────────────────────────────────────────────────────

describe('export path security', () => {
  test('load rejects path outside home/tmp', async () => {
    const result = await handleExport(['load', '/etc/shadow']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('home, temp, or /mnt/ directory');
  });

  test('validate rejects path outside home/tmp', async () => {
    const result = await handleExport(['validate', '/etc/shadow']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('home, temp, or /mnt/ directory');
  });
});
