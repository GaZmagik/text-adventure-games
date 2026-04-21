import { describe, test, expect } from 'bun:test';
import { renderCodex } from './codex';
import { createDefaultState } from '../../lib/state-store';

describe('renderCodex', () => {
  test('renders entries data attribute', () => {
    const state = createDefaultState();
    state.codexMutations = [
      { id: 'lore-1', title: 'Ancient Ruin', state: 'discovered' }
    ];
    const html = renderCodex(state, '');
    expect(html).toContain('data-entries="[{&quot;id&quot;:&quot;lore-1&quot;,&quot;title&quot;:&quot;Ancient Ruin&quot;,&quot;state&quot;:&quot;discovered&quot;}]"');
  });

  test('includes fallback HTML content', () => {
    const state = createDefaultState();
    state.codexMutations = [{ id: '1', title: 'Test Lore', state: 'discovered' }];
    const html = renderCodex(state, '');
    expect(html).toContain('widget-codex');
    expect(html).toContain('Test Lore');
  });

  test('escapes fallback codex entry text', () => {
    const state = createDefaultState();
    state.codexMutations = [{
      id: 'lore-1',
      title: '<img src=x onerror=alert("x")> "quote" &',
      snippet: 'Secret <img src=x onerror=alert(1)> & "quoted"',
      state: 'discovered',
    } as any];
    const html = renderCodex(state, '');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(&quot;x&quot;)&gt;');
    expect(html).toContain('&amp; &quot;quoted&quot;');
  });
});
