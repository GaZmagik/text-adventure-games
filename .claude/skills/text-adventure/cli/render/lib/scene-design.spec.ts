import { describe, test, expect } from 'bun:test';
import {
  renderSceneChapterHeader,
  renderSceneMetaStrip,
  renderSceneDivider,
  renderSceneQuote,
  renderChoiceStage,
  renderRollMetric,
  renderRollResultBanner,
  SCENE_DESIGN_CSS,
} from './scene-design';

// ── renderSceneChapterHeader ──────────────────────────────────────

describe('renderSceneChapterHeader', () => {
  test('renders title', () => {
    const html = renderSceneChapterHeader({ title: 'Scene One' });
    expect(html).toContain('Scene One');
    expect(html).toContain('sc-chapter-header');
    expect(html).toContain('sc-chapter-title');
  });

  test('renders optional kicker above title', () => {
    const html = renderSceneChapterHeader({ kicker: 'Scene file // 01', title: 'Opening' });
    expect(html).toContain('Scene file // 01');
    expect(html).toContain('sc-kicker');
    const kickerIdx = html.indexOf('sc-kicker');
    const titleIdx = html.indexOf('Opening');
    expect(kickerIdx).toBeLessThan(titleIdx);
  });

  test('renders optional dek paragraph', () => {
    const html = renderSceneChapterHeader({ title: 'T', dek: 'The thread tightens.' });
    expect(html).toContain('The thread tightens.');
    expect(html).toContain('sc-dek');
  });

  test('omits kicker and dek when absent', () => {
    const html = renderSceneChapterHeader({ title: 'T' });
    expect(html).not.toContain('sc-kicker');
    expect(html).not.toContain('sc-dek');
  });

  test('escapes HTML in all fields', () => {
    const html = renderSceneChapterHeader({
      kicker: '<script>xss</script>',
      title: '<b>bold</b>',
      dek: '<img onerror=1>',
    });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<b>bold</b>');
    expect(html).not.toContain('<img onerror');
  });
});

// ── renderSceneMetaStrip ──────────────────────────────────────────

describe('renderSceneMetaStrip', () => {
  test('renders cards with label and value', () => {
    const html = renderSceneMetaStrip([
      { label: 'Location', value: 'Pilgrim Dock' },
      { label: 'Pressure', value: 'Measured threat' },
    ]);
    expect(html).toContain('Pilgrim Dock');
    expect(html).toContain('Measured threat');
    expect(html).toContain('sc-meta-strip');
    expect(html).toContain('sc-meta-card');
    expect(html).toContain('sc-meta-label');
    expect(html).toContain('sc-meta-value');
  });

  test('renders correct number of cards', () => {
    const html = renderSceneMetaStrip([
      { label: 'A', value: '1' },
      { label: 'B', value: '2' },
      { label: 'C', value: '3' },
    ]);
    const count = (html.match(/sc-meta-card/g) ?? []).length;
    expect(count).toBe(3);
  });

  test('renders empty strip gracefully', () => {
    const html = renderSceneMetaStrip([]);
    expect(html).toContain('sc-meta-strip');
  });

  test('escapes HTML in labels and values', () => {
    const html = renderSceneMetaStrip([
      { label: '<b>L</b>', value: '<i>V</i>' },
    ]);
    expect(html).not.toContain('<b>');
    expect(html).not.toContain('<i>');
  });
});

// ── renderSceneDivider ────────────────────────────────────────────

describe('renderSceneDivider', () => {
  test('renders SVG divider', () => {
    const html = renderSceneDivider();
    expect(html).toContain('sc-divider');
    expect(html).toContain('<svg');
    expect(html).toContain('</svg>');
  });

  test('is aria-hidden', () => {
    const html = renderSceneDivider();
    expect(html).toContain('aria-hidden="true"');
  });
});

// ── renderSceneQuote ──────────────────────────────────────────────

describe('renderSceneQuote', () => {
  test('renders blockquote with text', () => {
    const html = renderSceneQuote('Some places announce themselves with light.');
    expect(html).toContain('Some places announce themselves with light.');
    expect(html).toContain('sc-quote');
    expect(html).toContain('<blockquote');
  });

  test('escapes HTML', () => {
    const html = renderSceneQuote('<script>xss</script>');
    expect(html).not.toContain('<script>');
  });
});

// ── renderChoiceStage ─────────────────────────────────────────────

