import { describe, it, expect } from 'bun:test';
import { wrapInShadowDom } from './shadow-wrapper';
import { JS_MANIFEST } from '../../../assets/cdn-manifest.ts';

describe('wrapInShadowDom', () => {
  const minimalOpts = {
    styleName: 'station',
    html: '<div class="panel">Hello</div>',
  };

  it('returns a string containing attachShadow', () => {
    const result = wrapInShadowDom(minimalOpts);
    expect(result).toContain('attachShadow');
  });

  it('output contains CDN link with correct URL for given style name', () => {
    const result = wrapInShadowDom(minimalOpts);
    expect(result).toContain('/css/station.css');
  });

  it('output contains cache-busting hash from manifest', () => {
    const result = wrapInShadowDom(minimalOpts);
    // station hash from manifest (changes when CSS is rebuilt)
    expect(result).toContain('?v=71810467');
  });

  it('output contains the :host override block', () => {
    const result = wrapInShadowDom(minimalOpts);
    expect(result).toContain(':host{display:block;');
    expect(result).toContain('var(--sta-bg-primary,#1A1D2E)');
    expect(result).toContain('var(--sta-font-mono,monospace)');
    expect(result).toContain('.root{background:inherit;color:inherit;}');
  });

  it('optional inlineCss is injected when provided', () => {
    const result = wrapInShadowDom({
      ...minimalOpts,
      inlineCss: '.custom { color: red; }',
    });
    expect(result).toContain('.custom { color: red; }');
    expect(result).toContain('widgetStyle');
  });

  it('optional inlineCss is omitted when not provided', () => {
    const result = wrapInShadowDom(minimalOpts);
    expect(result).not.toContain('widgetStyle');
  });

  it('optional script is injected when provided', () => {
    const result = wrapInShadowDom({
      ...minimalOpts,
      script: 'shadow.querySelector(".panel").click();',
    });
    expect(result).toContain('shadow.querySelector(".panel").click();');
  });

  it('optional scriptSrc URLs are loaded as script elements', () => {
    const result = wrapInShadowDom({
      ...minimalOpts,
      scriptSrc: [
        'https://cdn.jsdelivr.net/gh/GaZmagik/text-adventure-games/.claude/skills/text-adventure/assets/js/tag-scene.js',
        'https://cdn.example.com/extra.js',
      ],
    });
    expect(result).toContain(`tag-scene.js?v=${JS_MANIFEST['tag-scene.js']}`);
    expect(result).toContain('https://cdn.example.com/extra.js');
    // Should create script elements, not link elements
    expect(result).toContain("createElement('script')");
  });

  it('HTML content is inside the shadow root', () => {
    const result = wrapInShadowDom(minimalOpts);
    // Content is set via innerHTML on a div appended to shadow
    expect(result).toContain('shadow.appendChild(content)');
    expect(result).toContain('<div class="panel">Hello</div>');
  });

  it('backticks in HTML content are escaped', () => {
    const result = wrapInShadowDom({
      ...minimalOpts,
      html: '<code>`backtick`</code>',
    });
    // Backticks must be escaped inside the template literal
    expect(result).toContain('\\`backtick\\`');
    expect(result).not.toContain('`backtick`');
  });

  it('${ in HTML content is escaped', () => {
    const result = wrapInShadowDom({
      ...minimalOpts,
      html: '<span>${injection}</span>',
    });
    // ${ must be escaped to prevent template literal interpolation
    expect(result).toContain('\\${injection}');
  });

  it('unknown style name produces output with HTML comment warning', () => {
    const result = wrapInShadowDom({
      styleName: 'nonexistent-theme',
      html: '<p>test</p>',
    });
    expect(result).toContain('<!-- WARNING:');
    expect(result).toContain('nonexistent-theme');
    // Should still produce valid output (override block present)
    expect(result).toContain('attachShadow');
    expect(result).toContain(':host{display:block;');
    // Should NOT contain a CDN link element
    expect(result).not.toContain('/css/nonexistent-theme.css');
  });

  it('the shadow variable is available to inline scripts', () => {
    const result = wrapInShadowDom({
      ...minimalOpts,
      script: 'console.log(shadow);',
    });
    // The var shadow = ... line must appear before the inline script
    const shadowDeclIdx = result.indexOf('var shadow=');
    const scriptIdx = result.indexOf('console.log(shadow);');
    expect(shadowDeclIdx).toBeGreaterThan(-1);
    expect(scriptIdx).toBeGreaterThan(-1);
    expect(shadowDeclIdx).toBeLessThan(scriptIdx);
  });
});
