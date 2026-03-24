import { describe, test, expect } from 'bun:test';
import { renderCharacterCreation } from './character-creation';
import { createDefaultState } from '../../lib/state-store';

describe('renderCharacterCreation', () => {
  test('renders with null state and empty CSS', () => {
    const html = renderCharacterCreation(null, '');
    expect(html).toContain('Create Your Character');
    expect(html).toContain('widget-char-creation');
  });

  test('renders with default state and no options', () => {
    const state = createDefaultState();
    const html = renderCharacterCreation(state, '');
    expect(html).toContain('Create Your Character');
    expect(html).toContain('name-input');
  });

  test('renders empty archetype grid when no archetypes provided', () => {
    const html = renderCharacterCreation(null, '', { data: {} });
    expect(html).toContain('archetype-grid');
    // No <button class="archetype-card"> elements, though the CSS class definition still exists in <style>
    expect(html).not.toContain('<button class="archetype-card"');
  });

  test('renders default proficiency list when none provided', () => {
    const html = renderCharacterCreation(null, '', { data: {} });
    expect(html).toContain('Athletics');
    expect(html).toContain('Stealth');
    expect(html).toContain('prof-option');
  });

  test('renders archetype cards when provided', () => {
    const html = renderCharacterCreation(null, '', {
      data: {
        archetypes: [
          { name: 'Warrior', description: 'A strong fighter', hp: 12, ac: 16, stats: { STR: 16, DEX: 10 } },
          { name: 'Mage', description: 'A wise caster', hp: 6, ac: 10 },
        ],
      },
    });
    expect(html).toContain('Warrior');
    expect(html).toContain('Mage');
    expect(html).toContain('archetype-card');
    expect(html).toContain('HP 12');
    expect(html).toContain('AC 16');
  });

  test('renders confirm button', () => {
    const html = renderCharacterCreation(null, '');
    expect(html).toContain('confirm-btn');
  });

  test('injects CSS into style block', () => {
    const html = renderCharacterCreation(null, '.custom { color: red; }');
    expect(html).toContain('.custom { color: red; }');
  });
});
