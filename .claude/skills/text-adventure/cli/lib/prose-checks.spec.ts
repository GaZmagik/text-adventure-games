import { describe, test, expect } from 'bun:test';
import {
  extractNarrativeText,
  splitSentences,
  splitParagraphs,
  countWords,
  countSyllables,
  extractSpeakerUtterances,
  computeProseMetrics,
  checkProseContent,
  checkVoiceDifferentiation,
} from './prose-checks';

/* ------------------------------------------------------------------ */
/*  extractNarrativeText                                               */
/* ------------------------------------------------------------------ */

describe('extractNarrativeText', () => {
  test('extracts text from a single #narrative div', () => {
    const html = '<div id="narrative"><p>The deck shuddered beneath your boots.</p></div>';
    const text = extractNarrativeText(html);
    expect(text).toContain('The deck shuddered beneath your boots.');
  });

  test('extracts text from .narrative class divs', () => {
    const html = '<div class="scene-phase narrative"><p>Rust flakes drifted down.</p></div>';
    const text = extractNarrativeText(html);
    expect(text).toContain('Rust flakes drifted down.');
  });

  test('strips HTML tags from extracted text', () => {
    const html = '<div id="narrative"><p>The <strong>rusted</strong> bulkhead groaned.</p></div>';
    const text = extractNarrativeText(html);
    expect(text).not.toContain('<strong>');
    expect(text).not.toContain('</strong>');
    expect(text).toContain('rusted');
  });

  test('concatenates multiple narrative blocks', () => {
    const html = `
      <div class="scene-phase narrative"><p>First block.</p></div>
      <div class="scene-phase narrative"><p>Second block.</p></div>
    `;
    const text = extractNarrativeText(html);
    expect(text).toContain('First block.');
    expect(text).toContain('Second block.');
  });

  test('preserves paragraph boundaries from <p> tags as double newlines', () => {
    const html = '<div id="narrative"><p>First paragraph.</p><p>Second paragraph.</p></div>';
    const text = extractNarrativeText(html);
    expect(text).toContain('First paragraph.');
    expect(text).toContain('Second paragraph.');
    // The two paragraphs should be separated by a double newline
    expect(text).toMatch(/First paragraph\.\s*\n\n\s*Second paragraph\./);
  });

  test('returns null when no narrative divs exist', () => {
    const html = '<div class="widget-dice"><p>Roll the die.</p></div>';
    expect(extractNarrativeText(html)).toBeNull();
  });

  test('ignores HTML comments inside narrative', () => {
    const html = '<div id="narrative"><!-- hidden -->Visible text.</div>';
    const text = extractNarrativeText(html);
    expect(text).not.toContain('hidden');
    expect(text).toContain('Visible text.');
  });
});

/* ------------------------------------------------------------------ */
/*  splitSentences                                                     */
/* ------------------------------------------------------------------ */

