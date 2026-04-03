import { describe, test, expect } from 'bun:test';
import { renderScenarioSelect } from './scenario-select';

const TWO_SCENARIOS = {
  scenarios: [
    { title: 'Cold Freight', hook: 'Your deck has gone quiet.', genres: ['mystery'], difficulty: 'normal' },
    { title: 'Dust Anvil', description: 'The drill hit something.', genres: ['horror'], difficulty: 'hard' },
  ],
};

const FEATURED_SCENARIOS = {
  scenarios: [
    { id: 'cold-freight', title: 'Cold Freight', preamble: 'Your deck has gone quiet.', genres: ['mystery'], difficulty: 'normal', accent: '#78e4ff' },
    { id: 'crown', title: 'Crown of the Eventide', preamble: 'An impossible city.', genres: ['epic', 'cosmic'], featured: true, accent: '#9e8fff' },
    { id: 'dust', title: 'Dust Anvil', description: 'The drill hit something.', genres: ['horror'] },
  ],
};

// ── Existing contract ──────────────────────────────────────────────

describe('renderScenarioSelect', () => {
  test('renders scenario cards from data', () => {
    const html = renderScenarioSelect(null, '', { data: TWO_SCENARIOS });
    expect(html).toContain('Cold Freight');
    expect(html).toContain('data-prompt="I choose scenario: Cold Freight"');
  });

  test('selection script copies prompts when sendPrompt is unavailable', () => {
    const html = renderScenarioSelect(null, '', { data: TWO_SCENARIOS });
    expect(html).toContain("document.execCommand('copy')");
    expect(html).toContain("btn.textContent = copied ? 'Copied! Paste as your reply.' : 'Copy the prompt from the tooltip.';");
  });
});

// ── Hero section ───────────────────────────────────────────────────

describe('scenario-select hero', () => {
  test('renders hero section with heading', () => {
    const html = renderScenarioSelect(null, '', { data: TWO_SCENARIOS });
    expect(html).toContain('pd-hero');
    expect(html).toContain('pd-hero-heading');
  });

  test('hero appears before the scenario grid', () => {
    const html = renderScenarioSelect(null, '', { data: TWO_SCENARIOS });
    const heroIdx = html.indexOf('pd-hero');
    const gridIdx = html.indexOf('scenario-grid');
    expect(heroIdx).toBeLessThan(gridIdx);
  });
});

// ── Control deck ───────────────────────────────────────────────────

describe('scenario-select control deck', () => {
  test('renders control deck with first scenario selected by default', () => {
    const html = renderScenarioSelect(null, '', { data: TWO_SCENARIOS });
    expect(html).toContain('pd-control-deck');
    expect(html).toContain('pd-selection-title');
    // First scenario is the default selection
    expect(html).toContain('Cold Freight');
  });

  test('renders control deck with featured scenario selected by default', () => {
    const html = renderScenarioSelect(null, '', { data: FEATURED_SCENARIOS });
    // Find the actual HTML element, not the CSS selector
    const deckStart = html.indexOf('<section class="pd-control-deck"');
    const deckEnd = html.indexOf('</section>', deckStart);
    const deck = html.slice(deckStart, deckEnd);
    expect(deck).toContain('Crown of the Eventide');
  });

  test('control deck has aria-live status region', () => {
    const html = renderScenarioSelect(null, '', { data: TWO_SCENARIOS });
    expect(html).toContain('aria-live="polite"');
  });

  test('control deck appears between hero and grid', () => {
    const html = renderScenarioSelect(null, '', { data: TWO_SCENARIOS });
    const heroIdx = html.indexOf('pd-hero');
    const deckIdx = html.indexOf('pd-control-deck');
    const gridIdx = html.indexOf('scenario-grid');
    expect(heroIdx).toBeLessThan(deckIdx);
    expect(deckIdx).toBeLessThan(gridIdx);
  });
});

// ── Extended data shape ────────────────────────────────────────────

describe('scenario-select extended data', () => {
  test('preamble works as description alias', () => {
    const html = renderScenarioSelect(null, '', {
      data: {
        scenarios: [
          { title: 'A', preamble: 'Preamble text here.' },
          { title: 'B', hook: 'Hook text.' },
        ],
      },
    });
    expect(html).toContain('Preamble text here.');
    expect(html).toContain('Hook text.');
  });

  test('renders data-scenario-id when id is provided', () => {
    const html = renderScenarioSelect(null, '', { data: FEATURED_SCENARIOS });
    expect(html).toContain('data-scenario-id="cold-freight"');
    expect(html).toContain('data-scenario-id="crown"');
  });

  test('renders difficulty and players metadata', () => {
    const html = renderScenarioSelect(null, '', {
      data: {
        scenarios: [
          { title: 'A', difficulty: 'hard', players: '1-4' },
          { title: 'B' },
        ],
      },
    });
    expect(html).toContain('hard');
    expect(html).toContain('1-4');
  });
});

