import { describe, test, expect } from 'bun:test';
import { renderCharacterCreation } from './character-creation';

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
});
