// tag CLI — Lore File Verification Tests

import { describe, test, expect } from 'bun:test';
import {
  checkLoreFrontmatterPresent,
  checkLoreFrontmatterFields,
  checkLoreFrontmatterValues,
  checkLoreExportFields,
  checkLorePregenCharacters,
  checkLoreBodySections,
  checkLorePayload,
  verifyLoreFile,
} from './verify-lore';
import type { LoreFrontmatter } from './lore-frontmatter';
import { attachChecksum } from './fnv32';

// ── Fixtures ─────────────────────────────────────────────────────────

const MINIMAL_VALID_LORE = `---
format: text-adventure-lore
version: 1
skill-version: "1.4.0"
title: "Test World"
theme: space
tone: mystery
acts: 3
players: "1"
difficulty: moderate
rulebook: d20_system
---

## World History

The ancient wars shaped the galaxy.

## Location Atlas

### Starport Alpha
A bustling trade hub.

## NPC Roster

### Captain Vex
A grizzled veteran.

## Story Spine

### Act 1: The Awakening
The hero discovers a mystery.
`;

function makeValidPayload(): string {
  const data = {
    _loreVersion: 1,
    _schemaVersion: '1.4.0',
    rosterMutations: [],
    factions: {},
    quests: [],
    worldFlags: {},
    currentRoom: 'start',
    time: { hour: 8, date: 'Day 1' },
    modulesActive: [],
    codexMutations: [],
    previousAdventurer: null,
  };
  const json = JSON.stringify(data);
  const encoded = 'LF1:' + Buffer.from(json).toString('base64');
  return attachChecksum(encoded);
}

const MINIMAL_BASE64_LORE = `---
format: text-adventure-lore
version: 1
title: "Test World"
theme: space
tone: mystery
acts: 3
players: "1"
difficulty: moderate
---

<!-- LORE:${makeValidPayload()} -->
`;

// ── checkLoreFrontmatterPresent ───────────────────────────────────────

describe('checkLoreFrontmatterPresent', () => {
  test('passes when valid frontmatter present', () => {
    const failures: string[] = [];
    const result = checkLoreFrontmatterPresent(MINIMAL_VALID_LORE, failures);
    expect(failures).toHaveLength(0);
    expect(result).toBe(true);
  });

  test('fails when no frontmatter delimiters', () => {
    const failures: string[] = [];
    checkLoreFrontmatterPresent('Just some text with no frontmatter.', failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('No YAML frontmatter found');
  });

  test('returns false for missing frontmatter', () => {
    const failures: string[] = [];
    const result = checkLoreFrontmatterPresent('No frontmatter here.', failures);
    expect(result).toBe(false);
  });
});

// ── checkLoreFrontmatterFields ────────────────────────────────────────

describe('checkLoreFrontmatterFields', () => {
  test('passes with all required fields', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = {
      format: 'text-adventure-lore',
      version: 1,
      title: 'Test World',
      theme: 'space',
      tone: 'mystery',
      acts: 3,
      players: '1',
      difficulty: 'moderate',
    };
    checkLoreFrontmatterFields(fm, failures);
    expect(failures).toHaveLength(0);
  });

  test('fails for each missing required field', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = {
      format: 'text-adventure-lore',
      version: 1,
      // title missing
      theme: 'space',
      tone: 'mystery',
      acts: 3,
      players: '1',
      difficulty: 'moderate',
    };
    checkLoreFrontmatterFields(fm, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('title');
  });

  test('reports all missing fields at once', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = {};
    checkLoreFrontmatterFields(fm, failures);
    expect(failures).toHaveLength(8);
    const joined = failures.join(' ');
    expect(joined).toContain('format');
    expect(joined).toContain('version');
    expect(joined).toContain('title');
    expect(joined).toContain('theme');
    expect(joined).toContain('tone');
    expect(joined).toContain('acts');
    expect(joined).toContain('players');
    expect(joined).toContain('difficulty');
  });
});

// ── checkLoreFrontmatterValues ────────────────────────────────────────

