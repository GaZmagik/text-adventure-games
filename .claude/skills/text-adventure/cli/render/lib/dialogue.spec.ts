import { describe, test, expect } from 'bun:test';
import { renderMultiDialogue } from './dialogue';

// ── Helpers ──────────────────────────────────────────────────────────

function makeSpeaker(id: string, name: string, cssVar?: string) {
  return cssVar ? { id, name, cssVar } : { id, name };
}

// ── Wrapper ───────────────────────────────────────────────────────────

describe('renderMultiDialogue wrapper', () => {
  test('renders a div.multi-dialogue wrapper', () => {
    const html = renderMultiDialogue({ speakers: [], blocks: [] });
    expect(html).toContain('class="multi-dialogue"');
  });
});

// ── Prose blocks ─────────────────────────────────────────────────────

describe('renderMultiDialogue prose blocks', () => {
  test('renders prose block as div.dialogue-prose', () => {
    const html = renderMultiDialogue({
      speakers: [],
      blocks: [{ type: 'prose', text: 'The room falls silent.' }],
    });
    expect(html).toContain('class="dialogue-prose"');
    expect(html).toContain('The room falls silent.');
  });

  test('escapes HTML in prose text', () => {
    const html = renderMultiDialogue({
      speakers: [],
      blocks: [{ type: 'prose', text: '<script>alert(1)</script>' }],
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  test('renders multiple prose blocks in order', () => {
    const html = renderMultiDialogue({
      speakers: [],
      blocks: [
        { type: 'prose', text: 'First.' },
        { type: 'prose', text: 'Second.' },
      ],
    });
    const firstPos = html.indexOf('First.');
    const secondPos = html.indexOf('Second.');
    expect(firstPos).toBeGreaterThan(-1);
    expect(secondPos).toBeGreaterThan(firstPos);
  });
});

// ── Dialogue blocks ───────────────────────────────────────────────────

describe('renderMultiDialogue dialogue blocks', () => {
  test('renders dialogue block with div.dialogue-line', () => {
    const html = renderMultiDialogue({
      speakers: [makeSpeaker('cass', 'Cass')],
      blocks: [{ type: 'dialogue', speakerId: 'cass', text: 'We need to move.' }],
    });
    expect(html).toContain('class="dialogue-line"');
  });

  test('renders speaker name in span.speaker-name', () => {
    const html = renderMultiDialogue({
      speakers: [makeSpeaker('cass', 'Cass')],
      blocks: [{ type: 'dialogue', speakerId: 'cass', text: 'We need to move.' }],
    });
    expect(html).toContain('class="speaker-name"');
    expect(html).toContain('Cass');
  });

  test('renders dialogue text in span.speaker-text', () => {
    const html = renderMultiDialogue({
      speakers: [makeSpeaker('cass', 'Cass')],
      blocks: [{ type: 'dialogue', speakerId: 'cass', text: 'We need to move.' }],
    });
    expect(html).toContain('class="speaker-text"');
    expect(html).toContain('We need to move.');
  });

  test('escapes HTML in dialogue text', () => {
    const html = renderMultiDialogue({
      speakers: [makeSpeaker('x', 'X')],
      blocks: [{ type: 'dialogue', speakerId: 'x', text: '<b>bold</b>' }],
    });
    expect(html).not.toContain('<b>');
    expect(html).toContain('&lt;b&gt;');
  });

  test('escapes HTML in speaker name', () => {
    const html = renderMultiDialogue({
      speakers: [makeSpeaker('x', '<Evil>')],
      blocks: [{ type: 'dialogue', speakerId: 'x', text: 'Hi.' }],
    });
    expect(html).not.toContain('<Evil>');
    expect(html).toContain('&lt;Evil&gt;');
  });
});

// ── Speaker colour assignment ─────────────────────────────────────────

describe('renderMultiDialogue speaker colours', () => {
  test('auto-assigns --speaker-color-0 to first speaker', () => {
    const html = renderMultiDialogue({
      speakers: [makeSpeaker('a', 'A')],
      blocks: [{ type: 'dialogue', speakerId: 'a', text: 'Hi.' }],
    });
    expect(html).toContain('var(--speaker-color-0)');
  });

  test('auto-assigns --speaker-color-1 to second speaker', () => {
    const html = renderMultiDialogue({
      speakers: [makeSpeaker('a', 'A'), makeSpeaker('b', 'B')],
      blocks: [
        { type: 'dialogue', speakerId: 'a', text: 'Hi.' },
        { type: 'dialogue', speakerId: 'b', text: 'Hello.' },
      ],
    });
    expect(html).toContain('var(--speaker-color-0)');
    expect(html).toContain('var(--speaker-color-1)');
  });

  test('wraps palette at index 6', () => {
    const speakers = Array.from({ length: 7 }, (_, i) => makeSpeaker(`s${i}`, `S${i}`));
    const blocks = speakers.map(s => ({ type: 'dialogue' as const, speakerId: s.id, text: '...' }));
    const html = renderMultiDialogue({ speakers, blocks });
    // 7th speaker (index 6) wraps to --speaker-color-0
    const matches = [...html.matchAll(/var\(--speaker-color-0\)/g)];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  test('respects cssVar override', () => {
    const html = renderMultiDialogue({
      speakers: [makeSpeaker('a', 'A', '--speaker-color-5')],
      blocks: [{ type: 'dialogue', speakerId: 'a', text: 'Hi.' }],
    });
    expect(html).toContain('var(--speaker-color-5)');
    expect(html).not.toContain('var(--speaker-color-0)');
  });
});

// ── Choices ───────────────────────────────────────────────────────────

describe('renderMultiDialogue choices', () => {
  test('renders no choices section when choices is empty', () => {
    const html = renderMultiDialogue({ speakers: [], blocks: [], choices: [] });
    expect(html).not.toContain('dialogue-choices');
  });

  test('renders choices as action buttons with data-prompt', () => {
    const html = renderMultiDialogue({
      speakers: [],
      blocks: [],
      choices: [{ label: 'Leave quietly.', prompt: 'I leave the room without a word.' }],
    });
    expect(html).toContain('class="dialogue-choices"');
    expect(html).toContain('data-prompt=');
    expect(html).toContain('Leave quietly.');
  });

  test('escapes prompt and label in choice buttons', () => {
    const html = renderMultiDialogue({
      speakers: [],
      blocks: [],
      choices: [{ label: '<bold>', prompt: '<script>' }],
    });
    expect(html).not.toContain('<bold>');
    expect(html).not.toContain('<script>');
  });
});

// ── Edge cases ────────────────────────────────────────────────────────

describe('renderMultiDialogue edge cases', () => {
  test('omits dialogue block gracefully when speakerId not found in speakers', () => {
    const html = renderMultiDialogue({
      speakers: [makeSpeaker('known', 'Known')],
      blocks: [{ type: 'dialogue', speakerId: 'unknown', text: 'Ghost line.' }],
    });
    // Should not throw; 'Ghost line.' either rendered or omitted — either is acceptable
    expect(typeof html).toBe('string');
  });

  test('renders prose-only blocks with empty speakers array', () => {
    const html = renderMultiDialogue({
      speakers: [],
      blocks: [{ type: 'prose', text: 'Silence settled.' }],
    });
    expect(html).toContain('Silence settled.');
    expect(html).not.toContain('dialogue-line');
  });
});
