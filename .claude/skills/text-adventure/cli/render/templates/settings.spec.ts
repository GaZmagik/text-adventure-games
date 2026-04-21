import { describe, test, expect } from 'bun:test';
import { renderSettings } from './settings';

describe('renderSettings', () => {
  test('emits a <ta-settings> custom element', () => {
    const html = renderSettings(null, 'station', { data: {} });
    expect(html).toContain('<ta-settings');
    expect(html).toContain('</ta-settings>');
  });

  test('includes data-config attribute with JSON payload', () => {
    const html = renderSettings(null, 'station', { data: {} });
    expect(html).toContain('data-config="');
  });

  test('includes CDN script tag for ta-components.js', () => {
    const html = renderSettings(null, 'station', { data: {} });
    expect(html).toContain('ta-components.js');
    expect(html).toContain('<script src="');
  });

  test('includes CSS URLs for style, common-widget, and pregame-design', () => {
    const html = renderSettings(null, 'station', { data: {} });
    expect(html).toContain('station.css');
    expect(html).toContain('common-widget.css');
    expect(html).toContain('pregame-design.css');
  });
});

describe('settings config serialisation', () => {
  test('serialises default rulebooks into config', () => {
    const html = renderSettings(null, 'station', { data: {} });
    expect(html).toContain('d20_system');
    expect(html).toContain('dnd_5e');
  });

  test('serialises default difficulties into config', () => {
    const html = renderSettings(null, 'station', { data: {} });
    expect(html).toContain('easy');
    expect(html).toContain('normal');
    expect(html).toContain('hard');
    expect(html).toContain('brutal');
  });

  test('serialises default visual styles into config', () => {
    const html = renderSettings(null, 'station', { data: {} });
    expect(html).toContain('station');
    expect(html).toContain('terminal');
    expect(html).toContain('parchment');
  });

  test('merges provided options with defaults', () => {
    const html = renderSettings(null, 'station', {
      data: { rulebooks: ['homebrew'] },
    });
    expect(html).toContain('homebrew');
    expect(html).toContain('d20_system');
  });

  test('includes tier1Modules in config', () => {
    const html = renderSettings(null, 'station', { data: {} });
    expect(html).toContain('gm-checklist');
    expect(html).toContain('prose-craft');
    expect(html).toContain('core-systems');
  });

  test('preserves defaults in config when provided', () => {
    const html = renderSettings(null, 'station', {
      data: { defaults: { rulebook: 'dnd_5e', difficulty: 'hard' } },
    });
    const match = html.match(/data-config="([^"]*)"/);
    expect(match).not.toBeNull();
    const raw = match![1]!.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
    const parsed = JSON.parse(raw);
    expect(parsed.defaults.rulebook).toBe('dnd_5e');
    expect(parsed.defaults.difficulty).toBe('hard');
  });
});

describe('settings data-style', () => {
  test('includes data-style attribute', () => {
    const html = renderSettings(null, 'neon', { data: {} });
    expect(html).toContain('data-style="neon"');
  });
});

describe('settings backward compat', () => {
  test('rules works as alias for rulebooks', () => {
    const html = renderSettings(null, 'station', {
      data: { rules: ['custom_rules'] },
    });
    expect(html).toContain('custom_rules');
  });

  test('difficulty works as alias for difficulties', () => {
    const html = renderSettings(null, 'station', {
      data: { difficulty: ['nightmare'] },
    });
    expect(html).toContain('nightmare');
  });

  test('styles works as alias for visualStyles', () => {
    const html = renderSettings(null, 'station', {
      data: { styles: ['custom_style'] },
    });
    expect(html).toContain('custom_style');
  });
});

describe('settings modules', () => {
  test('includes default modules in config', () => {
    const html = renderSettings(null, 'station', { data: {} });
    expect(html).toContain('bestiary');
    expect(html).toContain('audio');
    expect(html).toContain('adventure-exporting');
  });

  test('merges provided modules with defaults', () => {
    const html = renderSettings(null, 'station', {
      data: { modules: ['custom-module'] },
    });
    expect(html).toContain('custom-module');
    expect(html).toContain('bestiary');
  });

  test('toStringArray handles objects with name or label', () => {
    const options = {
      data: {
        rulebooks: [{ name: 'Custom Rules' }],
        difficulties: [{ label: 'Insane' }],
        visualStyles: [123], // Fallback to String()
      }
    };
    const html = renderSettings(null, '', options);
    expect(html).toContain('Custom Rules');
    expect(html).toContain('Insane');
    expect(html).toContain('123');
  });
});