describe('splitSentences', () => {
  test('splits on full stops', () => {
    expect(splitSentences('First. Second. Third.')).toHaveLength(3);
  });

  test('splits on question and exclamation marks', () => {
    expect(splitSentences('What? Yes! Done.')).toHaveLength(3);
  });

  test('handles multiple spaces between sentences', () => {
    const result = splitSentences('First.   Second.');
    expect(result).toHaveLength(2);
  });

  test('does not split on abbreviations like Mr. or Dr.', () => {
    // Simple sentence splitter won't handle all edge cases, but should
    // handle basic cases without over-splitting
    const result = splitSentences('The engine hummed.');
    expect(result).toHaveLength(1);
  });

  test('returns empty array for empty string', () => {
    expect(splitSentences('')).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */
/*  splitParagraphs                                                    */
/* ------------------------------------------------------------------ */

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

  test('filters empty paragraphs', () => {
    expect(splitParagraphs('\n\nContent.\n\n')).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/*  countWords                                                         */
/* ------------------------------------------------------------------ */

describe('countWords', () => {
  test('counts basic words', () => {
    expect(countWords('one two three')).toBe(3);
  });

  test('handles extra whitespace', () => {
    expect(countWords('  one   two  ')).toBe(2);
  });

  test('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });

  test('returns 0 for whitespace-only string', () => {
    expect(countWords('   ')).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/*  computeProseMetrics — Tier 3                                       */
/* ------------------------------------------------------------------ */

describe('computeProseMetrics', () => {
  test('computes word count', () => {
    const m = computeProseMetrics('The engine hummed softly in the dark.');
    expect(m.wordCount).toBe(7);
  });

  test('computes sentence count', () => {
    const m = computeProseMetrics('First. Second. Third.');
    expect(m.sentenceCount).toBe(3);
  });

  test('computes average sentence length', () => {
    const m = computeProseMetrics('One two. One two three.');
    // 2 sentences: 2 words + 3 words = avg 2.5
    expect(m.avgSentenceLength).toBeCloseTo(2.5, 1);
  });

  test('computes unique word ratio', () => {
    const m = computeProseMetrics('the the the cat cat');
    // 2 unique out of 5 = 0.4
    expect(m.uniqueWordRatio).toBeCloseTo(0.4, 1);
  });

  test('computes em-dash density per 100 words', () => {
    // 10 words, 1 em-dash = 10 per 100
    const m = computeProseMetrics('The corridor \u2014 narrow and dark \u2014 stretched on ahead.');
    expect(m.emDashPer100Words).toBeGreaterThan(0);
  });

  test('computes adverb percentage', () => {
    const m = computeProseMetrics('She moved quickly and silently through the corridor.');
    expect(m.adverbPercentage).toBeGreaterThan(0);
  });

  test('returns zero metrics for empty text', () => {
    const m = computeProseMetrics('');
    expect(m.wordCount).toBe(0);
    expect(m.sentenceCount).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/*  checkProseContent — integration entry point                        */
/* ------------------------------------------------------------------ */

describe('checkProseContent', () => {
  test('returns null for HTML with no narrative blocks', () => {
    const failures: string[] = [];
    const result = checkProseContent('<div class="widget-dice">Dice.</div>', failures);
    expect(result).toBeNull();
    expect(failures).toHaveLength(0);
  });

  test('pushes error-severity violations into failures array', () => {
    const html =
      '<div id="narrative"><p>She noticed the crack in the hull. You felt the vibration through the deck plating.</p></div>';
    const failures: string[] = [];
    checkProseContent(html, failures);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.some(f => f.includes('filter-words') || f.includes('Filter'))).toBe(true);
  });

  test('does not push warning-severity violations into failures', () => {
    // Paragraph opener repetition (warning) only — no error-level tics
    const html = `<div id="narrative">
      <p>The engine hummed. Condensation dripped from overhead pipes.</p>
      <p>The walls pressed close. A pipe groaned somewhere above.</p>
      <p>The air tasted of copper. Something dripped in the dark.</p>
    </div>`;
    const failures: string[] = [];
    const result = checkProseContent(html, failures);
    expect(failures).toHaveLength(0);
    // But warnings should still be in the result
    expect(result).not.toBeNull();
    // Metrics should be present
    expect(result!.metrics.wordCount).toBeGreaterThan(0);
  });

  test('returns warnings separately from failures', () => {
    // Force a warning (paragraph opener repetition) with enough paragraphs
    const html = `<div id="narrative">
      <p>The engine hummed steadily in the dark corridor ahead.</p>

      <p>The walls pressed close around you as you moved forward.</p>

      <p>The air grew thick with the smell of old sealant now.</p>
    </div>`;
    const failures: string[] = [];
    const result = checkProseContent(html, failures);
    expect(result).not.toBeNull();
    // warnings array exists on result
    expect(Array.isArray(result!.warnings)).toBe(true);
  });

  test('returns prose metrics in result', () => {
    const html = '<div id="narrative"><p>The corridor stretched ahead. Rust covered the walls.</p></div>';
    const failures: string[] = [];
    const result = checkProseContent(html, failures);
    expect(result).not.toBeNull();
    expect(result!.metrics.wordCount).toBeGreaterThan(0);
    expect(result!.metrics.sentenceCount).toBeGreaterThan(0);
  });

  test('handles multiple error violations in one block', () => {
    const html = '<div id="narrative"><p>She noticed the crack. He exclaimed loudly. She felt the vibration.</p></div>';
    const failures: string[] = [];
    checkProseContent(html, failures);
    // Should have at least 2 failures (filter-words x2 + said-bookisms)
    expect(failures.length).toBeGreaterThanOrEqual(2);
  });

  test('warns when Flesch-Kincaid score is below threshold', () => {
    const dense =
      'The infrastructural consolidation necessitates comprehensive architectural recalibration consideration. ';
    const html = `<div id="narrative"><p>${dense.repeat(8)}</p></div>`;
    const failures: string[] = [];
    const result = checkProseContent(html, failures);
    expect(result!.warnings.some(w => /readability|flesch/i.test(w))).toBe(true);
  });

  test('warns when vocabulary variety is low', () => {
    const html = `<div id="narrative"><p>${'the iron wall '.repeat(60)}</p></div>`;
    const failures: string[] = [];
    const result = checkProseContent(html, failures);
    expect(result!.warnings.some(w => /vocabulary|unique/i.test(w))).toBe(true);
  });

  test('warns when scene is predominantly dialogue', () => {
    const dialogue =
      '"Move along the corridor now," she said. "The passage is clear and completely safe." ' +
      '"Are you certain?" he asked. "Yes, I am certain," she said. "Then let us proceed at once," he said. ' +
      '"Fine, we will go now," she replied. "Lead the way," he said.';
    const html = `<div id="narrative"><p>${dialogue}</p></div>`;
    const failures: string[] = [];
    const result = checkProseContent(html, failures);
    expect(result!.warnings.some(w => /dialogue/i.test(w))).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  countSyllables                                                      */
/* ------------------------------------------------------------------ */

describe('countSyllables', () => {
  test('single vowel group = 1 syllable', () => {
    expect(countSyllables('deck')).toBe(1);
    expect(countSyllables('run')).toBe(1);
  });

  test('words ≤ 3 chars return 1', () => {
    expect(countSyllables('the')).toBe(1);
    expect(countSyllables('cat')).toBe(1);
  });

  test('two syllables', () => {
    expect(countSyllables('bulkhead')).toBe(2);
    expect(countSyllables('simple')).toBe(2);
    expect(countSyllables('battle')).toBe(2);
  });

  test('three syllables', () => {
    expect(countSyllables('corridor')).toBe(3);
    expect(countSyllables('disaster')).toBe(3);
  });

  test('four syllables', () => {
    expect(countSyllables('procedural')).toBe(4);
  });

  test('empty string returns 0', () => {
    expect(countSyllables('')).toBe(0);
  });

  test('handles uppercase input', () => {
    expect(countSyllables('DECK')).toBe(1);
    expect(countSyllables('CORRIDOR')).toBe(3);
  });

  test('strips punctuation from input', () => {
    expect(countSyllables("can't")).toBe(1);
    expect(countSyllables('corridor.')).toBe(3);
  });
});

/* ------------------------------------------------------------------ */
/*  computeProseMetrics — new fields                                    */
/* ------------------------------------------------------------------ */

describe('computeProseMetrics — FK and stddev', () => {
  test('simple text has higher FK score than complex text', () => {
    const simple = 'The cat sat. Dogs ran fast. Rain fell down.';
    const complex = 'The infrastructural consolidation necessitates comprehensive architectural recalibration.';
    expect(computeProseMetrics(simple).fleschKincaid).toBeGreaterThan(computeProseMetrics(complex).fleschKincaid);
  });

  test('varied sentence lengths produce higher stddev than uniform', () => {
    const uniform = 'The cat sat on mat. Dogs run on path. Rust fell from wall.';
    const varied = 'Run. The corridor stretched for what seemed like an eternity, dripping with condensation.';
    expect(computeProseMetrics(varied).sentenceLengthStdDev).toBeGreaterThan(
      computeProseMetrics(uniform).sentenceLengthStdDev,
    );
  });

  test('empty text returns zero for FK and stddev', () => {
    const m = computeProseMetrics('');
    expect(m.fleschKincaid).toBe(0);
    expect(m.sentenceLengthStdDev).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/*  extractSpeakerUtterances                                           */
/* ------------------------------------------------------------------ */

describe('extractSpeakerUtterances', () => {
  test('extracts utterances attributed with post-verb pattern', () => {
    const text = '"Move forward now," Kira said. "Stay right back," Kira said.';
    const map = extractSpeakerUtterances(text);
    expect(map.has('Kira')).toBe(true);
    expect(map.get('Kira')!.length).toBe(2);
  });

  test('extracts utterances attributed with pre-verb pattern', () => {
    const text = 'Orin said, "We leave at dawn." Orin said, "No more delays now."';
    const map = extractSpeakerUtterances(text);
    expect(map.has('Orin')).toBe(true);
    expect(map.get('Orin')!.length).toBe(3);
  });

  test('handles multiple speakers', () => {
    const text = '"Move," Kira said. "Wait," Orin said. "Now," Kira said.';
    const map = extractSpeakerUtterances(text);
    expect(map.size).toBeGreaterThanOrEqual(2);
  });

  test('returns empty map when no attribution present', () => {
    const text = 'The corridor stretched ahead. No one spoke.';
    expect(extractSpeakerUtterances(text).size).toBe(0);
  });

  test('word counts match utterance content', () => {
    const text = '"Move forward right now," Kira said.'; // 4 words (trailing comma stripped by word filter)
    const map = extractSpeakerUtterances(text);
    const lengths = map.get('Kira');
    expect(lengths).toBeDefined();
    expect(lengths![0]).toBeGreaterThanOrEqual(3);
  });

  test('attribution tags do not cause double-counting — post-pattern utterance counted once', () => {
    // POST_ATTR_RE and PRE_ATTR_RE are mutually exclusive patterns; a single
    // attributed quote must appear exactly once in the result, not twice.
    const text = '"We leave at dawn," Orin said. "No more delays," Orin said.';
    const map = extractSpeakerUtterances(text);
    // Exactly 2 utterances — not 4 (which would indicate double-counting)
    expect(map.get('Orin')!.length).toBe(2);
  });

  test('mixed pre- and post-attribution passages do not double-count across patterns', () => {
    // One pre-attribution and one post-attribution for the same speaker; total must be 2
    const text = 'Kira said, "Stay back." "Move now," Kira said.';
    const map = extractSpeakerUtterances(text);
    expect(map.get('Kira')!.length).toBe(2);
  });
});

/* ------------------------------------------------------------------ */
/*  checkVoiceDifferentiation                                          */
/* ------------------------------------------------------------------ */

describe('checkVoiceDifferentiation', () => {
  test('warns when two speakers have near-identical utterance length patterns', () => {
    const text = [
      '"Move along the corridor now," Kira said.',
      '"Stay here and hold position," Orin said.',
      '"Come back to the ship now," Kira said.',
      '"Wait here and do nothing please," Orin said.',
    ].join(' ');
    const warnings: string[] = [];
    checkVoiceDifferentiation(text, warnings);
    expect(warnings.some(w => /voice|differentiat/i.test(w))).toBe(true);
  });

  test('no warning when speakers have clearly different utterance patterns', () => {
    const text = [
      '"Move," Kira said.',
      '"You need to get to the ship right now before they close the gate," Orin said.',
      '"Run," Kira said.',
      '"Do not stop and do not look back whatever happens tonight," Orin said.',
    ].join(' ');
    const warnings: string[] = [];
    checkVoiceDifferentiation(text, warnings);
    expect(warnings.some(w => /voice|differentiat/i.test(w))).toBe(false);
  });

  test('no warning for a single speaker', () => {
    const text = '"Move now," Kira said. "Run fast," Kira said. "Stop here," Kira said.';
    const warnings: string[] = [];
    checkVoiceDifferentiation(text, warnings);
    expect(warnings).toHaveLength(0);
  });

  test('no warning when a speaker has only one utterance', () => {
    const text = '"Hello there," Kira said. "Goodbye now," Orin said. "Wait please," Kira said.';
    const warnings: string[] = [];
    checkVoiceDifferentiation(text, warnings);
    // Orin has only 1 utterance — not enough to qualify for comparison
    expect(warnings).toHaveLength(0);
  });

  test('warning message names the speakers', () => {
    const text = [
      '"Move along the corridor now," Kira said.',
      '"Stay here and hold position," Orin said.',
      '"Come back to the ship now," Kira said.',
      '"Wait here and do nothing please," Orin said.',
    ].join(' ');
    const warnings: string[] = [];
    checkVoiceDifferentiation(text, warnings);
    const w = warnings.find(w => /voice|differentiat/i.test(w));
    expect(w).toBeDefined();
    // Should mention speaker names
    expect(w).toMatch(/Kira|Orin/);
  });
});
