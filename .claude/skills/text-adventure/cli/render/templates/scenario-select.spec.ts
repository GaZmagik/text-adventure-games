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

// ── Custom element output ──────────────────────────────────────────

describe('renderScenarioSelect', () => {
  test('emits a <ta-scenario-select> custom element', () => {
    const html = renderScenarioSelect(null, 'station', { data: TWO_SCENARIOS });
    expect(html).toContain('<ta-scenario-select');
    expect(html).toContain('</ta-scenario-select>');
  });

  test('includes data-scenarios attribute with JSON payload', () => {
    const html = renderScenarioSelect(null, 'station', { data: TWO_SCENARIOS });
    expect(html).toContain('data-scenarios="');
    // The JSON should contain our scenario titles (HTML-escaped)
    expect(html).toContain('Cold Freight');
    expect(html).toContain('Dust Anvil');
  });

  test('includes CDN script tag for ta-components.js', () => {
    const html = renderScenarioSelect(null, 'station', { data: TWO_SCENARIOS });
    expect(html).toContain('ta-components.js');
    expect(html).toContain('<script src="');
  });

  test('includes CSS URLs for style, common-widget, and pregame-design', () => {
    const html = renderScenarioSelect(null, 'station', { data: TWO_SCENARIOS });
    expect(html).toContain('data-css-urls="');
    expect(html).toContain('station.css');
    expect(html).toContain('common-widget.css');
    expect(html).toContain('pregame-design.css');
  });
});

// ── Data serialisation ─────────────────────────────────────────────

describe('scenario-select data serialisation', () => {
  test('serialises scenario titles into data-scenarios JSON', () => {
    const html = renderScenarioSelect(null, 'station', { data: TWO_SCENARIOS });
    // Extract the data-scenarios value
    const match = html.match(/data-scenarios="([^"]*)"/);
    expect(match).not.toBeNull();
    // The value is HTML-escaped JSON — unescape &quot; back to "
    const raw = match![1]!.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
    const parsed = JSON.parse(raw);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
    expect(parsed[0].title).toBe('Cold Freight');
    expect(parsed[1].title).toBe('Dust Anvil');
  });

  test('preserves description aliases (hook, preamble)', () => {
    const html = renderScenarioSelect(null, 'station', { data: TWO_SCENARIOS });
    expect(html).toContain('Your deck has gone quiet.');
    expect(html).toContain('The drill hit something.');
  });

  test('preserves preamble alias', () => {
    const html = renderScenarioSelect(null, 'station', {
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

  test('preserves scenario id', () => {
    const html = renderScenarioSelect(null, 'station', { data: FEATURED_SCENARIOS });
    expect(html).toContain('cold-freight');
    expect(html).toContain('crown');
  });

  test('preserves difficulty and players', () => {
    const html = renderScenarioSelect(null, 'station', {
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

// ── Featured scenario ──────────────────────────────────────────────

describe('scenario-select featured', () => {
  test('featured flag is preserved in serialised data', () => {
    const html = renderScenarioSelect(null, 'station', { data: FEATURED_SCENARIOS });
    const match = html.match(/data-scenarios="([^"]*)"/);
    const raw = match![1]!.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
    const parsed = JSON.parse(raw);
    const featured = parsed.filter((s: Record<string, unknown>) => s.featured);
    expect(featured.length).toBe(1);
    expect(featured[0].title).toBe('Crown of the Eventide');
  });
});

// ── Accent colour ──────────────────────────────────────────────────

describe('scenario-select accent', () => {
  test('accent hex values are preserved in serialised data', () => {
    const html = renderScenarioSelect(null, 'station', { data: FEATURED_SCENARIOS });
    expect(html).toContain('#78e4ff');
    expect(html).toContain('#9e8fff');
  });

  test('omits accent when not provided', () => {
    const html = renderScenarioSelect(null, 'station', {
      data: { scenarios: [{ title: 'A' }, { title: 'B' }] },
    });
    expect(html).not.toContain('#78e4ff');
  });
});

// ── Backward compatibility ─────────────────────────────────────────

describe('scenario-select backward compat', () => {
  test('hook still works as description alias', () => {
    const html = renderScenarioSelect(null, 'station', {
      data: { scenarios: [{ title: 'A', hook: 'Hook text.' }, { title: 'B' }] },
    });
    expect(html).toContain('Hook text.');
  });

  test('genre (singular) still works', () => {
    const html = renderScenarioSelect(null, 'station', {
      data: { scenarios: [{ title: 'A', genre: ['mystery'] }, { title: 'B' }] },
    });
    expect(html).toContain('mystery');
  });

  test('tags works as genre alias', () => {
    const html = renderScenarioSelect(null, 'station', {
      data: { scenarios: [{ title: 'A', tags: ['survival', 'horror'] }, { title: 'B' }] },
    });
    expect(html).toContain('survival');
    expect(html).toContain('horror');
  });
});

// ── Cover art ─────────────────────────────────────────────────────

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

  test('cover URLs are preserved in serialised data', () => {
    const html = renderScenarioSelect(null, 'station', { data: COVER_SCENARIOS });
    expect(html).toContain('the-glass-reef-atlas-front-cover.png');
    expect(html).toContain('the-glass-reef-atlas-back-cover.png');
  });
});

// ── SVG logo ──────────────────────────────────────────────────────

describe('scenario-select svgLogo', () => {
  const SVG_FIXTURE = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"/></svg>';

  test('svgLogo is preserved in serialised data', () => {
    const html = renderScenarioSelect(null, 'station', {
      data: { scenarios: [{ title: 'A', svgLogo: SVG_FIXTURE }] },
    });
    // The SVG content should be inside the JSON payload (HTML-escaped)
    expect(html).toContain('svgLogo');
  });

  test('omits svgLogo key when absent', () => {
    const html = renderScenarioSelect(null, 'station', { data: TWO_SCENARIOS });
    expect(html).not.toContain('svgLogo');
  });
});

// ── Empty state ────────────────────────────────────────────────────

describe('scenario-select empty state', () => {
  test('emits custom element with empty array when no scenarios', () => {
    const html = renderScenarioSelect(null, 'station', { data: {} });
    expect(html).toContain('<ta-scenario-select');
    expect(html).toContain('data-scenarios="[]"');
  });
});

// ── Style attribute ────────────────────────────────────────────────

describe('scenario-select data-style', () => {
  test('includes data-style attribute', () => {
    const html = renderScenarioSelect(null, 'neon', { data: TWO_SCENARIOS });
    expect(html).toContain('data-style="neon"');
  });
});
