import { describe, test, expect } from 'bun:test';
import { renderCharacterCreation } from './character-creation';

const ARCHETYPES = [
  { name: 'Vanguard', description: 'Front-line fighter.', stats: { STR: 16, DEX: 12 }, hp: 12, ac: 16, fixedProficiencies: ['Athletics'] },
  { name: 'Operative', flavour: 'Stealth specialist.', baseStats: { DEX: 16, INT: 14 }, abilities: ['Sneak Attack'], equipment: ['Lockpicks'] },
];

const PREGENS = [
  { name: 'Kael Voss', class: 'Marine', hook: 'A grizzled vet.', stats: { STR: 14 }, hp: 10, ac: 14, proficiencies: ['Athletics'], openingLens: 'duty' },
  { name: 'Lyra Chen', class: 'Engineer', background: 'Ship mechanic.', stats: { INT: 16 }, hp: 8, ac: 12 },
];

describe('renderCharacterCreation', () => {
  test('emits a <ta-character-creation> custom element', () => {
    const html = renderCharacterCreation(null, 'station', { data: {} });
    expect(html).toContain('<ta-character-creation');
    expect(html).toContain('</ta-character-creation>');
  });

  test('includes data-config attribute with JSON payload', () => {
    const html = renderCharacterCreation(null, 'station', { data: {} });
    expect(html).toContain('data-config="');
  });

  test('includes CDN script tag for ta-components.js', () => {
    const html = renderCharacterCreation(null, 'station', { data: {} });
    expect(html).toContain('ta-components.js');
    expect(html).toContain('<script src="');
  });

  test('includes CSS URLs', () => {
    const html = renderCharacterCreation(null, 'station', { data: {} });
    expect(html).toContain('station.css');
    expect(html).toContain('common-widget.css');
    expect(html).toContain('pregame-design.css');
  });
});

describe('character-creation config serialisation', () => {
  test('serialises archetypes into config', () => {
    const html = renderCharacterCreation(null, 'station', { data: { archetypes: ARCHETYPES } });
    expect(html).toContain('Vanguard');
    expect(html).toContain('Operative');
  });

  test('serialises pre-generated characters into config', () => {
    const html = renderCharacterCreation(null, 'station', { data: { preGeneratedCharacters: PREGENS } });
    expect(html).toContain('Kael Voss');
    expect(html).toContain('Lyra Chen');
  });

  test('serialises default proficiencies when none provided', () => {
    const html = renderCharacterCreation(null, 'station', { data: {} });
    expect(html).toContain('Athletics');
    expect(html).toContain('Stealth');
    expect(html).toContain('Perception');
  });

  test('serialises custom proficiencies when provided', () => {
    const html = renderCharacterCreation(null, 'station', {
      data: { proficiencies: ['Hacking', 'Piloting'] },
    });
    expect(html).toContain('Hacking');
    expect(html).toContain('Piloting');
  });

  test('serialises object-based proficiencies with attributes', () => {
    const html = renderCharacterCreation(null, 'station', {
      data: { proficiencies: [{ name: 'Repair', attr: 'INT' }, { name: 'Stealth' }] },
    });
    expect(html).toContain('Repair (INT)');
    expect(html).toContain('Stealth');
  });

  test('serialises defaultName when provided', () => {
    const html = renderCharacterCreation(null, 'station', {
      data: { defaultName: 'Test Hero' },
    });
    expect(html).toContain('Test Hero');
  });

  test('serialises name pool when provided', () => {
    const html = renderCharacterCreation(null, 'station', {
      data: {},
      namePool: { given: ['Aria'], surname: ['Storm'] },
    });
    expect(html).toContain('Aria');
    expect(html).toContain('Storm');
  });

  test('preserves allowCustom=false in config', () => {
    const html = renderCharacterCreation(null, 'station', {
      data: { allowCustom: false, preGeneratedCharacters: PREGENS },
    });
    const match = html.match(/data-config="([^"]*)"/);
    const raw = match![1]!.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
    const parsed = JSON.parse(raw);
    expect(parsed.allowCustom).toBe(false);
  });
});

describe('character-creation data-style', () => {
  test('includes data-style attribute', () => {
    const html = renderCharacterCreation(null, 'neon', { data: {} });
    expect(html).toContain('data-style="neon"');
  });
});
