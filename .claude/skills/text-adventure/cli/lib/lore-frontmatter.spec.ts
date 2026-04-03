import { describe, test, expect } from 'bun:test';
import { parseLoreFrontmatter, buildLoreFrontmatter } from './lore-frontmatter';
import type { LoreFrontmatter } from './lore-frontmatter';

// ── parseLoreFrontmatter ────────────────────────────────────────────

describe('parseLoreFrontmatter', () => {
  // ── No frontmatter ──────────────────────────────────────────────

  test('returns empty object for content without frontmatter', () => {
    const result = parseLoreFrontmatter('# Just a heading\nNo frontmatter.');
    expect(result).toEqual({});
  });

  test('returns empty object for empty string', () => {
    expect(parseLoreFrontmatter('')).toEqual({});
  });

  // ── Simple scalars ──────────────────────────────────────────────

  test('parses simple unquoted scalars', () => {
    const content = '---\nformat: text-adventure-lore\ntheme: space\n---\n';
    const result = parseLoreFrontmatter(content);
    expect(result.format).toBe('text-adventure-lore');
    expect(result.theme).toBe('space');
  });

  test('strips double quotes from scalar values', () => {
    const content = '---\ntitle: "The Glass Reef Atlas"\n---\n';
    const result = parseLoreFrontmatter(content);
    expect(result.title).toBe('The Glass Reef Atlas');
  });

  test('strips single quotes from scalar values', () => {
    const content = "---\nauthor: 'GM Claude'\n---\n";
    const result = parseLoreFrontmatter(content);
    expect(result.author).toBe('GM Claude');
  });

  // ── Type coercion ───────────────────────────────────────────────

  test('coerces boolean true/false values', () => {
    const content = '---\nedited: true\nexported: false\n---\n';
    const result = parseLoreFrontmatter(content);
    expect(result.edited).toBe(true);
    expect(result.exported).toBe(false);
  });

  test('coerces unquoted integer values', () => {
    const content = '---\nversion: 1\nacts: 5\n---\n';
    const result = parseLoreFrontmatter(content);
    expect(result.version).toBe(1);
    expect(result.acts).toBe(5);
  });

  test('preserves quoted numbers as strings', () => {
    const content = '---\nestimated-scenes: "96-128"\nplayers: "1"\n---\n';
    const result = parseLoreFrontmatter(content);
    expect(result.estimatedScenes).toBe('96-128');
    expect(result.players).toBe('1');
  });

  // ── kebab-case to camelCase ─────────────────────────────────────

  test('maps kebab-case keys to camelCase', () => {
    const content = [
      '---',
      'skill-version: "1.3.0"',
      'calendar-system: "Anchorage Drift Reckoning"',
      'start-date: "Cycle 403.19"',
      'start-time: "21:00"',
      'estimated-scenes: "96-128"',
      'exported-from: scene 5',
      '---',
    ].join('\n');
    const result = parseLoreFrontmatter(content);
    expect(result.skillVersion).toBe('1.3.0');
    expect(result.calendarSystem).toBe('Anchorage Drift Reckoning');
    expect(result.startDate).toBe('Cycle 403.19');
    expect(result.startTime).toBe('21:00');
    expect(result.estimatedScenes).toBe('96-128');
    expect(result.exportedFrom).toBe('scene 5');
  });

  // ── Folded multiline strings ────────────────────────────────────

  test('parses folded multiline string (> indicator)', () => {
    const content = [
      '---',
      'description: >',
      '  On the night a live atlas shard comes to auction,',
      '  cartographer Callis Dray vanishes.',
      'theme: space',
      '---',
    ].join('\n');
    const result = parseLoreFrontmatter(content);
    expect(result.description).toContain('On the night a live atlas shard');
    expect(result.description).toContain('cartographer Callis Dray vanishes.');
    // Folded style joins lines with spaces, not newlines
    expect(result.description).not.toContain('\n');
    // Next key after the folded block still parses
    expect(result.theme).toBe('space');
  });

  test('folded string trims leading/trailing whitespace', () => {
    const content = [
      '---',
      'description: >',
      '  First line.',
      '  Second line.',
      'title: Test',
      '---',
    ].join('\n');
    const result = parseLoreFrontmatter(content);
    expect(result.description).toBe('First line. Second line.');
  });

  // ── Block sequence arrays ───────────────────────────────────────

  test('parses simple block sequence (string items)', () => {
    const content = [
      '---',
      'required-modules:',
      '  - core-systems',
      '  - bestiary',
      '  - story-architect',
      '---',
    ].join('\n');
    const result = parseLoreFrontmatter(content);
    expect(result.requiredModules).toEqual(['core-systems', 'bestiary', 'story-architect']);
  });

  test('block sequence ends at next top-level key', () => {
    const content = [
      '---',
      'required-modules:',
      '  - core-systems',
      '  - bestiary',
      'optional-modules:',
      '  - star-chart',
      '  - audio',
      '---',
    ].join('\n');
    const result = parseLoreFrontmatter(content);
    expect(result.requiredModules).toEqual(['core-systems', 'bestiary']);
    expect(result.optionalModules).toEqual(['star-chart', 'audio']);
  });

  // ── Nested objects ──────────────────────────────────────────────

  test('parses nested object (recommended-styles)', () => {
    const content = [
      '---',
      'recommended-styles:',
      '  output: Sci-Fi-Narrator',
      '  visual: holographic',
      '---',
    ].join('\n');
    const result = parseLoreFrontmatter(content);
    expect(result.recommendedStyles).toEqual({
      output: 'Sci-Fi-Narrator',
      visual: 'holographic',
    });
  });

  test('falls back to scalar string for legacy recommended-styles', () => {
    const content = '---\nrecommended-styles: parchment\n---\n';
    const result = parseLoreFrontmatter(content);
    expect(result.recommendedStyles).toBe('parchment');
  });

  // ── Flow-style collections ──────────────────────────────────────

  test('parses flow-style object { key: val, ... }', () => {
    const content = [
      '---',
      'pre-generated-characters:',
      '  - name: "Rian"',
      '    stats: { STR: 9, DEX: 13, CON: 10, INT: 16, WIS: 14, CHA: 12 }',
      '---',
    ].join('\n');
    const result = parseLoreFrontmatter(content);
    const char = result.preGeneratedCharacters![0]!;
    expect(char.stats).toEqual({ STR: 9, DEX: 13, CON: 10, INT: 16, WIS: 14, CHA: 12 });
  });

  test('parses flow-style array ["a", "b"]', () => {
    const content = [
      '---',
      'pre-generated-characters:',
      '  - name: "Rian"',
      '    proficiencies: ["Investigation", "Navigation", "Insight"]',
      '---',
    ].join('\n');
    const result = parseLoreFrontmatter(content);
    const char = result.preGeneratedCharacters![0]!;
    expect(char.proficiencies).toEqual(['Investigation', 'Navigation', 'Insight']);
  });

  // ── Complex array of objects ────────────────────────────────────

  test('parses block sequence of objects (pre-generated-characters)', () => {
    const content = [
      '---',
      'pre-generated-characters:',
      '  - name: "Rian Vale"',
      '    class: "Cartographer"',
      '    hp: 10',
      '    ac: 12',
      '    openingLens: "rian"',
      '  - name: "Suri Kade"',
      '    class: "Reef Diver"',
      '    hp: 12',
      '    ac: 13',
      '---',
    ].join('\n');
    const result = parseLoreFrontmatter(content);
    expect(result.preGeneratedCharacters).toHaveLength(2);
    expect(result.preGeneratedCharacters![0]!.name).toBe('Rian Vale');
    expect(result.preGeneratedCharacters![0]!.hp).toBe(10);
    expect(result.preGeneratedCharacters![1]!.name).toBe('Suri Kade');
    expect(result.preGeneratedCharacters![1]!.class).toBe('Reef Diver');
  });

  test('nested arrays within complex objects', () => {
    const content = [
      '---',
      'pre-generated-characters:',
      '  - name: "Rian"',
      '    proficiencies: ["Investigation", "Navigation"]',
      '    starting-inventory:',
      '      - { name: "Route-slate", type: "key_item", effect: "Compares routes" }',
      '      - { name: "Pressure hood", type: "gear", effect: "Protects against exposure" }',
      '---',
    ].join('\n');
    const result = parseLoreFrontmatter(content);
    const char = result.preGeneratedCharacters![0]!;
    expect(char.proficiencies).toEqual(['Investigation', 'Navigation']);
    const inv = char.startingInventory as Record<string, unknown>[];
    expect(inv).toHaveLength(2);
    expect(inv[0]!.name).toBe('Route-slate');
    expect(inv[1]!.type).toBe('gear');
  });

  test('folded strings within complex objects', () => {
    const content = [
      '---',
      'pre-generated-characters:',
      '  - name: "Rian"',
      '    background: >',
      '      You made your name charting quiet dangers',
      '      for crews who could not afford licensed pilots.',
      '    hp: 10',
      '---',
    ].join('\n');
    const result = parseLoreFrontmatter(content);
    const char = result.preGeneratedCharacters![0]!;
    expect(char.background).toContain('charting quiet dangers');
    expect(char.background).toContain('licensed pilots.');
    // Folded — no literal newlines
    expect((char.background as string)).not.toContain('\n');
    // Subsequent key still parsed
    expect(char.hp).toBe(10);
  });

  // ── Edge cases ──────────────────────────────────────────────────

  test('ignores blank lines inside frontmatter', () => {
    const content = [
      '---',
      'format: text-adventure-lore',
      '',
      'title: "Test"',
      '---',
    ].join('\n');
    const result = parseLoreFrontmatter(content);
    expect(result.format).toBe('text-adventure-lore');
    expect(result.title).toBe('Test');
  });

  test('does not parse content after closing ---', () => {
    const content = '---\ntitle: Inside\n---\ntitle: Outside';
    const result = parseLoreFrontmatter(content);
    expect(result.title).toBe('Inside');
  });

  test('handles currency number coercion in nested objects', () => {
    const content = [
      '---',
      'pre-generated-characters:',
      '  - name: "Rian"',
      '    starting-currency: 90',
      '---',
    ].join('\n');
    const result = parseLoreFrontmatter(content);
    const char = result.preGeneratedCharacters![0]!;
    expect(char.startingCurrency).toBe(90);
  });

  // ── Full Glass Reef Atlas integration ───────────────────────────

  test('parses the full Glass Reef Atlas frontmatter', () => {
    const content = [
      '---',
      'format: text-adventure-lore',
      'version: 1',
      'skill-version: "1.3.0"',
      '',
      'title: "The Glass Reef Atlas"',
      'subtitle: "A Salvage-Mystery on the Shattersea Frontier"',
      'description: >',
      '  On the night a live atlas shard comes to auction under emergency law,',
      '  cartographer Callis Dray vanishes.',
      'author: "Gareth Williams"',
      'theme: space',
      'tone: mystery',
      'acts: 5',
      'episodes: 5',
      'estimated-scenes: "96-128"',
      'players: "1"',
      'difficulty: hard',
      'pacing: slow',
      'edited: true',
      '',
      'recommended-styles:',
      '  output: Sci-Fi-Narrator',
      '  visual: holographic',
      '',
      'seed: "glass-reef-atlas-31"',
      'rulebook: d20_system',
      '',
      'calendar-system: "Anchorage Drift Reckoning (26-hour tide cycle)"',
      'start-date: "Cycle 403.19"',
      'start-time: "21:00"',
      '',
      'pre-generated-characters:',
      '  - name: "Rian Vale"',
      '    class: "Cartographer"',
      '    stats: { STR: 9, DEX: 13, CON: 10, INT: 16, WIS: 14, CHA: 12 }',
      '    hp: 10',
      '    ac: 12',
      '    openingLens: "rian"',
      '    prologueVariant: "pregen_rian"',
      '    hook: "Callis Dray trusted you with a route fragment."',
      '    background: >',
      '      You made your name charting quiet dangers for crews who could not afford',
      '      licensed pilots.',
      '    proficiencies: ["Investigation", "Navigation", "Insight", "Perception"]',
      '    starting-inventory:',
      '      - { name: "Folded route-slate", type: "key_item", effect: "Compares live routes" }',
      '      - { name: "Pressure hood", type: "gear", effect: "Protects against exposure" }',
      '    starting-currency: 90',
      '  - name: "Suri Kade"',
      '    class: "Reef Diver"',
      '    stats: { STR: 12, DEX: 15, CON: 13, INT: 11, WIS: 13, CHA: 10 }',
      '    hp: 12',
      '    ac: 13',
      '    openingLens: "suri"',
      '    prologueVariant: "pregen_suri"',
      '    hook: "The Wakebound will lend you the Borrowed Tide."',
      '    proficiencies: ["Athletics", "Stealth", "Survival", "Perception"]',
      '    starting-inventory:',
      '      - { name: "Wakebound dive rig", type: "gear", effect: "Work exposed hulls" }',
      '      - { name: "Glass hook", type: "weapon", effect: "Tool and weapon" }',
      '    starting-currency: 55',
      '',
      'required-modules:',
      '  - core-systems',
      '  - bestiary',
      '  - story-architect',
      '  - ship-systems',
      '',
      'optional-modules:',
      '  - star-chart',
      '  - atmosphere',
      '  - audio',
      '---',
      '',
      '## World History',
    ].join('\n');

    const result = parseLoreFrontmatter(content);

    // Scalars
    expect(result.format).toBe('text-adventure-lore');
    expect(result.version).toBe(1);
    expect(result.skillVersion).toBe('1.3.0');
    expect(result.title).toBe('The Glass Reef Atlas');
    expect(result.theme).toBe('space');
    expect(result.tone).toBe('mystery');
    expect(result.acts).toBe(5);
    expect(result.pacing).toBe('slow');
    expect(result.edited).toBe(true);
    expect(result.seed).toBe('glass-reef-atlas-31');

    // Folded string
    expect(result.description).toContain('atlas shard');
    expect(result.description).toContain('Callis Dray vanishes.');

    // Nested object
    expect(result.recommendedStyles).toEqual({
      output: 'Sci-Fi-Narrator',
      visual: 'holographic',
    });

    // Arrays
    expect(result.requiredModules).toContain('core-systems');
    expect(result.requiredModules).toContain('ship-systems');
    expect(result.optionalModules).toContain('star-chart');

    // Complex array
    expect(result.preGeneratedCharacters).toHaveLength(2);
    const rian = result.preGeneratedCharacters![0]!;
    expect(rian.name).toBe('Rian Vale');
    expect(rian.class).toBe('Cartographer');
    expect(rian.hp).toBe(10);
    expect(rian.stats).toEqual({ STR: 9, DEX: 13, CON: 10, INT: 16, WIS: 14, CHA: 12 });
    expect(rian.proficiencies).toEqual(['Investigation', 'Navigation', 'Insight', 'Perception']);
    expect((rian.startingInventory as Record<string, unknown>[])!).toHaveLength(2);
    expect(rian.startingCurrency).toBe(90);

    const suri = result.preGeneratedCharacters![1]!;
    expect(suri.name).toBe('Suri Kade');
    expect(suri.startingCurrency).toBe(55);
  });
});

