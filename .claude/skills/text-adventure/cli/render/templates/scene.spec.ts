import { describe, test, expect } from 'bun:test';
import { renderScene } from './scene';

const BASE_STATE = {
  currentRoom: 'Bridge',
  scene: 5,
  arc: 1,
  theme: 'sci-fi',
  modulesActive: ['core-systems', 'lore-codex'],
  character: {
    name: 'Kael', class: 'Marine', hp: 8, maxHp: 10, ac: 14, level: 3, poiMax: 2,
    xp: 500, proficiencyBonus: 2, currency: 50, currencyName: 'Credits',
    stats: { STR: 10, DEX: 14, CON: 12, INT: 16, WIS: 10, CHA: 8 },
    modifiers: { STR: 0, DEX: 2, CON: 1, INT: 3, WIS: 0, CHA: -1 },
    proficiencies: ['Athletics', 'Perception'],
    abilities: ['Second Wind'],
    equipment: { weapon: 'Pulse Rifle', armour: 'Tactical Vest' },
    inventory: [{ name: 'Medkit', qty: 2 }],
    conditions: [],
  },
  time: { period: 'evening', date: 'Day 3', elapsed: 3, hour: 19 },
} as any;

// ── Custom element output ──────────────────────────────────────────

describe('renderScene custom element', () => {
  test('emits a <ta-scene> custom element', () => {
    const html = renderScene(BASE_STATE, 'station');
    expect(html).toContain('<ta-scene');
    expect(html).toContain('</ta-scene>');
  });

  test('renders empty state when state is null', () => {
    const html = renderScene(null, 'station');
    expect(html).toContain('No active scene');
  });

  test('includes data-room attribute', () => {
    const html = renderScene(BASE_STATE, 'station');
    expect(html).toContain('data-room="Bridge"');
  });

  test('includes data-scene attribute', () => {
    const html = renderScene(BASE_STATE, 'station');
    expect(html).toContain('data-scene="5"');
  });

  test('includes CDN script tags', () => {
    const html = renderScene(BASE_STATE, 'station');
    expect(html).toContain('ta-components.js');
    expect(html).toContain('tag-scene.js');
  });

  test('includes CSS URLs for style and scene-design', () => {
    const html = renderScene(BASE_STATE, 'station');
    expect(html).toContain('station.css');
    expect(html).toContain('scene-design.css');
  });
});

// ── Panel pre-population ───────────────────────────────────────────

describe('renderScene panel pre-population', () => {
  test('renders character panel div', () => {
    const html = renderScene(BASE_STATE, 'station');
    expect(html).toContain('data-panel="character"');
  });

  test('renders codex panel when lore-codex module active', () => {
    const state = { ...BASE_STATE, modulesActive: ['lore-codex'], codexMutations: [{ key: 'test', label: 'Test' }] };
    const html = renderScene(state, 'station');
    expect(html).toContain('data-panel="codex"');
  });

  test('renders quests panel when core-systems active', () => {
    const state = {
      ...BASE_STATE,
      modulesActive: ['core-systems'],
      quests: [{ title: 'Find the key', objectives: [{ description: 'Search the room', completed: false }] }],
    };
    const html = renderScene(state, 'station');
    expect(html).toContain('data-panel="quests"');
    expect(html).toContain('Find the key');
  });

  test('includes levelup panel when pending', () => {
    const state = { ...BASE_STATE, _levelupPending: true };
    const html = renderScene(state, 'station');
    expect(html).toContain('data-panel="levelup"');
  });

  test('ignores unknown modules when building panel fallbacks', () => {
    const state = { ...BASE_STATE, modulesActive: ['custom'] };
    const html = renderScene(state, 'station');
    expect(html).toContain('data-panel="character"');
    expect(html).not.toContain('data-panel="custom"');
  });
});

// ── Inner HTML content ─────────────────────────────────────────────

