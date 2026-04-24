import { describe, test, expect } from 'bun:test';
import { evaluatePatternRules, evaluateHeuristicRules } from '../lib/prose-checks';
import { HEURISTIC_RULES } from './prose-rules';

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
      const violations = evaluatePatternRules("She tried to open the hatch but couldn't.");
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

  // -- vague-nouns (NEW) --
  describe('vague-nouns', () => {
    test('flags "the area"', () => {
      const violations = evaluatePatternRules('She moved through the area carefully.');
      expect(violations.some(v => v.ruleId === 'vague-nouns')).toBe(true);
    });

    test('flags "a thing"', () => {
      const violations = evaluatePatternRules('A thing lay on the floor.');
      expect(violations.some(v => v.ruleId === 'vague-nouns')).toBe(true);
    });

    test('flags "the place"', () => {
      const violations = evaluatePatternRules('This was the place they had agreed to meet.');
      expect(violations.some(v => v.ruleId === 'vague-nouns')).toBe(true);
    });

    test('does not flag specific nouns', () => {
      const violations = evaluatePatternRules('She moved through the corridor carefully.');
      expect(violations.some(v => v.ruleId === 'vague-nouns')).toBe(false);
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
      const text =
        'The engine hums in place. The light flickers above you. The walls press in close. The air feels thin today. The path leads you onward.';
      const violations = evaluateHeuristicRules(text);
      expect(violations.some(v => v.ruleId === 'sentence-length-uniformity')).toBe(true);
    });

    test('no warning for varied sentence lengths', () => {
      const text =
        'Short. The corridor stretches ahead for what feels like miles, its walls lined with conduit. Stop. A sound — faint, metallic, repeating — reaches you from somewhere deeper in the station.';
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
      const text =
        'She quickly moved silently through the dimly lit corridor, carefully avoiding the loosely hanging wires, steadily making her way forward. The path narrowly curved sharply ahead, barely visible through the thickly clouded air. She cautiously stepped over the deeply cracked floor.';
      const violations = evaluateHeuristicRules(text);
      expect(violations.some(v => v.ruleId === 'adverb-density')).toBe(true);
    });

    test('no warning for sparse adverb use', () => {
      const text =
        'The corridor stretched ahead. Rust covered the walls. A drip echoed from somewhere deep in the station. The air tasted of copper and old sealant.';
      const violations = evaluateHeuristicRules(text);
      expect(violations.some(v => v.ruleId === 'adverb-density')).toBe(false);
    });

    test('excludes NON_ADVERBS like "only" and "friendly"', () => {
      const text =
        'The only friendly face in the room belonged to the early arrival. The family gathered daily in the lonely outpost.';
      const violations = evaluateHeuristicRules(text);
      expect(violations.some(v => v.ruleId === 'adverb-density')).toBe(false);
    });
  });

  // -- passive-voice-density --
  describe('passive-voice-density', () => {
    test('warns when passive voice exceeds 15%', () => {
      // 6 sentences, 2+ passive — above 15%
      const text =
        'The door was opened by the crew. The alarm was triggered by the impact. Smoke filled the corridor. The hull was breached near the stern. You ran. The lights were dimmed by the emergency system.';
      const violations = evaluateHeuristicRules(text);
      expect(violations.some(v => v.ruleId === 'passive-voice-density')).toBe(true);
    });

    test('no warning for active voice prose', () => {
      const text =
        'The crew opened the door. The impact triggered the alarm. Smoke filled the corridor. You ran. The emergency system dimmed the lights.';
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
/*  evaluateHeuristicRules — new rules                                  */
/* ------------------------------------------------------------------ */

describe('heuristic: paragraph-density', () => {
  test('warns when paragraph exceeds 100 words', () => {
    const long = Array(101).fill('word').join(' ');
    const v = evaluateHeuristicRules(long, HEURISTIC_RULES);
    expect(v.some(x => x.ruleId === 'paragraph-density')).toBe(true);
  });

  test('no warning for paragraphs under 100 words', () => {
    const short = Array(50).fill('word').join(' ');
    const v = evaluateHeuristicRules(short, HEURISTIC_RULES);
    expect(v.some(x => x.ruleId === 'paragraph-density')).toBe(false);
  });

  test('reports each offending paragraph separately', () => {
    const long = Array(101).fill('word').join(' ');
    const v = evaluateHeuristicRules(`${long}\n\n${long}`, HEURISTIC_RULES);
    expect(v.filter(x => x.ruleId === 'paragraph-density')).toHaveLength(2);
  });
});

describe('heuristic: word-repetition-window', () => {
  test('flags non-stopword repeated 3+ times within 80 words', () => {
    const text =
      'The corridor stretched ahead. The dark corridor turned. Past the corridor entrance. The old corridor ended.';
    const v = evaluateHeuristicRules(text, HEURISTIC_RULES);
    const match = v.find(x => x.ruleId === 'word-repetition-window');
    expect(match).toBeDefined();
    expect(match!.message).toContain('corridor');
  });

  test('does not flag stopwords', () => {
    const text = Array(25).fill('the').join(' ') + '.';
    expect(evaluateHeuristicRules(text, HEURISTIC_RULES).some(x => x.ruleId === 'word-repetition-window')).toBe(false);
  });

  test('does not flag words shorter than 4 chars', () => {
    const text = 'run run run and ran ran ran but ran some more.';
    expect(evaluateHeuristicRules(text, HEURISTIC_RULES).some(x => x.ruleId === 'word-repetition-window')).toBe(false);
  });

  test('no warning when word appears fewer than 3 times', () => {
    const text = 'The corridor stretched ahead. A dark passage turned. Past the entrance hall. The old tunnel ended.';
    expect(evaluateHeuristicRules(text, HEURISTIC_RULES).some(x => x.ruleId === 'word-repetition-window')).toBe(false);
  });

  test('does not flag common pronouns', () => {
    // they/them/their/your all appear many times but are stopwords
    const text =
      'They moved through the ward. They found their gear. They told them what they knew. Your turn they said.';
    expect(evaluateHeuristicRules(text, HEURISTIC_RULES).some(x => x.ruleId === 'word-repetition-window')).toBe(false);
  });
});

describe('heuristic: ngram-repetition', () => {
  test('flags bigram repeated 3+ times', () => {
    // 'iron door' appears 3 times; 'the iron' only 2
    const text = 'Push the iron door open. The iron door resisted. An old iron door blocked the way.';
    const v = evaluateHeuristicRules(text, HEURISTIC_RULES);
    const match = v.find(x => x.ruleId === 'ngram-repetition');
    expect(match).toBeDefined();
    expect(match!.message).toContain('iron door');
  });

  test('no warning when bigram appears fewer than 3 times', () => {
    const text = 'Push the iron door open. The metal gate resisted. An old stone portal blocked the way.';
    expect(evaluateHeuristicRules(text, HEURISTIC_RULES).some(x => x.ruleId === 'ngram-repetition')).toBe(false);
  });

  test('skips bigrams where both words are stopwords', () => {
    // 'with that' — both stopwords, both > 3 chars
    const text =
      'Move forward with that speed. Run away with that force. Jump high with that power. Push on with that will.';
    expect(evaluateHeuristicRules(text, HEURISTIC_RULES).some(x => x.ruleId === 'ngram-repetition')).toBe(false);
  });

  test('skips bigrams containing words shorter than 3 chars', () => {
    const text = 'So it was. So it was. So it was. So it was.';
    expect(evaluateHeuristicRules(text, HEURISTIC_RULES).some(x => x.ruleId === 'ngram-repetition')).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  heuristic: non-visual-senses                                       */
/* ------------------------------------------------------------------ */

describe('heuristic: non-visual-senses', () => {
  test('warns when 100+ word prose has no non-visual sense words', () => {
    const text = Array(20).fill('The dark corridor stretched ahead past the dim light.').join(' ');
    const v = evaluateHeuristicRules(text);
    expect(v.some(x => x.ruleId === 'non-visual-senses')).toBe(true);
  });

  test('no warning when sound word present', () => {
    const base = Array(15).fill('The dark corridor stretched ahead past the dim light.').join(' ');
    const v = evaluateHeuristicRules(base + ' A distant hum echoed through the passages.');
    expect(v.some(x => x.ruleId === 'non-visual-senses')).toBe(false);
  });

  test('no warning when smell word present', () => {
    const base = Array(15).fill('The dark corridor stretched ahead past the dim light.').join(' ');
    const v = evaluateHeuristicRules(base + ' The air carried the sharp scent of rust.');
    expect(v.some(x => x.ruleId === 'non-visual-senses')).toBe(false);
  });

  test('no warning when temperature word present', () => {
    const base = Array(15).fill('The dark corridor stretched ahead past the dim light.').join(' ');
    const v = evaluateHeuristicRules(base + ' Cold pressed into your bones from the metal floor.');
    expect(v.some(x => x.ruleId === 'non-visual-senses')).toBe(false);
  });

  test('no warning when text is under 100 words', () => {
    const short = 'The dark corridor stretched ahead.';
    const v = evaluateHeuristicRules(short);
    expect(v.some(x => x.ruleId === 'non-visual-senses')).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  heuristic: scene-paragraph-count                                   */
/* ------------------------------------------------------------------ */

describe('heuristic: scene-paragraph-count', () => {
  test('warns when 80+ words form a single paragraph block', () => {
    const text = Array(85).fill('word').join(' ');
    const v = evaluateHeuristicRules(text);
    expect(v.some(x => x.ruleId === 'scene-paragraph-count')).toBe(true);
  });

  test('no warning when multiple paragraphs exist', () => {
    const para = Array(50).fill('word').join(' ');
    const v = evaluateHeuristicRules(`${para}\n\n${para}`);
    expect(v.some(x => x.ruleId === 'scene-paragraph-count')).toBe(false);
  });

  test('no warning when single paragraph is under 80 words', () => {
    const text = Array(60).fill('word').join(' ');
    const v = evaluateHeuristicRules(text);
    expect(v.some(x => x.ruleId === 'scene-paragraph-count')).toBe(false);
  });
});
