import { describe, test, expect } from 'bun:test';
import { renderSettings } from './settings';

describe('renderSettings default backfill', () => {
  test('appends missing modules when GM provides a subset', () => {
    const html = renderSettings(null, '', {
      data: { modules: ['save-codex', 'bestiary'] },
    });
    // GM's picks should be present
    expect(html).toContain('data-value="save-codex"');
    expect(html).toContain('data-value="bestiary"');
    // Defaults the GM omitted should also appear
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
