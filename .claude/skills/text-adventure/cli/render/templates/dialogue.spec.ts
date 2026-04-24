import { describe, test, expect } from 'bun:test';
import { renderDialogue } from './dialogue';
import { createDefaultState } from '../../lib/state-store';

describe('renderDialogue', () => {
  test('renders speaker and dialogue text attributes', () => {
    const state = createDefaultState();
    const options = {
      npcName: 'Zara',
      data: {
        text: 'Hello, traveler.',
        choices: [{ label: 'Greetings', prompt: 'I say hello' }],
      },
    };
    const html = renderDialogue(state, '', options);
    expect(html).toContain('data-speaker="Zara"');
    expect(html).toContain('data-text="Hello, traveler."');
    expect(html).toContain(
      'data-choices="[{&quot;label&quot;:&quot;Greetings&quot;,&quot;prompt&quot;:&quot;I say hello&quot;}]"',
    );
  });

  test('includes fallback HTML content', () => {
    const state = createDefaultState();
    const options = {
      npcName: 'Zara',
      data: {
        text: 'Hello, traveler.',
        choices: [{ label: 'Greetings', prompt: 'I say hello' }],
      },
    };
    const html = renderDialogue(state, '', options);
    expect(html).toContain('widget-dialogue');
    expect(html).toContain('dlg-speaker');
    expect(html).toContain('Zara');
    expect(html).toContain('Hello, traveler.');
    expect(html).toContain('Greetings');
  });

  test('escapes fallback speaker, dialogue, choices, and prompt text', () => {
    const payload = '<img src=x onerror=alert("x")> "quote" &';
    const html = renderDialogue(createDefaultState(), '', {
      npcName: payload,
      data: {
        text: payload,
        choices: [{ label: payload, prompt: payload }],
      },
    });
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(&quot;x&quot;)&gt;');
    expect(html).toContain('&quot;quote&quot; &amp;');
  });
});
