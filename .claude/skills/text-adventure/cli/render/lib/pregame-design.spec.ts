import { describe, test, expect } from 'bun:test';
import {
  renderHero,
  renderControlDeck,
  renderStageHeader,
  renderSubpanel,
  renderSummaryRow,
  renderStatusChip,
  renderBadge,
  PREGAME_DESIGN_CSS,
} from './pregame-design';

// ── renderHero ─────────────────────────────────────────────────────

describe('renderHero', () => {
  test('renders heading text', () => {
    const html = renderHero({ heading: 'Choose Your Scenario' });
    expect(html).toContain('Choose Your Scenario');
    expect(html).toContain('pd-hero');
  });

  test('renders optional kicker above heading', () => {
    const html = renderHero({ kicker: 'Phase 01', heading: 'Title' });
    expect(html).toContain('Phase 01');
    expect(html).toContain('pd-kicker');
    const kickerIdx = html.indexOf('pd-kicker');
    const headingIdx = html.indexOf('Title');
    expect(kickerIdx).toBeLessThan(headingIdx);
  });

  test('omits kicker element when not provided', () => {
    const html = renderHero({ heading: 'Title' });
    expect(html).not.toContain('pd-kicker');
  });

  test('renders optional copy paragraph', () => {
    const html = renderHero({ heading: 'Title', copy: 'Explore the void.' });
    expect(html).toContain('Explore the void.');
    expect(html).toContain('pd-hero-copy');
  });

  test('omits copy element when not provided', () => {
    const html = renderHero({ heading: 'Title' });
    expect(html).not.toContain('pd-hero-copy');
  });

  test('renders optional badges', () => {
    const html = renderHero({ heading: 'T', badges: ['Beta', 'New'] });
    expect(html).toContain('Beta');
    expect(html).toContain('New');
    expect(html).toContain('pd-hero-badges');
  });

  test('omits badges container when empty', () => {
    const html = renderHero({ heading: 'T' });
    expect(html).not.toContain('pd-hero-badges');
  });

  test('escapes HTML in all fields', () => {
    const html = renderHero({
      kicker: '<script>xss</script>',
      heading: '<b>bold</b>',
      copy: '<img onerror=alert(1)>',
      badges: ['<i>tag</i>'],
    });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<b>bold</b>');
    expect(html).not.toContain('<img onerror');
    expect(html).not.toContain('<i>tag</i>');
  });
});

// ── renderControlDeck ──────────────────────────────────────────────

describe('renderControlDeck', () => {
  test('renders selected title', () => {
    const html = renderControlDeck({
      selectedTitle: 'Cold Freight',
      actionHtml: '<button>Go</button>',
    });
    expect(html).toContain('Cold Freight');
    expect(html).toContain('pd-control-deck');
    expect(html).toContain('pd-selection-title');
  });

  test('renders optional preamble', () => {
    const html = renderControlDeck({
      selectedTitle: 'T',
      selectedPreamble: 'Your deck has gone quiet.',
      actionHtml: '',
    });
    expect(html).toContain('Your deck has gone quiet.');
    expect(html).toContain('pd-selection-preamble');
  });

  test('omits preamble when not provided', () => {
    const html = renderControlDeck({ selectedTitle: 'T', actionHtml: '' });
    expect(html).not.toContain('pd-selection-preamble');
  });

  test('renders status region with aria-live', () => {
    const html = renderControlDeck({
      selectedTitle: 'T',
      statusId: 'sel-status',
      actionHtml: '',
    });
    expect(html).toContain('id="sel-status"');
    expect(html).toContain('aria-live="polite"');
  });

  test('renders action HTML slot', () => {
    const html = renderControlDeck({
      selectedTitle: 'T',
      actionHtml: '<button class="my-btn">Launch</button>',
    });
    expect(html).toContain('<button class="my-btn">Launch</button>');
  });

  test('renders optional kicker and heading', () => {
    const html = renderControlDeck({
      kicker: 'Current lock',
      heading: 'Scenario selection',
      selectedTitle: 'T',
      actionHtml: '',
    });
    expect(html).toContain('Current lock');
    expect(html).toContain('Scenario selection');
  });

  test('escapes title and preamble', () => {
    const html = renderControlDeck({
      selectedTitle: '<script>xss</script>',
      selectedPreamble: '<img onerror=1>',
      actionHtml: '',
    });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img onerror');
  });
});

// ── renderStageHeader ──────────────────────────────────────────────

describe('renderStageHeader', () => {
  test('renders heading', () => {
    const html = renderStageHeader({ heading: 'Available Scenarios' });
    expect(html).toContain('Available Scenarios');
    expect(html).toContain('pd-stage-header');
  });

  test('renders optional kicker', () => {
    const html = renderStageHeader({ kicker: 'Scenario array', heading: 'H' });
    expect(html).toContain('Scenario array');
    expect(html).toContain('pd-kicker');
  });

  test('renders optional copy', () => {
    const html = renderStageHeader({ heading: 'H', copy: 'Pick one.' });
    expect(html).toContain('Pick one.');
    expect(html).toContain('pd-stage-copy');
  });

  test('omits optional elements when absent', () => {
    const html = renderStageHeader({ heading: 'H' });
    expect(html).not.toContain('pd-kicker');
    expect(html).not.toContain('pd-stage-copy');
  });

  test('escapes HTML in all fields', () => {
    const html = renderStageHeader({
      kicker: '<b>k</b>',
      heading: '<b>h</b>',
      copy: '<b>c</b>',
    });
    expect(html).not.toContain('<b>');
  });
});

