import { describe, test, expect } from 'bun:test';
import { renderLevelup } from './levelup';
import { createDefaultState } from '../../lib/state-store';

describe('renderLevelup', () => {
  test('renders basic level-up data', () => {
    const state = createDefaultState();
    state.character = { 
      name: 'Zara', 
      level: 4, 
      hp: 30, 
      maxHp: 30 
    } as any;
    const html = renderLevelup(state, '');
    expect(html).toContain('data-char-name="Zara"');
    expect(html).toContain('data-level="4"');
    expect(html).toContain('data-abilities=""');
  });

  test('renders proficiency bonus increase and ability options', () => {
    const state = createDefaultState();
    state.character = { 
      name: 'Zara', 
      level: 5, 
      hp: 40, 
      maxHp: 40 
    } as any;
    // Level 5 prof bonus is 3, Level 4 was 2.
    const html = renderLevelup(state, '', { data: { abilities: ['Fireball', 'Fly'] } });
    expect(html).toContain('data-prof-changed-from="2"');
    expect(html).toContain('data-abilities="Fireball,Fly"');
    expect(html).toContain('Proficiency bonus increased: +2 &rarr; +3');
    expect(html).toContain('Fireball');
    expect(html).toContain('Fly');
  });

  test('escapes fallback character and ability text', () => {
    const state = createDefaultState();
    state.character = {
      name: '<img src=x onerror=alert("x")> "quote" &',
      level: 5,
      hp: 40,
      maxHp: 40
    } as any;
    const html = renderLevelup(state, '', {
      data: { abilities: ['Spark & <img src=x onerror=alert(1)>'] },
    });
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(&quot;x&quot;)&gt;');
    expect(html).toContain('Spark &amp;');
  });
});
