import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleSave } from './save';
import { saveState, createDefaultState, loadState } from '../lib/state-store';
import { validateAndDecode } from '../lib/fnv32';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-save-'));
  process.env.TAG_STATE_DIR = tempDir;
  const state = createDefaultState();
  state.scene = 7;
  state.factions = { rebels: 42 };
  state.character = {
    name: 'Test Hero', class: 'Scout', hp: 18, maxHp: 20, ac: 13,
    level: 3, xp: 500, currency: 200, currencyName: 'credits',
    stats: { STR: 10, DEX: 16, CON: 10, INT: 10, WIS: 14, CHA: 12 },
    modifiers: { STR: 0, DEX: 3, CON: 0, INT: 0, WIS: 2, CHA: 1 },
    proficiencyBonus: 2, proficiencies: ['Stealth'],
    abilities: [], inventory: [], conditions: [],
    equipment: { weapon: 'Blaster', armour: 'Vest' },
  };
  await saveState(state);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  if (originalEnv !== undefined) process.env.TAG_STATE_DIR = originalEnv;
  else delete process.env.TAG_STATE_DIR;
});

describe('save generate', () => {
  test('produces a valid checksummed save string', async () => {
    const result = await handleSave(['generate']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const saveString = data.saveString as string;
    expect(saveString).toMatch(/^[0-9a-f]{8}\./);
    const decoded = validateAndDecode(saveString);
    expect(decoded.valid).toBe(true);
  });

  test('uses SF2: header (uncompressed)', async () => {
    const result = await handleSave(['generate']);
    const data = result.data as Record<string, unknown>;
    const saveString = data.saveString as string;
    expect(saveString).toContain('SF2:');
  });

  test('encoded payload contains game state data', async () => {
    const result = await handleSave(['generate']);
    const data = result.data as Record<string, unknown>;
    const decoded = validateAndDecode(data.saveString as string);
    if (!decoded.valid) throw new Error('Expected valid decode');
    expect(decoded.payload.scene).toBe(7);
    expect(decoded.payload.factions).toEqual({ rebels: 42 });
  });

  test('fails without state file', async () => {
    rmSync(tempDir, { recursive: true, force: true });
    const result = await handleSave(['generate']);
    expect(result.ok).toBe(false);
    expect(result.error!.corrective).toContain('tag state reset');
  });
});

describe('save load', () => {
  test('round-trips: generate then load restores state', async () => {
    const genResult = await handleSave(['generate']);
    const saveString = (genResult.data as Record<string, unknown>).saveString as string;

    // Reset state to defaults
    const freshState = createDefaultState();
    freshState.scene = 0;
    await saveState(freshState);

    // Load from save string
    const loadResult = await handleSave(['load', saveString]);
    expect(loadResult.ok).toBe(true);

    const restored = await loadState();
    expect(restored.scene).toBe(7);
    expect(restored.factions).toEqual({ rebels: 42 });
    expect(restored.character!.name).toBe('Test Hero');
  });

  test('fails on corrupted save string', async () => {
    const result = await handleSave(['load', '00000000.SC1:garbage']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toMatch(/CHECKSUM|DECODE/);
  });

  test('loads save from a .save.md file path', async () => {
    // Generate a valid save string from the current state
    const genResult = await handleSave(['generate']);
    expect(genResult.ok).toBe(true);
    const saveString = (genResult.data as Record<string, unknown>).saveString as string;

    // Write a .save.md file with the save string inside a markdown code fence
    const saveFilePath = join(tempDir, 'game.save.md');
    writeFileSync(saveFilePath, `# Save File\n\n\`\`\`\n${saveString}\n\`\`\`\n`);

    // Reset state to defaults so we can verify the restore
    const freshState = createDefaultState();
    freshState.scene = 0;
    await saveState(freshState);

    // Load from the .save.md file path
    const loadResult = await handleSave(['load', saveFilePath]);
    expect(loadResult.ok).toBe(true);

    // Verify the state was restored from the file
    const restored = await loadState();
    expect(restored.scene).toBe(7);
    expect(restored.factions).toEqual({ rebels: 42 });
    expect(restored.character!.name).toBe('Test Hero');
  });

  test('fails without save string argument', async () => {
    const result = await handleSave(['load']);
    expect(result.ok).toBe(false);
  });
});

describe('save validate', () => {
  test('valid save string passes', async () => {
    const genResult = await handleSave(['generate']);
    const saveString = (genResult.data as Record<string, unknown>).saveString as string;
    const result = await handleSave(['validate', saveString]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.valid).toBe(true);
  });

  test('corrupt save string fails', async () => {
    const result = await handleSave(['validate', 'bad.data']);
    expect(result.ok).toBe(true); // Command succeeded, but validation result says invalid
    const data = result.data as Record<string, unknown>;
    expect(data.valid).toBe(false);
  });
});

describe('save migrate', () => {
  test('returns stub error — migration not yet required', async () => {
    const result = await handleSave(['migrate', 'something']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('not yet required');
    expect(result.command).toBe('save migrate');
  });
});

describe('save validate — detailed checks', () => {
  test('returns valid: true with scene and character name for a good save', async () => {
    const genResult = await handleSave(['generate']);
    const saveString = (genResult.data as Record<string, unknown>).saveString as string;
    const result = await handleSave(['validate', saveString]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.valid).toBe(true);
    expect(data.mode).toBe('full');
    expect(data.scene).toBe(7);
    expect(data.characterName).toBe('Test Hero');
    expect(data.error).toBeNull();
  });

  test('returns valid: false with error description for corrupt save', async () => {
    const result = await handleSave(['validate', 'deadbeef.SF2:not-base64!!!']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.valid).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.scene).toBeNull();
    expect(data.characterName).toBeNull();
  });

  test('validates a .save.md file path', async () => {
    const genResult = await handleSave(['generate']);
    expect(genResult.ok).toBe(true);
    const saveString = (genResult.data as Record<string, unknown>).saveString as string;

    const saveFilePath = join(tempDir, 'validate-test.save.md');
    writeFileSync(saveFilePath, `# Save\n\n\`\`\`\n${saveString}\n\`\`\`\n`);

    const result = await handleSave(['validate', saveFilePath]);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.valid).toBe(true);
  });

  test('fails without save string argument', async () => {
    const result = await handleSave(['validate']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('Usage');
  });
});

describe('save with no subcommand', () => {
  test('returns error', async () => {
    const result = await handleSave([]);
    expect(result.ok).toBe(false);
  });
});
