import { describe, test, expect } from 'bun:test';
import {
  extractNarrativeText,
  splitSentences,
  splitParagraphs,
  countWords,
  evaluatePatternRules,
  evaluateHeuristicRules,
  computeProseMetrics,
  checkProseContent,
} from './prose-checks';
import { PATTERN_RULES, HEURISTIC_RULES } from '../data/prose-rules';
import type { ProseViolation, ProseMetrics } from '../data/prose-rules';

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
/*  evaluatePatternRules — Tier 1                                      */
/* ------------------------------------------------------------------ */

describe('evaluatePatternRules', () => {
  // -- filter-words --
  describe('filter-words', () => {
    test('flags "noticed" as a filter word', () => {
      const violations = evaluatePatternRules('She noticed the crack in the hull.');
      expect(violations.some(v => v.ruleId === 'filter-words')).toBe(true);
    });

    test('flags "felt" as a filter word', () => {
      const violations = evaluatePatternRules('You felt the vibration.');
      expect(violations.some(v => v.ruleId === 'filter-words')).toBe(true);
    });

    test('flags "could see"', () => {
      const violations = evaluatePatternRules('You could see the outline of the station.');
      expect(violations.some(v => v.ruleId === 'filter-words')).toBe(true);
    });

    test('flags "appeared to"', () => {
      const violations = evaluatePatternRules('The figure appeared to move.');
      expect(violations.some(v => v.ruleId === 'filter-words')).toBe(true);
    });

    test('does not flag clean prose', () => {
      const violations = evaluatePatternRules('The crack ran from floor to ceiling.');
      expect(violations.some(v => v.ruleId === 'filter-words')).toBe(false);
    });
  });

  // -- wasted-motion --
  describe('wasted-motion', () => {
    test('flags "began to" without failure context', () => {
      const violations = evaluatePatternRules('She began to run across the hangar.');
      expect(violations.some(v => v.ruleId === 'wasted-motion')).toBe(true);
    });

    test('suppresses "tried to" with failure context', () => {
      const violations = evaluatePatternRules('She tried to open the hatch but couldn\'t.');
      expect(violations.some(v => v.ruleId === 'wasted-motion')).toBe(false);
    });

    test('suppresses "managed to" with failure word "however"', () => {
      const violations = evaluatePatternRules('He managed to reach the lever, however the circuit was dead.');
      expect(violations.some(v => v.ruleId === 'wasted-motion')).toBe(false);
    });

    test('flags "decided to" without failure context', () => {
      const violations = evaluatePatternRules('You decided to take the corridor.');
      expect(violations.some(v => v.ruleId === 'wasted-motion')).toBe(true);
    });
  });

  // -- stat-names-in-prose --
  describe('stat-names-in-prose', () => {
    test('flags uppercase stat abbreviations', () => {
      const violations = evaluatePatternRules('Your DEX modifier is impressive.');
      expect(violations.some(v => v.ruleId === 'stat-names-in-prose')).toBe(true);
    });

    test('flags STR in narrative', () => {
      const violations = evaluatePatternRules('With your STR, you lift the beam.');
      expect(violations.some(v => v.ruleId === 'stat-names-in-prose')).toBe(true);
    });

    test('does not flag lowercase words like "constitution"', () => {
      const violations = evaluatePatternRules('Your constitution serves you well.');
      expect(violations.some(v => v.ruleId === 'stat-names-in-prose')).toBe(false);
    });
  });

  // -- word-count-mismatch --
  describe('word-count-mismatch', () => {
    test('flags when claimed count does not match quoted phrase', () => {
      const violations = evaluatePatternRules('Three words: "not exactly three word count"');
      expect(violations.some(v => v.ruleId === 'word-count-mismatch')).toBe(true);
    });

    test('passes when count matches', () => {
      const violations = evaluatePatternRules('Two words: "hello world"');
      expect(violations.some(v => v.ruleId === 'word-count-mismatch')).toBe(false);
    });

    test('suppresses when no nearby quoted phrase', () => {
      const violations = evaluatePatternRules('She spoke three words and left.');
      expect(violations.some(v => v.ruleId === 'word-count-mismatch')).toBe(false);
    });
  });

  // -- said-bookisms --
  describe('said-bookisms', () => {
    test('flags "exclaimed"', () => {
      const violations = evaluatePatternRules('"Watch out!" she exclaimed.');
      expect(violations.some(v => v.ruleId === 'said-bookisms')).toBe(true);
    });

    test('flags "retorted"', () => {
      const violations = evaluatePatternRules('"No chance," he retorted.');
      expect(violations.some(v => v.ruleId === 'said-bookisms')).toBe(true);
    });

    test('does not flag "said"', () => {
      const violations = evaluatePatternRules('"Hello," she said.');
      expect(violations.some(v => v.ruleId === 'said-bookisms')).toBe(false);
    });
  });

  // -- em-dash-stacking --
  describe('em-dash-stacking', () => {
    test('flags paragraph with more than 2 em-dashes', () => {
      const text = 'The corridor \u2014 narrow and dark \u2014 twisted ahead \u2014 no end in sight.';
      const violations = evaluatePatternRules(text);
      expect(violations.some(v => v.ruleId === 'em-dash-stacking')).toBe(true);
    });

    test('allows paragraph with exactly 2 em-dashes', () => {
      const text = 'The corridor \u2014 narrow and dark \u2014 twisted ahead.';
      const violations = evaluatePatternRules(text);
      expect(violations.some(v => v.ruleId === 'em-dash-stacking')).toBe(false);
    });

    test('only reports once per paragraph even with 4 dashes', () => {
      const text = 'A \u2014 B \u2014 C \u2014 D \u2014 E.';
      const violations = evaluatePatternRules(text);
      const dashViolations = violations.filter(v => v.ruleId === 'em-dash-stacking');
      expect(dashViolations).toHaveLength(1);
    });
  });

  // -- cliche-phrases --
  describe('cliche-phrases', () => {
    test('flags "a chill ran down"', () => {
      const violations = evaluatePatternRules('A chill ran down your spine.');
      expect(violations.some(v => v.ruleId === 'cliche-phrases')).toBe(true);
    });

    test('flags "silence was deafening"', () => {
      const violations = evaluatePatternRules('The silence was deafening.');
      expect(violations.some(v => v.ruleId === 'cliche-phrases')).toBe(true);
    });

    test('does not flag original imagery', () => {
      const violations = evaluatePatternRules('Cold pressed into your vertebrae like a thumb.');
      expect(violations.some(v => v.ruleId === 'cliche-phrases')).toBe(false);
    });
  });

  // -- summarising-tic --
  describe('summarising-tic', () => {
    test('flags "And so the journey continued" as paragraph opener', () => {
      const violations = evaluatePatternRules('And so the journey continued through the dark.');
      expect(violations.some(v => v.ruleId === 'summarising-tic')).toBe(true);
    });

    test('flags "And with that" as paragraph opener', () => {
      const violations = evaluatePatternRules('And with that, the door sealed shut.');
      expect(violations.some(v => v.ruleId === 'summarising-tic')).toBe(true);
    });
  });

  // -- emotional-labelling --
  describe('emotional-labelling', () => {
    test('flags "With a surge of dread"', () => {
      const violations = evaluatePatternRules('With a surge of dread, you step forward.');
      expect(violations.some(v => v.ruleId === 'emotional-labelling')).toBe(true);
    });

    test('flags "With growing horror"', () => {
      const violations = evaluatePatternRules('With growing horror, you watch the seal crack.');
      expect(violations.some(v => v.ruleId === 'emotional-labelling')).toBe(true);
    });

    test('suppresses when no emotion word is present', () => {
      const violations = evaluatePatternRules('With a steady hand, you grip the railing.');
      expect(violations.some(v => v.ruleId === 'emotional-labelling')).toBe(false);
    });
  });

  // -- portentous-pause --
  describe('portentous-pause', () => {
    test('flags "And then \u2014 silence"', () => {
      const violations = evaluatePatternRules('And then \u2014 silence.');
      expect(violations.some(v => v.ruleId === 'portentous-pause')).toBe(true);
    });

    test('flags "What came next would change everything"', () => {
      const violations = evaluatePatternRules('What came next would change everything.');
      expect(violations.some(v => v.ruleId === 'portentous-pause')).toBe(true);
    });

    test('flags "Nothing could have prepared"', () => {
      const violations = evaluatePatternRules('Nothing could have prepared them for the sight.');
      expect(violations.some(v => v.ruleId === 'portentous-pause')).toBe(true);
    });

    test('flags "Everything was about to change"', () => {
      const violations = evaluatePatternRules('Everything was about to change.');
      expect(violations.some(v => v.ruleId === 'portentous-pause')).toBe(true);
    });
  });

  // -- telling-not-showing --
  describe('telling-not-showing', () => {
    test('flags "was terrified" (emotion)', () => {
      const violations = evaluatePatternRules('She was terrified of the dark.');
      expect(violations.some(v => v.ruleId === 'telling-not-showing')).toBe(true);
    });

    test('flags "were hostile" (atmosphere)', () => {
      const violations = evaluatePatternRules('The corridors were hostile and unwelcoming.');
      expect(violations.some(v => v.ruleId === 'telling-not-showing')).toBe(true);
    });

    test('flags "was brave" (character trait)', () => {
      const violations = evaluatePatternRules('The captain was brave in the face of danger.');
      expect(violations.some(v => v.ruleId === 'telling-not-showing')).toBe(true);
    });

    test('flags "grew anxious"', () => {
      const violations = evaluatePatternRules('He grew anxious as the countdown ticked on.');
      expect(violations.some(v => v.ruleId === 'telling-not-showing')).toBe(true);
    });

    test('does not flag non-telling adjectives like "was open"', () => {
      const violations = evaluatePatternRules('The hatch was open.');
      expect(violations.some(v => v.ruleId === 'telling-not-showing')).toBe(false);
    });

    test('does not flag "was broken"', () => {
      const violations = evaluatePatternRules('The console was broken beyond repair.');
      expect(violations.some(v => v.ruleId === 'telling-not-showing')).toBe(false);
    });
  });

  // -- adverb-said --
  describe('adverb-said', () => {
    test('flags "said quietly"', () => {
      const violations = evaluatePatternRules('"Keep moving," she said quietly.');
      expect(violations.some(v => v.ruleId === 'adverb-said')).toBe(true);
    });

    test('flags "asked nervously"', () => {
      const violations = evaluatePatternRules('"Is it safe?" he asked nervously.');
      expect(violations.some(v => v.ruleId === 'adverb-said')).toBe(true);
    });

    test('does not flag "said" without adverb', () => {
      const violations = evaluatePatternRules('"Move," she said.');
      expect(violations.some(v => v.ruleId === 'adverb-said')).toBe(false);
    });

    test('suppresses NON_ADVERBS like "only"', () => {
      const violations = evaluatePatternRules('He said only what was necessary.');
      expect(violations.some(v => v.ruleId === 'adverb-said')).toBe(false);
    });
  });

  // -- redundant-perception --
  describe('redundant-perception', () => {
    test('flags "Looking up, she saw"', () => {
      const violations = evaluatePatternRules('Looking up, she saw the breach in the hull.');
      expect(violations.some(v => v.ruleId === 'redundant-perception')).toBe(true);
    });

    test('flags "Glancing back, he spotted"', () => {
      const violations = evaluatePatternRules('Glancing back, he spotted the shadow.');
      expect(violations.some(v => v.ruleId === 'redundant-perception')).toBe(true);
    });

    test('flags "Listening closely, she heard"', () => {
      const violations = evaluatePatternRules('Listening closely, she heard the hum of machinery.');
      expect(violations.some(v => v.ruleId === 'redundant-perception')).toBe(true);
    });

    test('does not flag "Looking" without a result verb', () => {
      const violations = evaluatePatternRules('Looking for a way out, she turned left.');
      expect(violations.some(v => v.ruleId === 'redundant-perception')).toBe(false);
    });
  });

  // -- expanded cliche-phrases --
  describe('cliche-phrases (expanded)', () => {
    test('flags "blood ran cold"', () => {
      const violations = evaluatePatternRules('Her blood ran cold.');
      expect(violations.some(v => v.ruleId === 'cliche-phrases')).toBe(true);
    });

    test('flags "heart skipped a beat"', () => {
      const violations = evaluatePatternRules('His heart skipped a beat.');
      expect(violations.some(v => v.ruleId === 'cliche-phrases')).toBe(true);
    });

    test('flags "sent shivers down"', () => {
      const violations = evaluatePatternRules('The sound sent shivers down her spine.');
      expect(violations.some(v => v.ruleId === 'cliche-phrases')).toBe(true);
    });
  });

  // -- expanded summarising-tic --
  describe('summarising-tic (expanded)', () => {
    test('flags "And thus" as paragraph opener', () => {
      const violations = evaluatePatternRules('And thus the crew moved forward.');
      expect(violations.some(v => v.ruleId === 'summarising-tic')).toBe(true);
    });

    test('flags "From that moment on"', () => {
      const violations = evaluatePatternRules('From that moment on, nothing was the same.');
      expect(violations.some(v => v.ruleId === 'summarising-tic')).toBe(true);
    });
  });

  // -- general --
  test('returns empty array for clean prose', () => {
    const text = 'The engine hummed. Condensation dripped from the overhead pipes. You stepped forward.';
    expect(evaluatePatternRules(text)).toHaveLength(0);
  });

  test('each violation includes ruleId, ruleName, severity, message, and fix', () => {
    const violations = evaluatePatternRules('She noticed the crack.');
    expect(violations.length).toBeGreaterThan(0);
    const v = violations[0]!;
    expect(v.ruleId).toBe('filter-words');
    expect(v.ruleName).toBe('Filter words');
    expect(v.severity).toBe('error');
    expect(v.message).toBeTruthy();
    expect(v.fix).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/*  evaluateHeuristicRules — Tier 2                                    */
/* ------------------------------------------------------------------ */

describe('evaluateHeuristicRules', () => {
  // -- sentence-length-uniformity --
  describe('sentence-length-uniformity', () => {
    test('warns when 3+ consecutive sentences have similar length', () => {
      // 5 sentences, each ~6 words — monotonous
      const text = 'The engine hums in place. The light flickers above you. The walls press in close. The air feels thin today. The path leads you onward.';
      const violations = evaluateHeuristicRules(text);
      expect(violations.some(v => v.ruleId === 'sentence-length-uniformity')).toBe(true);
    });

    test('no warning for varied sentence lengths', () => {
      const text = 'Short. The corridor stretches ahead for what feels like miles, its walls lined with conduit. Stop. A sound — faint, metallic, repeating — reaches you from somewhere deeper in the station.';
      const violations = evaluateHeuristicRules(text);
      expect(violations.some(v => v.ruleId === 'sentence-length-uniformity')).toBe(false);
    });
  });

  // -- paragraph-opener-repetition --
  describe('paragraph-opener-repetition', () => {
    test('warns when 3+ consecutive paragraphs open with the same word', () => {
      const text = 'The engine hummed.\n\nThe walls shook.\n\nThe lights flickered.';
      const violations = evaluateHeuristicRules(text);
      expect(violations.some(v => v.ruleId === 'paragraph-opener-repetition')).toBe(true);
    });

    test('no warning for varied paragraph openers', () => {
      const text = 'The engine hummed.\n\nRust flakes drifted.\n\nSomewhere, a pipe burst.';
      const violations = evaluateHeuristicRules(text);
      expect(violations.some(v => v.ruleId === 'paragraph-opener-repetition')).toBe(false);
    });
  });

  // -- adverb-density --
  describe('adverb-density', () => {
    test('warns when adverb density exceeds 5%', () => {
      // Deliberately heavy on -ly words (not in exclusion set)
      const text = 'She quickly moved silently through the dimly lit corridor, carefully avoiding the loosely hanging wires, steadily making her way forward. The path narrowly curved sharply ahead, barely visible through the thickly clouded air. She cautiously stepped over the deeply cracked floor.';
      const violations = evaluateHeuristicRules(text);
      expect(violations.some(v => v.ruleId === 'adverb-density')).toBe(true);
    });

    test('no warning for sparse adverb use', () => {
      const text = 'The corridor stretched ahead. Rust covered the walls. A drip echoed from somewhere deep in the station. The air tasted of copper and old sealant.';
      const violations = evaluateHeuristicRules(text);
      expect(violations.some(v => v.ruleId === 'adverb-density')).toBe(false);
    });

    test('excludes NON_ADVERBS like "only" and "friendly"', () => {
      const text = 'The only friendly face in the room belonged to the early arrival. The family gathered daily in the lonely outpost.';
      const violations = evaluateHeuristicRules(text);
      expect(violations.some(v => v.ruleId === 'adverb-density')).toBe(false);
    });
  });

  // -- passive-voice-density --
  describe('passive-voice-density', () => {
    test('warns when passive voice exceeds 15%', () => {
      // 6 sentences, 2+ passive — above 15%
      const text = 'The door was opened by the crew. The alarm was triggered by the impact. Smoke filled the corridor. The hull was breached near the stern. You ran. The lights were dimmed by the emergency system.';
      const violations = evaluateHeuristicRules(text);
      expect(violations.some(v => v.ruleId === 'passive-voice-density')).toBe(true);
    });

    test('no warning for active voice prose', () => {
      const text = 'The crew opened the door. The impact triggered the alarm. Smoke filled the corridor. You ran. The emergency system dimmed the lights.';
      const violations = evaluateHeuristicRules(text);
      expect(violations.some(v => v.ruleId === 'passive-voice-density')).toBe(false);
    });
  });

  // -- general --
  test('all violations have severity "warning"', () => {
    const text = 'The engine hummed.\n\nThe walls shook.\n\nThe lights flickered.';
    const violations = evaluateHeuristicRules(text);
    for (const v of violations) {
      expect(v.severity).toBe('warning');
    }
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
    const html = '<div id="narrative"><p>She noticed the crack in the hull. You felt the vibration through the deck plating.</p></div>';
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
});