// ── buildLoreFrontmatter ────────────────────────────────────────────

describe('buildLoreFrontmatter', () => {
  test('wraps output in --- delimiters', () => {
    const out = buildLoreFrontmatter({ format: 'text-adventure-lore' });
    expect(out.startsWith('---\n')).toBe(true);
    expect(out).toContain('\n---');
  });

  test('emits simple scalars', () => {
    const out = buildLoreFrontmatter({ format: 'text-adventure-lore', theme: 'space' });
    expect(out).toContain('format: text-adventure-lore');
    expect(out).toContain('theme: space');
  });

  test('quotes strings containing special YAML characters', () => {
    const out = buildLoreFrontmatter({ title: 'The Glass Reef: Atlas' });
    expect(out).toContain('title: "The Glass Reef: Atlas"');
  });

  test('emits booleans and numbers without quotes', () => {
    const out = buildLoreFrontmatter({ edited: true, version: 1, acts: 5 });
    expect(out).toContain('edited: true');
    expect(out).toContain('version: 1');
    expect(out).toContain('acts: 5');
  });

  test('maps camelCase keys to kebab-case', () => {
    const out = buildLoreFrontmatter({
      skillVersion: '1.3.0',
      calendarSystem: 'ADR',
      startDate: 'Cycle 403',
      estimatedScenes: '96-128',
    });
    expect(out).toContain('skill-version:');
    expect(out).toContain('calendar-system:');
    expect(out).toContain('start-date:');
    expect(out).toContain('estimated-scenes:');
  });

  test('emits nested object with indented children', () => {
    const out = buildLoreFrontmatter({
      recommendedStyles: { output: 'Sci-Fi-Narrator', visual: 'holographic' },
    });
    expect(out).toContain('recommended-styles:\n');
    expect(out).toContain('  output: Sci-Fi-Narrator');
    expect(out).toContain('  visual: holographic');
  });

  test('emits scalar recommended-styles when value is string', () => {
    const out = buildLoreFrontmatter({ recommendedStyles: 'parchment' });
    expect(out).toContain('recommended-styles: parchment');
  });

  test('emits block sequence for string arrays', () => {
    const out = buildLoreFrontmatter({
      requiredModules: ['core-systems', 'bestiary', 'ship-systems'],
    });
    expect(out).toContain('required-modules:\n');
    expect(out).toContain('  - core-systems\n');
    expect(out).toContain('  - bestiary\n');
    expect(out).toContain('  - ship-systems\n');
  });

  test('emits complex array of objects', () => {
    const out = buildLoreFrontmatter({
      preGeneratedCharacters: [
        { name: 'Rian Vale', class: 'Cartographer', hp: 10, ac: 12 },
      ],
    });
    expect(out).toContain('pre-generated-characters:\n');
    expect(out).toContain('  - name: "Rian Vale"');
    expect(out).toContain('    class: Cartographer');
    expect(out).toContain('    hp: 10');
  });

  test('emits flow-style objects for known compact fields (stats)', () => {
    const out = buildLoreFrontmatter({
      preGeneratedCharacters: [
        { name: 'Rian', stats: { STR: 9, DEX: 13, CON: 10, INT: 16, WIS: 14, CHA: 12 } },
      ],
    });
    expect(out).toContain('stats: { STR: 9, DEX: 13, CON: 10, INT: 16, WIS: 14, CHA: 12 }');
  });

  test('emits flow-style arrays for inline array fields (proficiencies)', () => {
    const out = buildLoreFrontmatter({
      preGeneratedCharacters: [
        { name: 'Rian', proficiencies: ['Investigation', 'Navigation'] },
      ],
    });
    expect(out).toContain('proficiencies: ["Investigation", "Navigation"]');
  });

  test('emits nested block sequences with flow objects (starting-inventory)', () => {
    const out = buildLoreFrontmatter({
      preGeneratedCharacters: [
        {
          name: 'Rian',
          startingInventory: [
            { name: 'Route-slate', type: 'key_item', effect: 'Compares routes' },
          ],
        },
      ],
    });
    expect(out).toContain('starting-inventory:\n');
    expect(out).toContain('      - { name: "Route-slate", type: "key_item", effect: "Compares routes" }');
  });

  test('emits folded string for description', () => {
    const out = buildLoreFrontmatter({
      description: 'On the night a live atlas shard comes to auction, cartographer Callis Dray vanishes.',
    });
    expect(out).toContain('description: >\n');
    expect(out).toContain('  On the night');
  });

  // ── Round-trip ──────────────────────────────────────────────────

  test('round-trips simple frontmatter through build→parse', () => {
    const data: LoreFrontmatter = {
      format: 'text-adventure-lore',
      version: 1,
      title: 'Test Adventure',
      theme: 'space',
      edited: true,
      pacing: 'slow',
      seed: 'abc-123',
    };
    const built = buildLoreFrontmatter(data);
    const parsed = parseLoreFrontmatter(built);
    expect(parsed.format).toBe(data.format);
    expect(parsed.version).toBe(data.version);
    expect(parsed.title).toBe(data.title);
    expect(parsed.theme).toBe(data.theme);
    expect(parsed.edited).toBe(data.edited);
    expect(parsed.pacing).toBe(data.pacing);
    expect(parsed.seed).toBe(data.seed);
  });

  test('round-trips structured frontmatter through build→parse', () => {
    const data: LoreFrontmatter = {
      format: 'text-adventure-lore',
      version: 1,
      skillVersion: '1.3.0',
      title: 'The Glass Reef Atlas',
      edited: true,
      recommendedStyles: { output: 'Sci-Fi-Narrator', visual: 'holographic' },
      requiredModules: ['core-systems', 'bestiary', 'ship-systems'],
      optionalModules: ['star-chart', 'audio'],
    };
    const built = buildLoreFrontmatter(data);
    const parsed = parseLoreFrontmatter(built);
    expect(parsed.skillVersion).toBe('1.3.0');
    expect(parsed.recommendedStyles).toEqual({ output: 'Sci-Fi-Narrator', visual: 'holographic' });
    expect(parsed.requiredModules).toEqual(['core-systems', 'bestiary', 'ship-systems']);
    expect(parsed.optionalModules).toEqual(['star-chart', 'audio']);
  });

  test('round-trips complex arrays through build→parse', () => {
    const data: LoreFrontmatter = {
      preGeneratedCharacters: [
        {
          name: 'Rian Vale',
          class: 'Cartographer',
          hp: 10,
          ac: 12,
          stats: { STR: 9, DEX: 13, CON: 10, INT: 16, WIS: 14, CHA: 12 },
          proficiencies: ['Investigation', 'Navigation'],
          startingInventory: [
            { name: 'Route-slate', type: 'key_item', effect: 'Compares routes' },
          ],
          startingCurrency: 90,
        },
      ],
    };
    const built = buildLoreFrontmatter(data);
    const parsed = parseLoreFrontmatter(built);
    expect(parsed.preGeneratedCharacters).toHaveLength(1);
    const char = parsed.preGeneratedCharacters![0]!;
    expect(char.name).toBe('Rian Vale');
    expect(char.hp).toBe(10);
    expect(char.stats).toEqual({ STR: 9, DEX: 13, CON: 10, INT: 16, WIS: 14, CHA: 12 });
    expect(char.proficiencies).toEqual(['Investigation', 'Navigation']);
    expect((char.startingInventory as Record<string, unknown>[])!).toHaveLength(1);
    expect(char.startingCurrency).toBe(90);
  });
});
