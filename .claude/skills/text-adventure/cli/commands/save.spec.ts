import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleSave } from './save';
import { saveState, createDefaultState, loadState } from '../lib/state-store';
import { validateAndDecode, attachChecksum } from '../lib/fnv32';

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

describe('save path-traversal guards', () => {
  test('load rejects a file path outside home/tmp directory', async () => {
    const result = await handleSave(['load', '/etc/passwd']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('home or temp directory');
  });

  test('validate rejects a file path outside home/tmp directory', async () => {
    const result = await handleSave(['validate', '/etc/passwd']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('home or temp directory');
  });
});

describe('save with no subcommand', () => {
  test('returns error', async () => {
    const result = await handleSave([]);
    expect(result.ok).toBe(false);
  });
});

// ── T1-2: Validation rejection — missing required fields ────────────

describe('save load — validation rejection', () => {
  /** Build a checksummed SF2 save string from an arbitrary payload object. */
  function makeSave(payload: Record<string, unknown>): string {
    const code = 'SF2:' + btoa(JSON.stringify(payload));
    return attachChecksum(code);
  }

  test('rejects a save with an invalid character (missing required fields)', async () => {
    // Character present but lacks level, stats, hp, maxHp — validator should reject
    const saveString = makeSave({
      _version: 1,
      scene: 1,
      character: { name: 'Bad Guy' },
    });
    const result = await handleSave(['load', saveString]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('invalid state');
  });

  // ── T2-TS6: character is a truthy non-object (number) ─────────────

  test('does not crash when character is a number instead of object', async () => {
    const saveString = makeSave({
      _version: 1,
      scene: 1,
      character: 42,
    });
    const result = await handleSave(['load', saveString]);
    // Should fail validation gracefully, not throw
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('invalid state');
  });
});

// ── T1-3: Root homedir guard ────────────────────────────────────────

describe('save load — root homedir guard', () => {
  test('fails when os.homedir() returns root /', async () => {
    // Bun's os.homedir() reads getpwuid and ignores $HOME, so we cannot mock it
    // in-process without poisoning sibling tests. Instead, spawn a subprocess that
    // patches os.homedir via require() before any module captures the binding.
    const genResult = await handleSave(['generate']);
    expect(genResult.ok).toBe(true);
    const saveString = (genResult.data as Record<string, unknown>).saveString as string;
    const saveFilePath = join(tempDir, 'root-test.save');
    writeFileSync(saveFilePath, saveString);

    const script = [
      `const os = require('node:os');`,
      `os.homedir = () => '/';`,
      `process.env.TAG_STATE_DIR = ${JSON.stringify(tempDir)};`,
      `const { handleSave } = require('./save');`,
      `handleSave(['load', ${JSON.stringify(saveFilePath)}]).then(r => {`,
      `  process.stdout.write(JSON.stringify(r));`,
      `});`,
    ].join('\n');

    const proc = Bun.spawn(['bun', '-e', script], {
      cwd: import.meta.dir,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const stdout = await new Response(proc.stdout).text();
    await proc.exited;

    const result = JSON.parse(stdout.trim());
    expect(result.ok).toBe(false);
    expect(result.error.message).toContain('non-root home directory');
  });
});

// ── T1-4: Nested prototype pollution filtering ──────────────────────

describe('save load — prototype pollution filtering', () => {
  test('filters out nested __proto__ keys from character', async () => {
    // JSON.stringify strips __proto__ from object literals (it becomes the prototype,
    // not an own property). Build the JSON string manually so __proto__ appears literally.
    // When JSON.parse decodes this, __proto__ becomes an own enumerable property.
    const characterJson =
      '{"name":"Hacker","class":"Scout","hp":10,"maxHp":10,"ac":10,' +
      '"level":1,"xp":0,"currency":0,"currencyName":"credits",' +
      '"stats":{"STR":10,"DEX":10,"CON":10,"INT":10,"WIS":10,"CHA":10},' +
      '"modifiers":{"STR":0,"DEX":0,"CON":0,"INT":0,"WIS":0,"CHA":0},' +
      '"proficiencyBonus":2,"proficiencies":[],' +
      '"abilities":[],"inventory":[],"conditions":[],' +
      '"equipment":{"weapon":"Blaster","armour":"Vest"},' +
      '"__proto__":{"polluted":true}}';
    const payloadJson =
      '{"_version":1,"scene":1,"currentRoom":"bridge","visitedRooms":[],' +
      '"rollHistory":[],"character":' + characterJson + ',' +
      '"worldFlags":{},"modulesActive":[],"rosterMutations":[],' +
      '"codexMutations":[],' +
      '"time":{"period":"morning","date":"Day 1","elapsed":0,"hour":8,' +
      '"playerKnowsDate":false,"playerKnowsTime":false,' +
      '"calendarSystem":"elapsed-only","deadline":null},' +
      '"factions":{},"quests":[],"_stateHistory":[]}';
    const encoded = btoa(payloadJson);
    const code = 'SF2:' + encoded;
    const saveString = attachChecksum(code);

    const result = await handleSave(['load', saveString]);
    // The character key should be stripped because it contains a forbidden key.
    // This means the loaded state gets character: null from defaults, and
    // validation then rejects it (no character.level, etc.) — either outcome
    // confirms the pollution vector was blocked.
    if (result.ok) {
      const loaded = await loadState();
      // character was filtered out due to __proto__ — falls back to default null
      expect(loaded.character).toBeNull();
    } else {
      // Validation rejected because character was stripped — also acceptable
      expect(result.ok).toBe(false);
    }
    // The critical assertion: no prototype pollution on Object.prototype
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
  });
});
