import { describe, test, expect } from 'bun:test';
import { splitSentences, splitParagraphs } from './text-utils';

describe('splitSentences', () => {
  test('returns empty array for empty string', () => {
    expect(splitSentences('')).toHaveLength(0);
  });

  test('returns empty array for whitespace-only string', () => {
    expect(splitSentences('   ')).toHaveLength(0);
  });

  test('splits on full stops', () => {
    expect(splitSentences('First. Second. Third.')).toHaveLength(3);
  });

  test('splits on question marks', () => {
    expect(splitSentences('What? Yes. Done.')).toHaveLength(3);
  });

  test('splits on exclamation marks', () => {
    expect(splitSentences('Stop! Go. Now.')).toHaveLength(3);
  });

  test('handles multiple spaces between sentences', () => {
    expect(splitSentences('First.   Second.')).toHaveLength(2);
  });

  test('returns single element for single sentence', () => {
    expect(splitSentences('The engine hummed.')).toHaveLength(1);
  });

  test('filters out empty-string entries', () => {
    const result = splitSentences('One. Two.');
    expect(result.every(s => s.trim().length > 0)).toBe(true);
  });
});

describe('splitParagraphs', () => {
  test('splits on double newlines', () => {
    expect(splitParagraphs('First para.\n\nSecond para.')).toHaveLength(2);
  });

  test('handles triple+ newlines', () => {
    expect(splitParagraphs('A.\n\n\n\nB.')).toHaveLength(2);
  });

  test('returns single paragraph for no breaks', () => {
    expect(splitParagraphs('Just one paragraph.')).toHaveLength(1);
  });

  test('filters empty paragraphs at start and end', () => {
    expect(splitParagraphs('\n\nContent.\n\n')).toHaveLength(1);
  });

  test('returns empty array for empty string', () => {
    expect(splitParagraphs('')).toHaveLength(0);
  });
});
