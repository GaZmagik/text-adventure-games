import { describe, test, expect } from 'bun:test';
import { renderSettings } from './settings';

// ── Existing backfill contract ─────────────────────────────────────

describe('renderSettings default backfill', () => {
  test('appends missing modules when GM provides a subset', () => {
    const html = renderSettings(null, '', {
      data: { modules: ['save-codex', 'bestiary'] },
    });
    expect(html).toContain('data-value="save-codex"');
    expect(html).toContain('data-value="bestiary"');
    expect(html).toContain('data-value="ship-systems"');
    expect(html).toContain('data-value="adventure-exporting"');
    expect(html).toContain('data-value="star-chart"');
  });

  test('appends missing rulebooks when GM provides a subset', () => {
    const html = renderSettings(null, '', {
      data: { rulebooks: ['d20_system'] },
    });
    expect(html).toContain('data-value="d20_system"');
    expect(html).toContain('data-value="narrative_engine"');
    expect(html).toContain('data-value="pf2e_lite"');
  });

  test('appends missing visual styles when GM provides a subset', () => {
    const html = renderSettings(null, '', {
      data: { visualStyles: ['terminal', 'neon'] },
    });
    expect(html).toContain('data-value="terminal"');
    expect(html).toContain('data-value="neon"');
    expect(html).toContain('data-value="parchment"');
    expect(html).toContain('data-value="holographic"');
  });

  test('shows full defaults when GM provides nothing', () => {
    const html = renderSettings(null, '', {});
    expect(html).toContain('data-value="d20_system"');
    expect(html).toContain('data-value="narrative_engine"');
    expect(html).toContain('data-value="ship-systems"');
    expect(html).toContain('data-value="adventure-exporting"');
    expect(html).toContain('data-value="holographic"');
  });

  test('does not duplicate items already in GM list', () => {
    const html = renderSettings(null, '', {
      data: { modules: ['save-codex', 'bestiary', 'ship-systems'] },
    });
    const matches = html.match(/data-value="ship-systems"/g);
    expect(matches).toHaveLength(1);
  });

  test('confirm script copies synthesized prompt when sendPrompt is unavailable', () => {
    const html = renderSettings(null, '', {});
    expect(html).toContain("document.execCommand('copy')");
    expect(html).toContain("btn.textContent = copied ? 'Copied! Paste as your reply.' : 'Copy the prompt from the tooltip.';");
    expect(html).toContain("btn.setAttribute('title', prompt)");
  });
});

// ── Hero section ───────────────────────────────────────────────────

describe('settings hero', () => {
  test('renders hero section', () => {
    const html = renderSettings(null, '', {});
    expect(html).toContain('pd-hero');
    expect(html).toContain('pd-hero-heading');
  });

  test('hero appears before option groups', () => {
    const html = renderSettings(null, '', {});
    const heroIdx = html.indexOf('pd-hero');
    const groupIdx = html.indexOf('data-group=');
    expect(heroIdx).toBeLessThan(groupIdx);
  });
});

// ── Control deck ───────────────────────────────────────────────────

describe('settings control deck', () => {
  test('renders control deck with summary', () => {
    const html = renderSettings(null, '', {});
    expect(html).toContain('pd-control-deck');
    expect(html).toContain('pd-selection-title');
  });

  test('control deck has aria-live status region', () => {
    const html = renderSettings(null, '', {});
    expect(html).toContain('aria-live="polite"');
  });

  test('control deck appears between hero and subpanels', () => {
    const html = renderSettings(null, '', {});
    const heroIdx = html.indexOf('<header class="pd-hero"');
    const deckIdx = html.indexOf('<section class="pd-control-deck"');
    const subpanelIdx = html.indexOf('<article class="pd-subpanel">');
    expect(heroIdx).toBeLessThan(deckIdx);
    expect(deckIdx).toBeLessThan(subpanelIdx);
  });

  test('shows default selections when defaults provided', () => {
    const html = renderSettings(null, '', {
      data: { defaults: { rulebook: 'd20_system', difficulty: 'normal' } },
    });
    const deckStart = html.indexOf('<section class="pd-control-deck"');
    const deckEnd = html.indexOf('</section>', deckStart);
    const deck = html.slice(deckStart, deckEnd);
    expect(deck).toContain('pd-summary-row');
  });
});

// ── Subpanel grouping ──────────────────────────────────────────────

describe('settings subpanels', () => {
  test('wraps option groups in subpanels', () => {
    const html = renderSettings(null, '', {});
    expect(html).toContain('pd-subpanel');
    // At least rulebook, difficulty, pacing, visual style, modules = 5 groups
    const subpanelCount = (html.match(/<article class="pd-subpanel">/g) ?? []).length;
    expect(subpanelCount).toBeGreaterThanOrEqual(5);
  });

  test('subpanels have titles for each group', () => {
    const html = renderSettings(null, '', {});
    expect(html).toContain('pd-subpanel-title');
  });
});

// ── Verify-safe structure ──────────────────────────────────────────

describe('settings verify safety', () => {
  test('retains settings-confirm button', () => {
    const html = renderSettings(null, '', {});
    expect(html).toContain('settings-confirm');
  });

  test('retains data-group attributes for at least 2 groups', () => {
    const html = renderSettings(null, '', {});
    const groups = [...html.matchAll(/data-group="([^"]+)"/g)].map(m => m[1]);
    const unique = new Set(groups);
    expect(unique.size).toBeGreaterThanOrEqual(2);
  });

  test('retains widget-settings class', () => {
    const html = renderSettings(null, '', {});
    expect(html).toContain('widget-settings');
  });
});

// ── Script interaction ─────────────────────────────────────────────

describe('settings script interaction', () => {
  test('script updates summary on selection change', () => {
    const html = renderSettings(null, '', {});
    // Script should reference the summary row update IDs
    expect(html).toContain('pd-sel-title');
  });

  test('module toggle script preserved', () => {
    const html = renderSettings(null, '', {});
    expect(html).toContain('module-check');
    expect(html).toContain('selectedModules');
  });
});