describe('renderScene inner content', () => {
  test('includes progressive reveal structure', () => {
    const html = renderScene(BASE_STATE, 'station');
    expect(html).toContain('id="reveal-brief"');
    expect(html).toContain('id="reveal-full"');
    expect(html).toContain('continue-reveal-btn');
  });

  test('includes location bar with room name', () => {
    const html = renderScene(BASE_STATE, 'station');
    expect(html).toContain('loc-bar');
    expect(html).toContain('Bridge');
  });

  test('includes ta-tts element', () => {
    const html = renderScene(BASE_STATE, 'station');
    expect(html).toContain('<ta-tts>');
  });

  test('includes scene-meta div', () => {
    const html = renderScene(BASE_STATE, 'station');
    expect(html).toContain('id="scene-meta"');
    expect(html).toContain('data-meta=');
  });

  test('includes footer element', () => {
    const html = renderScene(BASE_STATE, 'station');
    expect(html).toContain('ta-footer');
    expect(html).toContain('id="save-btn"');
  });

  test('includes HP pips when character present', () => {
    const html = renderScene(BASE_STATE, 'station');
    expect(html).toContain('status-bar');
    expect(html).toContain('AC 14');
  });
});

describe('renderScene fallback escaping', () => {
  test('escapes room, narrative, atmosphere, and quest fallback text', () => {
    const malicious = '<img src=x onerror=alert("x")> "quotes" & ampersand';
    const state = {
      ...BASE_STATE,
      currentRoom: malicious,
      modulesActive: ['core-systems', 'atmosphere'],
      quests: [{
        id: 'q1',
        title: malicious,
        status: 'active',
        objectives: [{ id: 'o1', description: malicious, completed: false }],
        clues: [],
      }],
    };
    const html = renderScene(state, 'station', {
      data: {
        text: malicious,
        brief: malicious,
        atmosphere: [malicious, 'ozone & salt', '"quoted" air'],
      },
    });
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(&quot;x&quot;)&gt;');
    expect(html).toContain('&quot;quotes&quot; &amp; ampersand');
  });
});

// ── Multi-phase reveal ─────────────────────────────────────────────

describe('renderScene multi-phase reveal', () => {
  test('single phase renders single narrative div', () => {
    const html = renderScene(BASE_STATE, '');
    expect(html).toContain('id="narrative"');
    expect(html).not.toContain('data-phase=');
  });

  test('phases=1 renders single narrative div', () => {
    const html = renderScene(BASE_STATE, '', { phases: 1 });
    expect(html).toContain('id="narrative"');
  });

  test('phases=2 renders two phase divs', () => {
    const html = renderScene(BASE_STATE, '', { phases: 2 });
    expect(html).toContain('data-phase="1"');
    expect(html).toContain('data-phase="2"');
  });

  test('phases=3 renders three phase divs', () => {
    const html = renderScene(BASE_STATE, '', { phases: 3 });
    expect(html).toContain('data-phase="1"');
    expect(html).toContain('data-phase="2"');
    expect(html).toContain('data-phase="3"');
  });

  test('multi-phase has continue buttons between phases', () => {
    const html = renderScene(BASE_STATE, '', { phases: 2 });
    expect(html).toContain('phase-continue');
    expect(html).toContain('data-reveal-phase="2"');
  });

  test('last phase has no continue button', () => {
    const html = renderScene(BASE_STATE, '', { phases: 3 });
    expect(html).not.toContain('data-reveal-phase="4"');
  });

  test('subsequent phases are hidden by default', () => {
    const html = renderScene(BASE_STATE, '', { phases: 2 });
    // Phase 2 should be hidden — check the element containing data-phase="2"
    const phase2Start = html.indexOf('data-phase="2"');
    // Look at the element opening tag surrounding this attribute
    const tagStart = html.lastIndexOf('<div', phase2Start);
    const tagEnd = html.indexOf('>', phase2Start);
    const tag = html.slice(tagStart, tagEnd + 1);
    expect(tag).toContain('display:none');
  });
});

// ── Audio module ───────────────────────────────────────────────────

describe('renderScene audio module', () => {
  test('includes soundscape script when audio module active', () => {
    const state = { ...BASE_STATE, modulesActive: ['audio'] };
    const html = renderScene(state, 'station');
    expect(html).toContain('tag-soundscape.js');
  });

  test('omits soundscape script when audio module inactive', () => {
    const state = { ...BASE_STATE, modulesActive: [] };
    const html = renderScene(state, 'station');
    expect(html).not.toContain('tag-soundscape.js');
  });
});
