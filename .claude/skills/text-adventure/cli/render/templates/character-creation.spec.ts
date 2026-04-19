import { describe, test, expect } from 'bun:test';
import { renderCharacterCreation } from './character-creation';

// ── Existing contract ─────────────────────────────────────────────

describe('renderCharacterCreation pronouns and name randomiser', () => {
  test('renders pronoun radio options', () => {
    const html = renderCharacterCreation(null, '');
    expect(html).toContain('data-pronouns="she/her"');
    expect(html).toContain('data-pronouns="he/him"');
    expect(html).toContain('data-pronouns="they/them"');
    expect(html).toContain('data-pronouns="custom"');
  });

  test('custom pronouns shows subject and object dropdowns', () => {
    const html = renderCharacterCreation(null, '');
    expect(html).toContain('id="pronoun-subject"');
    expect(html).toContain('id="pronoun-object"');
    // Dropdowns should have he/she/they and him/her/them options
    expect(html).toMatch(/<option[^>]*>he<\/option>/);
    expect(html).toMatch(/<option[^>]*>she<\/option>/);
    expect(html).toMatch(/<option[^>]*>they<\/option>/);
    expect(html).toMatch(/<option[^>]*>him<\/option>/);
    expect(html).toMatch(/<option[^>]*>her<\/option>/);
    expect(html).toMatch(/<option[^>]*>them<\/option>/);
  });

  test('renders randomise name button', () => {
    const html = renderCharacterCreation(null, '');
    expect(html).toContain('id="randomise-name"');
  });

  test('renders pre-generated characters alongside a custom option', () => {
    const html = renderCharacterCreation(null, '', {
      data: {
        preGeneratedCharacters: [
          { name: 'Rian Vale', class: 'Cartographer', openingLens: 'rian', prologueVariant: 'pregen_rian' },
        ],
      },
    });
    expect(html).toContain('Rian Vale');
    expect(html).toContain('Create Your Own');
    expect(html).toContain('pregen_rian');
  });

  test('embeds name pools when provided via options', () => {
    const html = renderCharacterCreation(null, '', {
      data: {},
      namePool: { given: ['Kira', 'Jin'], surname: ['Vasquez', 'Chen'] },
    });
    expect(html).toContain('Kira');
    expect(html).toContain('Vasquez');
  });

  test('sendPrompt script includes pronouns in payload', () => {
    const html = renderCharacterCreation(null, '');
    expect(html).toContain('pronouns');
    expect(html).toContain('selectedPronouns');
  });

  test('confirm script copies synthesized prompt when sendPrompt is unavailable', () => {
    const html = renderCharacterCreation(null, '');
    expect(html).toContain("document.execCommand('copy')");
    expect(html).toContain("btn.textContent = copied ? 'Copied! Paste as your reply.' : 'Copy the prompt from the tooltip.';");
    expect(html).toContain("btn.setAttribute('title', prompt)");
  });
});

// ── Hero section ───────────────────────────────────────────────────

describe('character-creation hero', () => {
  test('renders hero section', () => {
    const html = renderCharacterCreation(null, '');
    expect(html).toContain('pd-hero');
    expect(html).toContain('pd-hero-heading');
  });

  test('hero appears before subpanels', () => {
    const html = renderCharacterCreation(null, '');
    const heroIdx = html.indexOf('<header class="pd-hero"');
    const subpanelIdx = html.indexOf('<article class="pd-subpanel">');
    expect(heroIdx).toBeGreaterThan(-1);
    expect(heroIdx).toBeLessThan(subpanelIdx);
  });
});

// ── Control deck ───────────────────────────────────────────────────

describe('character-creation control deck', () => {
  test('renders control deck with build summary', () => {
    const html = renderCharacterCreation(null, '');
    expect(html).toContain('pd-control-deck');
    expect(html).toContain('pd-selection-title');
  });

  test('control deck has aria-live status region', () => {
    const html = renderCharacterCreation(null, '');
    expect(html).toContain('aria-live="polite"');
  });

  test('control deck shows summary rows for build state', () => {
    const html = renderCharacterCreation(null, '');
    expect(html).toContain('pd-summary-row');
  });

  test('control deck appears between hero and subpanels', () => {
    const html = renderCharacterCreation(null, '');
    const heroIdx = html.indexOf('<header class="pd-hero"');
    const deckIdx = html.indexOf('<section class="pd-control-deck"');
    const subpanelIdx = html.indexOf('<article class="pd-subpanel">');
    expect(heroIdx).toBeLessThan(deckIdx);
    expect(deckIdx).toBeLessThan(subpanelIdx);
  });
});

// ── Subpanel grouping ──────────────────────────────────────────────

describe('character-creation subpanels', () => {
  test('wraps sections in subpanels (at least pronouns, name, proficiencies)', () => {
    const html = renderCharacterCreation(null, '');
    expect(html).toContain('pd-subpanel');
    const count = (html.match(/<article class="pd-subpanel">/g) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('subpanels have titles', () => {
    const html = renderCharacterCreation(null, '');
    expect(html).toContain('pd-subpanel-title');
  });

  test('archetype section adds a subpanel when archetypes provided', () => {
    const html = renderCharacterCreation(null, '', {
      data: {
        archetypes: [
          { name: 'Soldier', description: 'A fighter', stats: { STR: 16 } },
        ],
      },
    });
    const count = (html.match(/<article class="pd-subpanel">/g) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('pre-gen section adds a subpanel when pregens provided', () => {
    const html = renderCharacterCreation(null, '', {
      data: {
        preGeneratedCharacters: [
          { name: 'Kael Voss', class: 'Scout' },
        ],
      },
    });
    const count = (html.match(/<article class="pd-subpanel">/g) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(4);
  });
});

// ── Verify safety ──────────────────────────────────────────────────

describe('character-creation verify safety', () => {
  test('retains creation-confirm button', () => {
    const html = renderCharacterCreation(null, '');
    expect(html).toContain('creation-confirm');
  });

  test('retains widget-char-creation class', () => {
    const html = renderCharacterCreation(null, '');
    expect(html).toContain('widget-char-creation');
  });
});

// ── Script interaction ─────────────────────────────────────────────

describe('character-creation script interaction', () => {
  test('script updates control deck title on build changes', () => {
    const html = renderCharacterCreation(null, '');
    expect(html).toContain('pd-sel-title');
  });

  test('preset/custom mode switching preserved', () => {
    const html = renderCharacterCreation(null, '', {
      data: {
        preGeneratedCharacters: [
          { name: 'Test Char', class: 'Warrior' },
        ],
      },
    });
    expect(html).toContain('setPresetMode');
    expect(html).toContain('setCustomMode');
  });

  test('preset summary uses DOM construction not textContent with HTML', () => {
    const html = renderCharacterCreation(null, '', {
      data: {
        preGeneratedCharacters: [
          { name: 'Riley Chen', class: 'Scout', hook: 'Promised someone.' },
        ],
      },
    });
    // Must use buildPresetSummary (DOM nodes), not summarisePreset (HTML string via textContent)
    expect(html).toContain('buildPresetSummary');
    expect(html).not.toContain('summarisePreset');
  });
});