// ── Featured card treatment ────────────────────────────────────────

describe('scenario-select featured', () => {
  test('marks featured card with data-featured attribute', () => {
    const html = renderScenarioSelect(null, '', { data: FEATURED_SCENARIOS });
    expect(html).toContain('data-featured="true"');
  });

  test('non-featured cards do not get data-featured="true"', () => {
    const html = renderScenarioSelect(null, '', { data: FEATURED_SCENARIOS });
    // Match HTML attributes only (preceded by whitespace), not CSS selectors
    const featuredCount = (html.match(/\sdata-featured="true"/g) ?? []).length;
    expect(featuredCount).toBe(1);
  });
});

// ── Accent colour ──────────────────────────────────────────────────

describe('scenario-select accent', () => {
  test('sets --card-accent-rgb CSS variable from hex accent', () => {
    const html = renderScenarioSelect(null, '', { data: FEATURED_SCENARIOS });
    // #78e4ff → 120, 228, 255
    expect(html).toContain('--card-accent-rgb: 120, 228, 255');
    // #9e8fff → 158, 143, 255
    expect(html).toContain('--card-accent-rgb: 158, 143, 255');
  });

  test('omits accent variable when no accent provided', () => {
    const html = renderScenarioSelect(null, '', {
      data: { scenarios: [{ title: 'A' }, { title: 'B' }] },
    });
    expect(html).not.toContain('--card-accent-rgb');
  });
});

// ── aria-pressed selection state ───────────────────────────────────

describe('scenario-select aria state', () => {
  test('first card has aria-pressed="true" when no featured', () => {
    const html = renderScenarioSelect(null, '', { data: TWO_SCENARIOS });
    // Match HTML attributes only (preceded by whitespace), not CSS selectors
    const presses = [...html.matchAll(/\saria-pressed="(true|false)"/g)].map(m => m[1]);
    expect(presses.length).toBeGreaterThanOrEqual(2);
    expect(presses[0]).toBe('true');
    expect(presses[1]).toBe('false');
  });

  test('featured card has aria-pressed="true" when featured exists', () => {
    const html = renderScenarioSelect(null, '', { data: FEATURED_SCENARIOS });
    // Crown is featured (index 1 in input, but should be pressed)
    // Find the card containing "Crown" and check its aria-pressed
    const crownCardStart = html.indexOf('data-scenario-id="crown"');
    const nearbyPressed = html.slice(crownCardStart - 200, crownCardStart + 200);
    expect(nearbyPressed).toContain('aria-pressed="true"');
  });
});

// ── Backward compatibility ─────────────────────────────────────────

describe('scenario-select backward compat', () => {
  test('hook still works as description alias', () => {
    const html = renderScenarioSelect(null, '', {
      data: { scenarios: [{ title: 'A', hook: 'Hook text.' }, { title: 'B' }] },
    });
    expect(html).toContain('Hook text.');
  });

  test('genre (singular) still works', () => {
    const html = renderScenarioSelect(null, '', {
      data: { scenarios: [{ title: 'A', genre: ['mystery'] }, { title: 'B' }] },
    });
    expect(html).toContain('mystery');
  });

  test('tags works as genre alias', () => {
    const html = renderScenarioSelect(null, '', {
      data: { scenarios: [{ title: 'A', tags: ['survival', 'horror'] }, { title: 'B' }] },
    });
    expect(html).toContain('survival');
    expect(html).toContain('horror');
  });
});

// ── Verify-safe structure ──────────────────────────────────────────

