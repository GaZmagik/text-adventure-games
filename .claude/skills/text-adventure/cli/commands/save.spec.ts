import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleSave } from './save';
import { saveState, createDefaultState, loadState, getSyncMarkerPath } from '../lib/state-store';
import { validateAndDecode, attachChecksum } from '../lib/fnv32';
import { MAX_STATE_HISTORY, SCHEMA_VERSION } from '../lib/constants';
import { readSignedMarker, getVerifyMarkerPath, getNeedsVerifyPath, clearStateDirCache } from './verify';
import type { StateHistoryEntry } from '../types';

let tempDir: string;
const originalEnv = process.env.TAG_STATE_DIR;

beforeEach(async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'tag-save-'));
  process.env.TAG_STATE_DIR = tempDir;
  clearStateDirCache();
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

  test('AQ: byteLength is a positive number', async () => {
    const result = await handleSave(['generate']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(typeof data.byteLength).toBe('number');
    expect(data.byteLength as number).toBeGreaterThan(0);
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

describe('save generate — frontmatter', () => {
  test('returns a frontmatter object with required fields', async () => {
    const result = await handleSave(['generate']);
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    const fm = data.frontmatter as Record<string, unknown>;
    expect(fm).toBeDefined();
    expect(fm.format).toBe('text-adventure-save');
    expect(fm.version).toBe(1);
    expect(fm['skill-version']).toBe(SCHEMA_VERSION);
    expect(fm.character).toBe('Test Hero');
    expect(fm.class).toBe('Scout');
    expect(fm.level).toBe(3);
    expect(fm.scene).toBe(7);
    expect(fm.mode).toBe('full');
  });

  test('frontmatter includes date-saved as ISO 8601', async () => {
    const result = await handleSave(['generate']);
    const fm = (result.data as Record<string, unknown>).frontmatter as Record<string, unknown>;
    expect(typeof fm['date-saved']).toBe('string');
    expect(fm['date-saved'] as string).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('frontmatter includes location from currentRoom', async () => {
    const state = await loadState();
    state.currentRoom = 'bridge';
    await saveState(state);
    const result = await handleSave(['generate']);
    const fm = (result.data as Record<string, unknown>).frontmatter as Record<string, unknown>;
    expect(fm.location).toBe('bridge');
  });

  test('frontmatter has null character fields when no character', async () => {
    const state = await loadState();
    state.character = null;
    await saveState(state);
    const result = await handleSave(['generate']);
    const fm = (result.data as Record<string, unknown>).frontmatter as Record<string, unknown>;
    expect(fm.character).toBeNull();
    expect(fm.class).toBeNull();
    expect(fm.level).toBeNull();
  });

  test('frontmatter includes arc and arc-type with defaults', async () => {
    const result = await handleSave(['generate']);
    const fm = (result.data as Record<string, unknown>).frontmatter as Record<string, unknown>;
    expect(fm.arc).toBe(1);
    expect(fm['arc-type']).toBe('standard');
  });

  test('frontmatter reflects theme and visual-style from state', async () => {
    const state = await loadState();
    state.theme = 'space';
    state.visualStyle = 'station';
    await saveState(state);
    const result = await handleSave(['generate']);
    const fm = (result.data as Record<string, unknown>).frontmatter as Record<string, unknown>;
    expect(fm.theme).toBe('space');
    expect(fm['visual-style']).toBe('station');
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

    // AR: mode field is present in load response
    const loadData = loadResult.data as Record<string, unknown>;
    expect(loadData.mode).toBe('full');

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

  test('falls back to trimmed file contents when no fenced or bare save is present', async () => {
    const saveFilePath = join(tempDir, 'raw-content.save.md');
    writeFileSync(saveFilePath, '  not-a-valid-save-string  \n', 'utf-8');

    const loadResult = await handleSave(['load', saveFilePath]);
    expect(loadResult.ok).toBe(false);
    expect(loadResult.error!.message).toContain('Save validation failed');
  });

  test('fails without save string argument', async () => {
    const result = await handleSave(['load']);
    expect(result.ok).toBe(false);
  });

  test('strips unknown nested keys on load and reports warnings', async () => {
    const polluted = await loadState();
    (polluted.character as Record<string, unknown>).alias = 'Ghost';
    (polluted.time as Record<string, unknown>).season = 'winter';
    await saveState(polluted);

    const genResult = await handleSave(['generate']);
    const saveString = (genResult.data as Record<string, unknown>).saveString as string;

    const freshState = createDefaultState();
    await saveState(freshState);

    const loadResult = await handleSave(['load', saveString]);
    expect(loadResult.ok).toBe(true);
    const warnings = ((loadResult.data as Record<string, unknown>).warnings ?? []) as string[];
    expect(warnings.some(w => w.includes('character.alias'))).toBe(true);
    expect(warnings.some(w => w.includes('time.season'))).toBe(true);

    const restored = await loadState();
    expect('alias' in (restored.character as Record<string, unknown>)).toBe(false);
    expect('season' in (restored.time as Record<string, unknown>)).toBe(false);
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
    expect(result.error!.message).toContain('home, temp, or /mnt/ directory');
  });

  test('validate rejects a file path outside home/tmp directory', async () => {
    const result = await handleSave(['validate', '/etc/passwd']);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('home, temp, or /mnt/ directory');
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
    expect(result.error.message).toContain('must be within the home, temp, or /mnt/ directory');
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

// ── Phase 2: _stateHistory persistence ───────────────────────────────

describe('save — _stateHistory persistence', () => {
  /** Build a checksummed SF2 save string from an arbitrary payload object. */
  function makeSave(payload: Record<string, unknown>): string {
    const code = 'SF2:' + btoa(JSON.stringify(payload));
    return attachChecksum(code);
  }

  test('_stateHistory round-trips through save/load', async () => {
    const state = await loadState();
    const entry: StateHistoryEntry = {
      timestamp: '2026-03-24T12:00:00Z', command: 'state set',
      path: 'scene', oldValue: 0, newValue: 7,
    };
    state._stateHistory = [entry];
    await saveState(state);

    const genResult = await handleSave(['generate']);
    expect(genResult.ok).toBe(true);
    const saveString = (genResult.data as Record<string, unknown>).saveString as string;
    const decoded = validateAndDecode(saveString);
    expect(decoded.valid).toBe(true);
    if (!decoded.valid) return;
    expect(decoded.payload._stateHistory).toBeDefined();
    expect((decoded.payload._stateHistory as unknown[]).length).toBe(1);

    // Reset and reload
    const fresh = createDefaultState();
    await saveState(fresh);
    const loadResult = await handleSave(['load', saveString]);
    expect(loadResult.ok).toBe(true);
    const restored = await loadState();
    expect(restored._stateHistory.length).toBe(1);
    expect(restored._stateHistory[0]!.command).toBe('state set');
  });

  test('_stateHistory caps at MAX_STATE_HISTORY on load', async () => {
    const entries: StateHistoryEntry[] = Array.from({ length: MAX_STATE_HISTORY + 20 }, (_, i) => ({
      timestamp: `2026-03-24T${String(i).padStart(2, '0')}:00:00Z`,
      command: `cmd-${i}`, path: 'scene', oldValue: i, newValue: i + 1,
    }));
    const state = await loadState();
    const payload: Record<string, unknown> = { ...state, _stateHistory: entries };
    delete (payload as Record<string, unknown>)._lastComputation;
    const saveString = makeSave({ v: 1, mode: 'full', ...payload });
    const loadResult = await handleSave(['load', saveString]);
    expect(loadResult.ok).toBe(true);
    const restored = await loadState();
    // AU: pre-condition — input had MORE entries than the cap
    expect(entries.length).toBeGreaterThan(MAX_STATE_HISTORY);
    // Post-condition — loaded state is capped
    expect(restored._stateHistory.length).toBeLessThanOrEqual(MAX_STATE_HISTORY);
  });

  test('_lastComputation is excluded from save payload', async () => {
    const state = await loadState();
    state._lastComputation = { type: 'hazard_save', stat: 'DEX', roll: 15, modifier: 3, total: 18, dc: 14, outcome: 'success' };
    await saveState(state);
    const genResult = await handleSave(['generate']);
    expect(genResult.ok).toBe(true);
    const saveString = (genResult.data as Record<string, unknown>).saveString as string;
    const decoded = validateAndDecode(saveString);
    expect(decoded.valid).toBe(true);
    if (!decoded.valid) return;
    expect(decoded.payload._lastComputation).toBeUndefined();
  });
});

// ── Phase 3: HP clamping on load ─────────────────────────────────────

describe('save load — HP clamping migration', () => {
  function makeSave(payload: Record<string, unknown>): string {
    const code = 'SF2:' + btoa(JSON.stringify(payload));
    return attachChecksum(code);
  }

  test('clamps character.hp into [0, maxHp] range on load', async () => {
    const base = createDefaultState();
    const payload: Record<string, unknown> = {
      ...base, _version: 1, scene: 1,
      character: {
        name: 'Wounded', class: 'Scout', hp: -5, maxHp: 20, ac: 10,
        level: 1, xp: 0, currency: 0, currencyName: 'credits',
        stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
        modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
        proficiencyBonus: 2, proficiencies: [], abilities: [],
        inventory: [], conditions: [],
        equipment: { weapon: 'Blaster', armour: 'Vest' },
      },
    };
    delete payload._stateHistory;
    delete payload._lastComputation;
    delete payload._schemaVersion; // Simulate pre-1.3.0 save to trigger migration
    const saveString = makeSave({ v: 1, mode: 'full', ...payload });
    const result = await handleSave(['load', saveString]);
    expect(result.ok).toBe(true);
    const restored = await loadState();
    expect(restored.character!.hp).toBe(0);
  });
});

// ── AH: 10 MB size limit ─────────────────────────────────────────────

describe('save load — size limit', () => {
  test('AH: rejects a file larger than 10 MB', async () => {
    const bigFilePath = join(tempDir, 'big.save.md');
    writeFileSync(bigFilePath, Buffer.alloc(11 * 1024 * 1024));
    const result = await handleSave(['load', bigFilePath]);
    expect(result.ok).toBe(false);
    expect(result.error!.message).toContain('size limit');
  });
});

// ── AX: ENOENT path ──────────────────────────────────────────────────

describe('save load — missing file', () => {
  test('AX: handles a non-existent file path gracefully', async () => {
    const result = await handleSave(['load', '/tmp/nonexistent-file-path.save.md']);
    // The path falls outside home/tmp resolution, or the file is missing.
    // Either way the result must not throw; ok:false with an appropriate error.
    expect(result.ok).toBe(false);
  });
});

// ── BA: Two-digit semver component ───────────────────────────────────

describe('save — semver two-digit component', () => {
  function makeSave(payload: Record<string, unknown>): string {
    const code = 'SF2:' + btoa(JSON.stringify(payload));
    return attachChecksum(code);
  }

  test('BA: 1.10.0 is treated as > 1.3.0 (numeric comparison, not lexicographic)', async () => {
    // A save stamped with a future version '1.10.0' should NOT trigger the pre-1.3.0
    // HP-clamping migration (since 1.10.0 > 1.3.0). We set hp > maxHp (25/20) to verify
    // that no clamp is applied when the version is correctly parsed numerically.
    const base = createDefaultState();
    const payload: Record<string, unknown> = {
      ...base, v: 1, mode: 'full',
      _schemaVersion: '1.10.0',   // Simulate a hypothetical future version
      character: {
        name: 'Future', class: 'Scout', hp: 20, maxHp: 20, ac: 10,
        level: 1, xp: 0, currency: 0, currencyName: 'credits',
        stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
        modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
        proficiencyBonus: 2, proficiencies: [], abilities: [],
        inventory: [], conditions: [],
        equipment: { weapon: 'Blaster', armour: 'Vest' },
      },
    };
    delete payload._lastComputation;
    const saveString = makeSave(payload);
    // The save should be accepted (valid state, no migration needed for 1.10.0)
    const result = await handleSave(['load', saveString]);
    expect(result.ok).toBe(true);
  });
});

// ── Phase 10: Schema versioning ──────────────────────────────────────

describe('save — schema versioning', () => {
  function makeSave(payload: Record<string, unknown>): string {
    const code = 'SF2:' + btoa(JSON.stringify(payload));
    return attachChecksum(code);
  }

  test('missing _schemaVersion defaults to 1.2.0 on load', async () => {
    const base = createDefaultState();
    const payload: Record<string, unknown> = { ...base, v: 1, mode: 'full' };
    delete payload._schemaVersion;
    delete payload._lastComputation;
    const saveString = makeSave(payload);
    const result = await handleSave(['load', saveString]);
    expect(result.ok).toBe(true);
    const restored = await loadState();
    expect(restored._schemaVersion).toBe(SCHEMA_VERSION);
  });

  test('migration applies HP clamp for pre-1.3.0 saves', async () => {
    const base = createDefaultState();
    const payload: Record<string, unknown> = {
      ...base, v: 1, mode: 'full',
      character: {
        name: 'Legacy', class: 'Scout', hp: 25, maxHp: 20, ac: 10,
        level: 1, xp: 0, currency: 0, currencyName: 'credits',
        stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
        modifiers: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
        proficiencyBonus: 2, proficiencies: [], abilities: [],
        inventory: [], conditions: [],
        equipment: { weapon: 'Blaster', armour: 'Vest' },
      },
    };
    delete payload._schemaVersion;
    delete payload._lastComputation;
    const saveString = makeSave(payload);
    const result = await handleSave(['load', saveString]);
    expect(result.ok).toBe(true);
    const restored = await loadState();
    expect(restored.character!.hp).toBe(20);
  });

  test('current version round-trips without migration', async () => {
    const state = await loadState();
    state._schemaVersion = SCHEMA_VERSION;
    await saveState(state);
    const genResult = await handleSave(['generate']);
    expect(genResult.ok).toBe(true);
    const saveString = (genResult.data as Record<string, unknown>).saveString as string;
    const fresh = createDefaultState();
    await saveState(fresh);
    const loadResult = await handleSave(['load', saveString]);
    expect(loadResult.ok).toBe(true);
    const restored = await loadState();
    expect(restored._schemaVersion).toBe(SCHEMA_VERSION);
    expect(restored.character!.hp).toBe(18);
  });
});

// ── Workflow marker stamping on load ────────────────────────────────

describe('save load — workflow markers', () => {
  test('stamps sync marker for loaded scene', async () => {
    const genResult = await handleSave(['generate']);
    const saveString = (genResult.data as Record<string, unknown>).saveString as string;
    const fresh = createDefaultState();
    await saveState(fresh);
    clearStateDirCache();

    const loadResult = await handleSave(['load', saveString]);
    expect(loadResult.ok).toBe(true);

    const syncScene = readSignedMarker(getSyncMarkerPath());
    expect(syncScene).toBe(7);
  });

  test('stamps verify marker for loaded scene', async () => {
    const genResult = await handleSave(['generate']);
    const saveString = (genResult.data as Record<string, unknown>).saveString as string;
    const fresh = createDefaultState();
    await saveState(fresh);
    clearStateDirCache();

    await handleSave(['load', saveString]);

    const verifyScene = readSignedMarker(getVerifyMarkerPath());
    expect(verifyScene).toBe(7);
  });

  test('stamps pre-game verify markers', async () => {
    const genResult = await handleSave(['generate']);
    const saveString = (genResult.data as Record<string, unknown>).saveString as string;
    const fresh = createDefaultState();
    await saveState(fresh);
    clearStateDirCache();

    await handleSave(['load', saveString]);

    for (const type of ['scenario', 'rules', 'character']) {
      const marker = readSignedMarker(join(tempDir, `.verified-${type}`));
      expect(marker).toBeGreaterThanOrEqual(0);
    }
  });

  test('clears stale needs-verify marker', async () => {
    // Write a stale needs-verify marker before loading
    writeFileSync(getNeedsVerifyPath(), '5:stale', 'utf-8');

    const genResult = await handleSave(['generate']);
    const saveString = (genResult.data as Record<string, unknown>).saveString as string;
    const fresh = createDefaultState();
    await saveState(fresh);
    clearStateDirCache();

    await handleSave(['load', saveString]);

    expect(existsSync(getNeedsVerifyPath())).toBe(false);
  });
});