describe('checkLoreFrontmatterValues', () => {
  test('passes for valid values', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = {
      format: 'text-adventure-lore',
      version: 1,
      skillVersion: '1.4.0',
      rulebook: 'd20_system',
      recommendedStyles: { visual: 'station' },
      requiredModules: ['prose-craft', 'die-rolls'],
      exportedDate: '2026-04-08T09:00:00.000Z',
    };
    checkLoreFrontmatterValues(fm, failures);
    expect(failures).toHaveLength(0);
  });

  test('fails when format is wrong', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = { format: 'wrong' };
    checkLoreFrontmatterValues(fm, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('format');
  });

  test('fails when version is not positive', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = { version: -1 };
    checkLoreFrontmatterValues(fm, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('version');
  });

  test('fails when skill-version is not semver', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = { skillVersion: 'abc' };
    checkLoreFrontmatterValues(fm, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('skill-version');
  });

  test('fails when rulebook is unknown', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = { rulebook: 'made_up' };
    checkLoreFrontmatterValues(fm, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('rulebook');
  });

  test('passes when rulebook is known', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = { rulebook: 'd20_system' };
    checkLoreFrontmatterValues(fm, failures);
    expect(failures).toHaveLength(0);
  });

  test('fails when visual style is unknown', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = { recommendedStyles: { visual: 'comic_sans' } };
    checkLoreFrontmatterValues(fm, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('visual');
  });

  test('fails when required-modules contains unknown module', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = { requiredModules: ['prose-craft', 'totally-fake-module'] };
    checkLoreFrontmatterValues(fm, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('totally-fake-module');
  });

  test('passes for valid exported-date', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = { exportedDate: '2026-04-08T12:00:00.000Z' };
    checkLoreFrontmatterValues(fm, failures);
    expect(failures).toHaveLength(0);
  });

  test('fails for invalid exported-date', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = { exportedDate: 'not-a-date' };
    checkLoreFrontmatterValues(fm, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('exported-date');
  });
});

// ── checkLoreExportFields ─────────────────────────────────────────────

describe('checkLoreExportFields', () => {
  test('no failures when exported is false/undefined', () => {
    const failures: string[] = [];
    checkLoreExportFields({}, failures);
    expect(failures).toHaveLength(0);

    checkLoreExportFields({ exported: false }, failures);
    expect(failures).toHaveLength(0);
  });

  test('fails when exported true but exported-date missing', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = { exported: true, exportedFrom: 'scene 5' };
    checkLoreExportFields(fm, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('exported-date');
  });

  test('fails when exported true but exported-from missing', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = { exported: true, exportedDate: '2026-04-08T09:00:00.000Z' };
    checkLoreExportFields(fm, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('exported-from');
  });

  test('passes when all export fields present', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = {
      exported: true,
      exportedDate: '2026-04-08T09:00:00.000Z',
      exportedFrom: 'scene 5',
    };
    checkLoreExportFields(fm, failures);
    expect(failures).toHaveLength(0);
  });
});

// ── checkLorePregenCharacters ─────────────────────────────────────────

describe('checkLorePregenCharacters', () => {
  test('no failures when no pre-generated-characters', () => {
    const failures: string[] = [];
    checkLorePregenCharacters({}, failures);
    expect(failures).toHaveLength(0);

    checkLorePregenCharacters({ preGeneratedCharacters: [] }, failures);
    expect(failures).toHaveLength(0);
  });

  test('passes for valid character entries', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = {
      preGeneratedCharacters: [
        {
          name: 'Lyra',
          class: 'Rogue',
          hp: 28,
          stats: { STR: 10, DEX: 16, CON: 12, INT: 14, WIS: 10, CHA: 13 },
        },
      ],
    };
    checkLorePregenCharacters(fm, failures);
    expect(failures).toHaveLength(0);
  });

  test('fails when character missing name', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = {
      preGeneratedCharacters: [
        { class: 'Fighter', hp: 30 },
      ],
    };
    checkLorePregenCharacters(fm, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('index 0');
    expect(failures[0]).toContain('name');
  });

  test('fails when character missing hp', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = {
      preGeneratedCharacters: [
        { name: 'Kira', class: 'Wizard' },
      ],
    };
    checkLorePregenCharacters(fm, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('hp');
  });

  test('fails when stats block has wrong number of keys', () => {
    const failures: string[] = [];
    const fm: LoreFrontmatter = {
      preGeneratedCharacters: [
        { name: 'Kira', class: 'Wizard', hp: 20, stats: { STR: 8, DEX: 14, CON: 10 } },
      ],
    };
    checkLorePregenCharacters(fm, failures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('6 keys');
  });
});

// ── checkLoreBodySections ─────────────────────────────────────────────

