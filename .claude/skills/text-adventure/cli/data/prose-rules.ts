// Data-driven prose rule definitions for deterministic content analysis.
// Pure types + constants — no runtime logic. Rules are evaluated by prose-checks.ts.

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type RuleSeverity = 'error' | 'warning';

/** Regex-based rule — matches a pattern in text. */
export type PatternRule = {
  readonly id: string;
  readonly name: string;
  readonly severity: RuleSeverity;
  readonly pattern: RegExp;
  /** Optional gate — return false to suppress a match (e.g. failure-context exemption). */
  readonly gate?: (match: RegExpExecArray, text: string) => boolean;
  readonly fix: string;
};

/** Structural / statistical rule — imperative check function. */
export type HeuristicRule = {
  readonly id: string;
  readonly name: string;
  readonly severity: 'warning';
  readonly check: (text: string) => string[];
  readonly fix: string;
};

/** A single violation found by either rule type. */
export type ProseViolation = {
  readonly ruleId: string;
  readonly ruleName: string;
  readonly severity: RuleSeverity;
  readonly message: string;
  readonly fix: string;
};

/** Informational prose metrics — Tier 3, never blocks verify. */
export type ProseMetrics = {
  readonly wordCount: number;
  readonly sentenceCount: number;
  readonly avgSentenceLength: number;
  readonly uniqueWordRatio: number;
  readonly emDashPer100Words: number;
  readonly dialogueToNarrationRatio: number;
  readonly adverbPercentage: number;
  readonly fleschKincaid: number;
  readonly sentenceLengthStdDev: number;
};

/* ------------------------------------------------------------------ */
/*  Exclusion / lookup sets                                            */
/* ------------------------------------------------------------------ */

/** Words ending in -ly that are NOT adverbs — excluded from adverb density. */
export const NON_ADVERBS: ReadonlySet<string> = new Set([
  'only', 'family', 'early', 'likely', 'lonely', 'friendly', 'ugly',
  'holy', 'daily', 'rally', 'belly', 'bully', 'jelly', 'tally',
  'fly', 'reply', 'supply', 'apply', 'multiply', 'imply', 'ally',
  'assembly', 'anomaly', 'italy', 'lily', 'folly', 'jolly', 'melancholy',
]);

/** Common function words excluded from repetition window and n-gram checks. */
export const STOPWORDS: ReadonlySet<string> = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'shall', 'can', 'not', 'also', 'just', 'more', 'most', 'very', 'some',
  'than', 'then', 'when', 'where', 'who', 'what', 'which', 'how', 'that',
  'this', 'these', 'those', 'such', 'each', 'both', 'all', 'any', 'own',
  'same', 'so', 'yet', 'nor', 'after', 'before', 'since', 'while', 'until',
  // Personal pronouns (short ones filtered by length < 4; longer ones need explicit exclusion)
  'they', 'them', 'their', 'theirs', 'your', 'yours', 'ours', 'itself',
  'herself', 'himself', 'themselves', 'ourselves', 'yourself', 'yourselves',
]);

/** Number words mapped to their numeric value — for word-count mismatch detection. */
export const NUMBER_WORDS: Readonly<Record<string, number>> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12,
};