describe('scenario-select verify safety', () => {
  test('each card has scenario-select-btn with data-prompt', () => {
    const html = renderScenarioSelect(null, '', { data: FEATURED_SCENARIOS });
    // Match class attribute only, not CSS selector references
    const btnCount = (html.match(/class="scenario-select-btn"/g) ?? []).length;
    expect(btnCount).toBe(3);
    const promptCount = (html.match(/data-prompt="I choose scenario:/g) ?? []).length;
    expect(promptCount).toBe(3);
  });

  test('each button has title fallback', () => {
    const html = renderScenarioSelect(null, '', { data: FEATURED_SCENARIOS });
    const buttons = [...html.matchAll(/class="scenario-select-btn"[^>]*title="([^"]*)"/g)];
    expect(buttons.length).toBe(3);
    for (const btn of buttons) {
      expect(btn[1]!.length).toBeGreaterThan(0);
    }
  });

  test('cards use scenario-card class', () => {
    const html = renderScenarioSelect(null, '', { data: TWO_SCENARIOS });
    const cardCount = (html.match(/class="scenario-card"/g) ?? []).length;
    expect(cardCount).toBe(2);
  });
});

// ── Cover art hero card ───────────────────────────────────────────

describe('scenario-select cover art', () => {
  const COVER_SCENARIOS = {
    scenarios: [
      {
        id: 'the-glass-reef-atlas',
        title: 'The Glass Reef Atlas',
        description: 'A salvage-mystery on the Shattersea Frontier.',
        genres: ['sci-fi', 'mystery'],
        difficulty: 'hard',
        players: '1',
        featured: true,
        coverFront: 'https://cdn.example.com/story/the-glass-reef-atlas-front-cover.png',
        coverBack: 'https://cdn.example.com/story/the-glass-reef-atlas-back-cover.png',
      },
      { title: 'Dust Anvil', description: 'The drill hit something.', genres: ['horror'] },
    ],
  };

  test('featured card with coverFront gets data-has-cover attribute', () => {
    const html = renderScenarioSelect(null, '', { data: COVER_SCENARIOS });
    expect(html).toContain('data-has-cover="true"');
  });

  test('featured card with both covers renders front and back as img elements', () => {
    const html = renderScenarioSelect(null, '', { data: COVER_SCENARIOS });
    expect(html).toContain('<img');
    expect(html).toContain('the-glass-reef-atlas-front-cover.png');
    expect(html).toContain('the-glass-reef-atlas-back-cover.png');
  });

  test('featured card with both covers omits description text', () => {
    const html = renderScenarioSelect(null, '', { data: COVER_SCENARIOS });
    // Find the cover card HTML element (not CSS selectors)
    const cardOpen = html.indexOf('<div class="scenario-card"');
    const coverCardStart = html.indexOf('data-has-cover="true"', cardOpen);
    // Find the next card div after this one
    const nextCard = html.indexOf('<div class="scenario-card"', coverCardStart);
    const coverCard = html.slice(coverCardStart, nextCard > 0 ? nextCard : undefined);
    // The card should not contain a scenario-desc div
    expect(coverCard).not.toContain('scenario-desc');
  });

  test('non-cover cards do not get data-has-cover', () => {
    const html = renderScenarioSelect(null, '', { data: COVER_SCENARIOS });
    // Only 1 card should have the cover attribute (match HTML attrs, not CSS selectors)
    const coverCount = (html.match(/\sdata-has-cover="true"/g) ?? []).length;
    expect(coverCount).toBe(1);
  });

  test('cover card uses cover-spread layout class', () => {
    const html = renderScenarioSelect(null, '', { data: COVER_SCENARIOS });
    expect(html).toContain('cover-spread');
  });

  test('cover card still has scenario-select-btn for verify safety', () => {
    const html = renderScenarioSelect(null, '', { data: COVER_SCENARIOS });
    // The cover card must still have a select button
    const btnCount = (html.match(/class="scenario-select-btn"/g) ?? []).length;
    expect(btnCount).toBe(2);
  });
});

// ── Empty state ────────────────────────────────────────────────────

describe('scenario-select empty state', () => {
  test('shows usage hint when no scenarios', () => {
    const html = renderScenarioSelect(null, '', { data: {} });
    expect(html).toContain('tag render scenario-select');
  });

  test('omits hero and control deck when empty', () => {
    const html = renderScenarioSelect(null, '', { data: {} });
    expect(html).not.toContain('pd-hero');
    expect(html).not.toContain('pd-control-deck');
  });
});

// ── Selection script ───────────────────────────────────────────────

describe('scenario-select interaction script', () => {
  test('script updates aria-pressed on card click', () => {
    const html = renderScenarioSelect(null, '', { data: TWO_SCENARIOS });
    expect(html).toContain('aria-pressed');
    // Script should contain selection update logic
    expect(html).toContain('setAttribute');
  });

  test('script updates control deck title on selection', () => {
    const html = renderScenarioSelect(null, '', { data: TWO_SCENARIOS });
    expect(html).toContain('pd-sel-title');
  });
});