describe('checkLoreBodySections', () => {
  test('passes with all required sections', () => {
    const failures: string[] = [];
    const warnings: string[] = [];
    checkLoreBodySections(MINIMAL_VALID_LORE, {}, false, failures, warnings);
    expect(failures).toHaveLength(0);
  });

  test('skips all section checks when hasPayload is true', () => {
    const failures: string[] = [];
    const warnings: string[] = [];
    const lore = '---\nformat: text-adventure-lore\n---\n\nNo sections here.';
    checkLoreBodySections(lore, {}, true, failures, warnings);
    expect(failures).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  test('fails when World History missing', () => {
    const failures: string[] = [];
    const warnings: string[] = [];
    const lore = MINIMAL_VALID_LORE.replace('## World History\n\nThe ancient wars shaped the galaxy.\n', '');
    checkLoreBodySections(lore, {}, false, failures, warnings);
    const joined = failures.join(' ');
    expect(joined).toContain('World History');
  });

  test('fails when NPC Roster missing', () => {
    const failures: string[] = [];
    const warnings: string[] = [];
    const lore = MINIMAL_VALID_LORE
      .replace('## NPC Roster\n\n### Captain Vex\nA grizzled veteran.\n', '');
    checkLoreBodySections(lore, {}, false, failures, warnings);
    const joined = failures.join(' ');
    expect(joined).toContain('NPC Roster');
  });

  test('warns when Encounter Tables missing', () => {
    const failures: string[] = [];
    const warnings: string[] = [];
    checkLoreBodySections(MINIMAL_VALID_LORE, {}, false, failures, warnings);
    const joined = warnings.join(' ');
    expect(joined).toContain('Encounter Tables');
  });

  test('warns when Faction Dynamics missing', () => {
    const failures: string[] = [];
    const warnings: string[] = [];
    checkLoreBodySections(MINIMAL_VALID_LORE, {}, false, failures, warnings);
    const joined = warnings.join(' ');
    expect(joined).toContain('Faction Dynamics');
  });

  test('fails when Previous Adventurer missing and exported true', () => {
    const failures: string[] = [];
    const warnings: string[] = [];
    const fm: LoreFrontmatter = { exported: true };
    checkLoreBodySections(MINIMAL_VALID_LORE, fm, false, failures, warnings);
    const joined = failures.join(' ');
    expect(joined).toContain('Previous Adventurer');
  });

  test('no failure for missing Previous Adventurer when not exported', () => {
    const failures: string[] = [];
    const warnings: string[] = [];
    checkLoreBodySections(MINIMAL_VALID_LORE, {}, false, failures, warnings);
    const joined = failures.join(' ');
    expect(joined).not.toContain('Previous Adventurer');
  });

  test('fails for empty required section', () => {
    const failures: string[] = [];
    const warnings: string[] = [];
    const lore = MINIMAL_VALID_LORE.replace(
      '## World History\n\nThe ancient wars shaped the galaxy.',
      '## World History\n\n   ',
    );
    checkLoreBodySections(lore, {}, false, failures, warnings);
    const joined = failures.join(' ');
    expect(joined).toContain('World History');
    expect(joined).toContain('empty');
  });
});

// ── checkLorePayload ──────────────────────────────────────────────────

describe('checkLorePayload', () => {
  test('returns hasPayload false when no payload', () => {
    const failures: string[] = [];
    const result = checkLorePayload(MINIMAL_VALID_LORE, failures);
    expect(result.hasPayload).toBe(false);
    expect(failures).toHaveLength(0);
  });

  test('passes for valid checksummed payload', () => {
    const failures: string[] = [];
    const result = checkLorePayload(MINIMAL_BASE64_LORE, failures);
    expect(result.hasPayload).toBe(true);
    expect(failures).toHaveLength(0);
  });

  test('fails when payload has invalid checksum', () => {
    const failures: string[] = [];
    const badLore = `---
format: text-adventure-lore
version: 1
---

<!-- LORE:deadbeef.LF1:dGhpcyBpcyBub3QgdmFsaWQK -->
`;
    const result = checkLorePayload(badLore, failures);
    expect(result.hasPayload).toBe(true);
    expect(failures).toHaveLength(1);
  });
});

// ── verifyLoreFile ────────────────────────────────────────────────────

describe('verifyLoreFile', () => {
  test('passes for complete valid lore file', () => {
    const result = verifyLoreFile(MINIMAL_VALID_LORE);
    expect(result.failures).toHaveLength(0);
    expect(result.checks).toBe(7);
    expect(result.frontmatter).not.toBeNull();
  });

  test('passes for valid base64 lore file', () => {
    const result = verifyLoreFile(MINIMAL_BASE64_LORE);
    expect(result.failures).toHaveLength(0);
    expect(result.checks).toBe(7);
    expect(result.frontmatter).not.toBeNull();
  });

  test('returns failures for broken file', () => {
    const broken = `---
format: wrong-format
version: -5
---

## World History

Some content.
`;
    const result = verifyLoreFile(broken);
    expect(result.failures.length).toBeGreaterThan(0);
  });

  test('short-circuits on missing frontmatter', () => {
    const result = verifyLoreFile('No frontmatter at all.');
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]).toContain('No YAML frontmatter found');
    expect(result.frontmatter).toBeNull();
    expect(result.checks).toBe(1);
  });
});