// ── renderStatusChip ───────────────────────────────────────────────

describe('renderStatusChip', () => {
  test('renders chip with text', () => {
    const html = renderStatusChip('Beta');
    expect(html).toContain('Beta');
    expect(html).toContain('pd-status-chip');
  });

  test('escapes HTML', () => {
    const html = renderStatusChip('<script>xss</script>');
    expect(html).not.toContain('<script>');
  });
});

// ── renderBadge ────────────────────────────────────────────────────

describe('renderBadge', () => {
  test('renders badge with text', () => {
    const html = renderBadge('mystery');
    expect(html).toContain('mystery');
    expect(html).toContain('pd-badge');
  });

  test('supports featured variant', () => {
    const html = renderBadge('Flagship', 'featured');
    expect(html).toContain('pd-badge--featured');
  });

  test('supports accent variant', () => {
    const html = renderBadge('Normal', 'accent');
    expect(html).toContain('pd-badge--accent');
  });

  test('default variant has no modifier class', () => {
    const html = renderBadge('tag');
    expect(html).not.toContain('pd-badge--');
  });

  test('escapes HTML', () => {
    const html = renderBadge('<img src=x>');
    expect(html).not.toContain('<img');
  });
});

// ── renderSubpanel ─────────────────────────────────────────────────

describe('renderSubpanel', () => {
  test('renders with title and content', () => {
    const html = renderSubpanel({ title: 'Rulebook', contentHtml: '<p>cards</p>' });
    expect(html).toContain('Rulebook');
    expect(html).toContain('<p>cards</p>');
    expect(html).toContain('pd-subpanel');
  });

  test('renders optional kicker', () => {
    const html = renderSubpanel({ kicker: 'Core', title: 'T', contentHtml: '' });
    expect(html).toContain('Core');
    expect(html).toContain('pd-kicker');
  });

  test('omits kicker when absent', () => {
    const html = renderSubpanel({ title: 'T', contentHtml: '' });
    expect(html).not.toContain('pd-kicker');
  });

  test('renders optional copy', () => {
    const html = renderSubpanel({ title: 'T', copy: 'Pick one.', contentHtml: '' });
    expect(html).toContain('Pick one.');
    expect(html).toContain('pd-subpanel-copy');
  });

  test('omits copy when absent', () => {
    const html = renderSubpanel({ title: 'T', contentHtml: '' });
    expect(html).not.toContain('pd-subpanel-copy');
  });

  test('escapes HTML in text fields', () => {
    const html = renderSubpanel({ kicker: '<b>k</b>', title: '<b>t</b>', copy: '<b>c</b>', contentHtml: '' });
    expect(html).not.toContain('<b>');
  });

  test('does not escape contentHtml (raw slot)', () => {
    const html = renderSubpanel({ title: 'T', contentHtml: '<button class="my-btn">Go</button>' });
    expect(html).toContain('<button class="my-btn">Go</button>');
  });
});

// ── renderSummaryRow ───────────────────────────────────────────────

describe('renderSummaryRow', () => {
  test('renders label and value', () => {
    const html = renderSummaryRow('Rulebook', 'd20 system');
    expect(html).toContain('Rulebook');
    expect(html).toContain('d20 system');
    expect(html).toContain('pd-summary-row');
  });

  test('renders placeholder when no value', () => {
    const html = renderSummaryRow('Difficulty');
    expect(html).toContain('Difficulty');
    expect(html).toContain('pd-summary-value');
  });

  test('escapes HTML', () => {
    const html = renderSummaryRow('<b>L</b>', '<b>V</b>');
    expect(html).not.toContain('<b>');
  });
});

// ── PREGAME_DESIGN_CSS ─────────────────────────────────────────────

describe('PREGAME_DESIGN_CSS', () => {
  test('is a non-empty string', () => {
    expect(typeof PREGAME_DESIGN_CSS).toBe('string');
    expect(PREGAME_DESIGN_CSS.length).toBeGreaterThan(100);
  });

  test('contains key structural selectors', () => {
    expect(PREGAME_DESIGN_CSS).toContain('.pd-hero');
    expect(PREGAME_DESIGN_CSS).toContain('.pd-control-deck');
    expect(PREGAME_DESIGN_CSS).toContain('.pd-stage-header');
    expect(PREGAME_DESIGN_CSS).toContain('.pd-status-chip');
    expect(PREGAME_DESIGN_CSS).toContain('.pd-badge');
    expect(PREGAME_DESIGN_CSS).toContain('.pd-kicker');
    expect(PREGAME_DESIGN_CSS).toContain('.pd-selection-title');
    expect(PREGAME_DESIGN_CSS).toContain('.pd-subpanel');
    expect(PREGAME_DESIGN_CSS).toContain('.pd-summary-row');
  });

  test('uses theme-agnostic CSS variables', () => {
    expect(PREGAME_DESIGN_CSS).toContain('--ta-font-heading');
    expect(PREGAME_DESIGN_CSS).toContain('--ta-color-accent');
    expect(PREGAME_DESIGN_CSS).toContain('--sta-text-primary');
  });

  test('includes reduced-motion rule', () => {
    expect(PREGAME_DESIGN_CSS).toContain('prefers-reduced-motion');
  });
});