/** Failure context — if a sentence contains these, wasted-motion verbs are permissible. */
export const FAILURE_CONTEXT = /\b(but|however|couldn't|could not|failed|unable|though)\b/i;

/** Emotion words for the emotional-labelling gate. */
export const EMOTION_WORDS = /\b(dread|fear|anger|rage|fury|joy|sorrow|grief|horror|panic|anxiety|despair|hope|relief|shame|guilt|pride|disgust|awe|wonder|longing|anguish|terror|elation|resignation|defiance)\b/i;

/** Adjectives that indicate telling-not-showing when preceded by a linking verb.
 *  Three categories: emotion, atmosphere, character trait. */
export const TELLING_ADJECTIVES: ReadonlySet<string> = new Set([
  // Emotions
  'angry', 'afraid', 'terrified', 'relieved', 'suspicious', 'sad', 'happy',
  'furious', 'anxious', 'nervous', 'excited', 'desperate', 'hopeful',
  'ashamed', 'guilty', 'proud', 'jealous', 'disgusted', 'horrified',
  'panicked', 'depressed', 'elated', 'resigned', 'defiant', 'anguished',
  'scared', 'frightened', 'worried', 'upset', 'thrilled', 'overjoyed',
  'miserable', 'heartbroken', 'devastated', 'apprehensive', 'uneasy',
  'confused', 'bewildered', 'stunned', 'shocked', 'alarmed', 'frustrated',
  // Atmosphere
  'creepy', 'eerie', 'menacing', 'ominous', 'foreboding', 'oppressive',
  'suffocating', 'hostile', 'threatening', 'gloomy', 'dreary', 'sinister',
  'unsettling', 'forbidding', 'haunting', 'imposing', 'intimidating',
  'claustrophobic', 'inviting', 'welcoming', 'desolate', 'bleak',
  // Character traits
  'brave', 'cowardly', 'intelligent', 'stupid', 'kind', 'cruel', 'gentle',
  'fierce', 'honest', 'dishonest', 'trustworthy', 'cunning', 'loyal',
  'treacherous', 'stubborn', 'reckless', 'cautious', 'arrogant', 'humble',
  'ruthless', 'compassionate', 'generous', 'greedy', 'patient', 'impatient',
]);

/* ------------------------------------------------------------------ */
/*  Tier 1: Pattern Rules (severity: error — blocks verify)            */
/* ------------------------------------------------------------------ */

export const PATTERN_RULES: readonly PatternRule[] = [
  {
    id: 'filter-words',
    name: 'Filter words',
    severity: 'error',
    pattern: /\b(noticed|felt|realised|realized|seemed|heard|could see|appeared to)\b/gi,
    fix: 'Remove the filter word and show the perception directly: "The deck shuddered" not "She felt the deck shudder".',
  },
  {
    id: 'wasted-motion',
    name: 'Wasted-motion verbs',
    severity: 'error',
    pattern: /\b(began to|started to|managed to|decided to|tried to)\b/gi,
    gate(match, text) {
      // Find the sentence containing this match
      const before = text.slice(0, match.index);
      const after = text.slice(match.index);
      const sentenceStart = Math.max(before.lastIndexOf('.'), before.lastIndexOf('!'), before.lastIndexOf('?')) + 1;
      const sentenceEndRel = after.search(/[.!?]/);
      const sentence = text.slice(sentenceStart, sentenceEndRel >= 0 ? match.index + sentenceEndRel : text.length);
      // Suppress if sentence has failure context — "tried to but couldn't" is fine
      return !FAILURE_CONTEXT.test(sentence);
    },
    fix: 'Cut the wasted-motion verb and use the main verb directly: "She ran" not "She began to run".',
  },
  {
    id: 'stat-names-in-prose',
    name: 'Stat names in narrative prose',
    severity: 'error',
    pattern: /\b(STR|DEX|CON|INT|WIS|CHA)\b/g,
    fix: 'Use natural descriptions: "Your hands are steady" not "Your DEX of 16".',
  },
  {
    id: 'word-count-mismatch',
    name: 'Word-count mismatch',
    severity: 'error',
    pattern: /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+words?\b/gi,
    gate(match, text) {
      const claimed = NUMBER_WORDS[match[1].toLowerCase()];
      if (claimed === undefined) return false;
      // Look for a quoted phrase within 60 chars after the match
      const after = text.slice(match.index, match.index + match[0].length + 80);
      const quoteMatch = after.match(/[""\u201c]([^""\u201d]+)[""\u201d]/);
      if (!quoteMatch) return false; // No nearby quote — can't verify
      const words = quoteMatch[1].trim().split(/\s+/).length;
      return words !== claimed; // Flag only when count doesn't match
    },
    fix: 'Count the words in the quoted phrase and correct the number word.',
  },
  {
    id: 'said-bookisms',
    name: 'Said-bookisms',
    severity: 'error',
    pattern: /\b(exclaimed|retorted|gasped|uttered|proclaimed|intoned|declared)\b/gi,
    fix: 'Use "said" or "asked" — or better, cut the dialogue tag entirely and let action beats identify the speaker.',
  },
  {
    id: 'em-dash-stacking',
    name: 'Em-dash stacking',
    severity: 'error',
    pattern: /\u2014/g,
    gate(match, text) {
      // Find the paragraph containing this em-dash
      const before = text.slice(0, match.index);
      const after = text.slice(match.index);
      const paraStart = before.lastIndexOf('\n\n') + 2;
      const paraEndRel = after.indexOf('\n\n');
      const paragraph = text.slice(
        paraStart < 2 ? 0 : paraStart,
        paraEndRel >= 0 ? match.index + paraEndRel : text.length,
      );
      const dashCount = (paragraph.match(/\u2014/g) || []).length;
      // Only flag if this paragraph has >2 em-dashes AND this is the first em-dash
      // (so we report once per paragraph, not once per dash)
      if (dashCount <= 2) return false;
      const firstDashInPara = paragraph.indexOf('\u2014');
      const offsetInPara = match.index - (paraStart < 2 ? 0 : paraStart);
      return offsetInPara === firstDashInPara;
    },
    fix: 'Limit to 2 em-dashes per paragraph. Replace extras with commas, semicolons, or full stops.',
  },
  {
    id: 'cliche-phrases',
    name: 'Cliché phrases',
    severity: 'error',
    pattern: /\b(a chill ran down|time stood still|silence was deafening|as if on cue|little did they know|blood ran cold|heart skipped a beat|sent shivers down|world seemed to (slow|stop)|every fibre of|knot in (stomach|belly|gut)|pit of (stomach|belly|gut)|hung in the (air|balance)|pierced the silence)\b/gi,
    fix: 'Replace with a specific, concrete image grounded in the scene.',
  },
  {
    id: 'summarising-tic',
    name: 'Summarising tic',
    severity: 'error',
    pattern: /^(And so the journey continued|And with that|And so it was|And thus|From that moment on)\b/gim,
    fix: 'Cut the summarising opener. Start the paragraph with the next concrete action or image.',
  },
  {
    id: 'emotional-labelling',
    name: 'Emotional labelling',
    severity: 'error',
    pattern: /\bWith (a |growing |mounting )(surge of |sense of )?\w+\b/gi,
    gate(match) {
      // Only flag if the captured word is an emotion word
      return EMOTION_WORDS.test(match[0]);
    },
    fix: 'Show the emotion through physical action or sensory detail instead of naming it.',
  },
  {
    id: 'portentous-pause',
    name: 'Portentous pause',
    severity: 'error',
    pattern: /\b(And then\s*\u2014\s*silence|What came next would change everything|Nothing could have prepared|Everything was about to change|But that was before|If only they had known|The truth was far)\b/gi,
    fix: 'Cut the portentous filler. Show what actually happens next.',
  },
  {
    id: 'telling-not-showing',
    name: 'Telling not showing (linking verb + adjective)',
    severity: 'error',
    pattern: /\b(was|were|grew|became)\s+(\w+)\b/gi,
    gate(match) {
      return TELLING_ADJECTIVES.has(match[2].toLowerCase());
    },
    fix: 'Show through physical action, sensory detail, or behaviour — not a linking verb + adjective.',
  },
  {
    id: 'adverb-said',
    name: 'Adverb on dialogue tag',
    severity: 'error',
    pattern: /\b(said|asked)\s+(\w+ly)\b/gi,
    gate(match) {
      const word = match[2].toLowerCase();
      return !NON_ADVERBS.has(word);
    },
    fix: 'Cut the adverb — "said" is invisible. Show manner through action beats instead.',
  },
  {
    id: 'redundant-perception',
    name: 'Redundant perception verb',
    severity: 'error',
    pattern: /\b(Looking|Glancing|Peering|Listening|Watching|Turning)\b[^.]{0,50}\b(saw|heard|spotted|made out)\b/gi,
    fix: 'Cut the perception frame — just describe what is perceived: "A crack split the hull" not "Looking up, she saw a crack".',
  },
];

/* ------------------------------------------------------------------ */
/*  Tier 2: Heuristic Rules (severity: warning — doesn't block)        */
/* ------------------------------------------------------------------ */

export const HEURISTIC_RULES: readonly HeuristicRule[] = [
  {
    id: 'sentence-length-uniformity',
    name: 'Sentence length uniformity',
    severity: 'warning',
    check(text) {
      const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
      if (sentences.length < 4) return [];
      const lengths = sentences.map(s => s.split(/\s+/).length);
      const violations: string[] = [];
      for (let i = 0; i <= lengths.length - 3; i++) {
        const a = lengths[i], b = lengths[i + 1], c = lengths[i + 2];
        const avg = (a + b + c) / 3;
        if (avg === 0) continue;
        const withinBand = [a, b, c].every(l => Math.abs(l - avg) / avg <= 0.2);
        if (withinBand) {
          violations.push(`Sentences ${i + 1}–${i + 3} have similar length (${a}, ${b}, ${c} words) — vary rhythm.`);
          break; // One report per text
        }
      }
      return violations;
    },
    fix: 'Vary sentence length — mix short punchy sentences with longer flowing ones.',
  },
  {
    id: 'paragraph-opener-repetition',
    name: 'Paragraph opener repetition',
    severity: 'warning',
    check(text) {
      const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
      if (paragraphs.length < 3) return [];
      const openers = paragraphs.map(p => {
        const firstWord = p.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
        return firstWord || '';
      });
      const violations: string[] = [];
      for (let i = 0; i <= openers.length - 3; i++) {
        if (openers[i] && openers[i] === openers[i + 1] && openers[i + 1] === openers[i + 2]) {
          violations.push(`Paragraphs ${i + 1}–${i + 3} all open with "${openers[i]}" — vary your openers.`);
          break;
        }
      }
      return violations;
    },
    fix: 'Start consecutive paragraphs with different words to avoid monotonous structure.',
  },
  {
    id: 'adverb-density',
    name: 'Adverb density',
    severity: 'warning',
    check(text) {
      const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      if (words.length < 20) return [];
      const adverbs = words.filter(w => w.endsWith('ly') && !NON_ADVERBS.has(w.replace(/[^a-z]/g, '')));
      const pct = (adverbs.length / words.length) * 100;
      if (pct > 5) {
        return [`Adverb density ${pct.toFixed(1)}% (${adverbs.length}/${words.length} words) exceeds 5% threshold.`];
      }
      return [];
    },
    fix: 'Replace adverbs with stronger verbs: "sprinted" not "ran quickly".',
  },
  {
    id: 'passive-voice-density',
    name: 'Passive voice density',
    severity: 'warning',
    check(text) {
      const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
      if (sentences.length < 5) return [];
      const passivePattern = /\b(was|were|is|are|been|being)\s+\w+ed\b/gi;
      const passiveCount = sentences.filter(s => passivePattern.test(s)).length;
      // Reset lastIndex on the shared regex
      passivePattern.lastIndex = 0;
      const pct = (passiveCount / sentences.length) * 100;
      if (pct > 15) {
        return [`Passive voice in ${passiveCount}/${sentences.length} sentences (${pct.toFixed(0)}%) exceeds 15% threshold.`];
      }
      return [];
    },
    fix: 'Rewrite passive constructions in active voice: "The alarm shrieks" not "The alarm was heard".',
  },
  {
    id: 'paragraph-density',
    name: 'Dense paragraph',
    severity: 'warning',
    check(text) {
      const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
      const violations: string[] = [];
      for (let i = 0; i < paragraphs.length; i++) {
        const wc = paragraphs[i].trim().split(/\s+/).length;
        if (wc > 100) {
          violations.push(`Paragraph ${i + 1} is ${wc} words — break it up to aid readability.`);
        }
      }
      return violations;
    },
    fix: 'Split paragraphs longer than 100 words. Each paragraph should develop a single beat or image.',
  },
  {
    id: 'word-repetition-window',
    name: 'Word repetition within 80-word window',
    severity: 'warning',
    check(text) {
      const words = text.toLowerCase()
        .split(/\s+/)
        .map(w => w.replace(/[^a-z'-]/g, '').replace(/^'+|'+$/g, ''));
      const violations: string[] = [];
      const reported = new Set<string>();

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (!word || word.length < 4 || STOPWORDS.has(word) || reported.has(word)) continue;
        const windowEnd = Math.min(words.length, i + 80);
        let count = 0;
        for (let j = i; j < windowEnd; j++) {
          if (words[j] === word) count++;
        }
        if (count >= 3) {
          reported.add(word);
          violations.push(`"${word}" appears ${count} times within 80 words — vary your vocabulary.`);
          if (violations.length >= 3) break;
        }
      }
      return violations;
    },
    fix: 'Replace repeated words with synonyms or restructure sentences to avoid echo.',
  },
  {
    id: 'ngram-repetition',
    name: 'Repeated phrase (bigram)',
    severity: 'warning',
    check(text) {
      const words = text.toLowerCase()
        .split(/\s+/)
        .map(w => w.replace(/[^a-z'-]/g, '').replace(/^'+|'+$/g, ''))
        .filter(w => w.length > 0);
      if (words.length < 10) return [];

      const bigrams = new Map<string, number>();
      for (let i = 0; i < words.length - 1; i++) {
        const a = words[i], b = words[i + 1];
        if (STOPWORDS.has(a) && STOPWORDS.has(b)) continue;
        if (a.length < 3 || b.length < 3) continue;
        const key = `${a} ${b}`;
        bigrams.set(key, (bigrams.get(key) ?? 0) + 1);
      }

      const violations: string[] = [];
      for (const [phrase, count] of bigrams) {
        if (count >= 3) {
          violations.push(`Phrase "${phrase}" repeated ${count} times — vary your phrasing.`);
          if (violations.length >= 3) break;
        }
      }
      return violations;
    },
    fix: 'Reword repeated phrases. Repetition can be intentional for rhythm, but should be deliberate.',
  },
];