describe('renderChoiceStage', () => {
  test('renders heading and content slot', () => {
    const html = renderChoiceStage({
      heading: 'How do you move first?',
      contentHtml: '<div class="my-grid">choices here</div>',
    });
    expect(html).toContain('How do you move first?');
    expect(html).toContain('choices here');
    expect(html).toContain('sc-choice-stage');
  });

  test('renders optional kicker', () => {
    const html = renderChoiceStage({
      kicker: 'Decision lattice',
      heading: 'Choose',
      contentHtml: '',
    });
    expect(html).toContain('Decision lattice');
    expect(html).toContain('sc-kicker');
  });

  test('renders optional copy', () => {
    const html = renderChoiceStage({
      heading: 'Choose',
      copy: 'Pick a thread to pull.',
      contentHtml: '',
    });
    expect(html).toContain('Pick a thread to pull.');
  });

  test('renders aria-live status region', () => {
    const html = renderChoiceStage({ heading: 'H', contentHtml: '' });
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('sc-choice-status');
  });

  test('does not escape contentHtml (raw slot)', () => {
    const html = renderChoiceStage({
      heading: 'H',
      contentHtml: '<button class="pick">Go</button>',
    });
    expect(html).toContain('<button class="pick">Go</button>');
  });

  test('escapes text fields', () => {
    const html = renderChoiceStage({
      kicker: '<b>k</b>',
      heading: '<b>h</b>',
      copy: '<b>c</b>',
      contentHtml: '',
    });
    expect(html).not.toContain('<b>');
  });
});

// ── renderRollMetric ──────────────────────────────────────────────

describe('renderRollMetric', () => {
  test('renders label and value', () => {
    const html = renderRollMetric('Tested attribute', 'Empathy');
    expect(html).toContain('Tested attribute');
    expect(html).toContain('Empathy');
    expect(html).toContain('sc-roll-metric');
  });

  test('escapes HTML', () => {
    const html = renderRollMetric('<b>L</b>', '<b>V</b>');
    expect(html).not.toContain('<b>');
  });
});

// ── renderRollResultBanner ────────────────────────────────────────

describe('renderRollResultBanner', () => {
  test('renders banner with state and text', () => {
    const html = renderRollResultBanner('success', 'You cleared the threshold.');
    expect(html).toContain('You cleared the threshold.');
    expect(html).toContain('sc-roll-result');
    expect(html).toContain('data-state="success"');
  });

  test('renders pending state', () => {
    const html = renderRollResultBanner('pending', 'No roll resolved yet.');
    expect(html).toContain('data-state="pending"');
  });

  test('has aria-live for dynamic updates', () => {
    const html = renderRollResultBanner('pending', 'Waiting');
    expect(html).toContain('aria-live="polite"');
  });

  test('escapes HTML in text', () => {
    const html = renderRollResultBanner('success', '<script>xss</script>');
    expect(html).not.toContain('<script>');
  });

  test('escapes HTML in state attribute', () => {
    const html = renderRollResultBanner('" onclick="alert(1)', 'text');
    // The " is escaped to &quot; so the attribute can't break out
    expect(html).toContain('&quot;');
    expect(html).not.toContain('data-state="" onclick');
  });
});

// ── SCENE_DESIGN_CSS ──────────────────────────────────────────────

describe('SCENE_DESIGN_CSS', () => {
  test('is a non-empty string', () => {
    expect(typeof SCENE_DESIGN_CSS).toBe('string');
    expect(SCENE_DESIGN_CSS.length).toBeGreaterThan(100);
  });

  test('contains scene chapter selectors', () => {
    expect(SCENE_DESIGN_CSS).toContain('.sc-chapter-header');
    expect(SCENE_DESIGN_CSS).toContain('.sc-chapter-title');
    expect(SCENE_DESIGN_CSS).toContain('.sc-kicker');
    expect(SCENE_DESIGN_CSS).toContain('.sc-dek');
  });

  test('contains scene meta strip selectors', () => {
    expect(SCENE_DESIGN_CSS).toContain('.sc-meta-strip');
    expect(SCENE_DESIGN_CSS).toContain('.sc-meta-card');
    expect(SCENE_DESIGN_CSS).toContain('.sc-meta-label');
    expect(SCENE_DESIGN_CSS).toContain('.sc-meta-value');
  });

  test('contains scene divider and quote selectors', () => {
    expect(SCENE_DESIGN_CSS).toContain('.sc-divider');
    expect(SCENE_DESIGN_CSS).toContain('.sc-quote');
  });

  test('contains choice stage selectors', () => {
    expect(SCENE_DESIGN_CSS).toContain('.sc-choice-stage');
    expect(SCENE_DESIGN_CSS).toContain('.sc-choice-status');
  });

  test('contains roll chamber selectors', () => {
    expect(SCENE_DESIGN_CSS).toContain('.sc-roll-metric');
    expect(SCENE_DESIGN_CSS).toContain('.sc-roll-result');
  });

  test('uses theme-agnostic CSS variables', () => {
    expect(SCENE_DESIGN_CSS).toContain('--ta-font-heading');
    expect(SCENE_DESIGN_CSS).toContain('--sta-text-primary');
    expect(SCENE_DESIGN_CSS).toContain('--ta-color-accent');
  });

  test('includes reduced-motion rule', () => {
    expect(SCENE_DESIGN_CSS).toContain('prefers-reduced-motion');
  });
});
