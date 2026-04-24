// Deterministic prose content analysis engine — no LLM dependency.
// Evaluates narrative text against data-driven rules from prose-rules.ts.

import { splitSentences, splitParagraphs } from './text-utils';
export { splitSentences, splitParagraphs };
import { PATTERN_RULES, HEURISTIC_RULES, NON_ADVERBS } from '../data/prose-rules';
import type { PatternRule, HeuristicRule, ProseViolation, ProseMetrics } from '../data/prose-rules';

/* ------------------------------------------------------------------ */
/*  Text extraction                                                    */
/* ------------------------------------------------------------------ */

/**
 * Strip HTML tags while preserving block-level boundaries as double newlines.
 */
function htmlToProseText(raw: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/p>|<\/li>|<\/h[1-6]>|<br\s*\/?>|<\/div>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts and concatenates narrative text from scene HTML, preserving paragraph breaks.
 *
 * @param {string} html - Raw HTML source of the scene.
 * @returns {string | null} - Extracted prose text, or null if no narrative block is found.
 *
 * @remarks
 * This function specifically targets `div#narrative` or `div.narrative` blocks.
 * It uses a nesting-aware parser to extract the inner content of these blocks
 * without requiring a full DOM implementation (standard `replace` is insufficient
 * for nested divs).
 */
export function extractNarrativeText(html: string): string | null {
  const blocks: string[] = [];
  const startRegex = /<div\b[^>]*(?:id\s*=\s*(['"])narrative\1|class\s*=\s*(['"])[^'"]*\bnarrative\b[^'"]*\2)[^>]*>/gi;
  const tokenRegex = /<\/?div\b[^>]*>/gi;

  let match: RegExpExecArray | null;
  startRegex.lastIndex = 0;

  while ((match = startRegex.exec(html)) !== null) {
    const contentStart = match.index + match[0].length;
    let depth = 1;

    tokenRegex.lastIndex = contentStart;
    let endIndex = -1;
    let tokenMatch: RegExpExecArray | null;

    while ((tokenMatch = tokenRegex.exec(html)) !== null) {
      if (tokenMatch[0].toLowerCase().startsWith('</div')) {
        depth--;
        if (depth === 0) {
          endIndex = tokenMatch.index;
          break;
        }
      } else {
        depth++;
      }
    }

    if (endIndex !== -1) {
      blocks.push(htmlToProseText(html.slice(contentStart, endIndex)));
      startRegex.lastIndex = endIndex + 6; // Move past this block
    } else {
      blocks.push(htmlToProseText(html.slice(contentStart)));
      break;
    }
  }

  if (blocks.length === 0) return null;
  return blocks.join('\n\n');
}

/* ------------------------------------------------------------------ */
/*  Syllable counting                                                  */
/* ------------------------------------------------------------------ */

/**
 * Vowel-group heuristic syllable counter (~90% accuracy for common English).
 *
 * @param {string} word - The word to analyze.
 * @returns {number} - Estimated syllable count.
 */
export function countSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length === 0) return 0;
  if (cleaned.length <= 3) return 1;

  let w = cleaned;
  let bonus = 0;

  // Consonant + le at end = its own syllable (simple → sim|ple, battle → bat|tle)
  if (/[^aeiou]le$/.test(w)) {
    bonus = 1;
    w = w.slice(0, -2);
  } else {
    // Remove trailing silent 'e' when preceded by a consonant
    w = w.replace(/([^aeiou])e$/, '$1');
  }

  const matches = w.match(/[aeiouy]+/g);
  return Math.max(1, (matches ? matches.length : 0) + bonus);
}

/* ------------------------------------------------------------------ */
/*  Splitting utilities                                                */
/* ------------------------------------------------------------------ */

/** Counts the number of whitespace-separated words in a string. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/* ------------------------------------------------------------------ */
/*  Tier 1: Pattern rule evaluation                                    */
/* ------------------------------------------------------------------ */

// Cloned pattern regexes keyed by rule id. Clones prevent lastIndex mutations on shared rule definitions.
const COMPILED_PATTERN_RULES = new Map<string, RegExp>(
  PATTERN_RULES.map(rule => [rule.id, new RegExp(rule.pattern.source, rule.pattern.flags)]),
);

/**
 * Tier 1: Evaluates "hard" regex-based prose rules.
 *
 * @param {string} text - The prose text to analyze.
 * @param {readonly PatternRule[]} rules - The set of pattern rules to apply.
 * @returns {ProseViolation[]} - List of identified violations.
 */
export function evaluatePatternRules(text: string, rules: readonly PatternRule[] = PATTERN_RULES): ProseViolation[] {
  const violations: ProseViolation[] = [];

  for (const rule of rules) {
    const re = COMPILED_PATTERN_RULES.get(rule.id) ?? new RegExp(rule.pattern.source, rule.pattern.flags);
    re.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = re.exec(text)) !== null) {
      if (rule.gate && !rule.gate(match, text)) continue;

      violations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        message: `"${match[0]}" — ${rule.name}`,
        fix: rule.fix,
      });
    }
  }

  return violations;
}

/* ------------------------------------------------------------------ */
/*  Tier 2: Heuristic rule evaluation                                  */
/* ------------------------------------------------------------------ */

/**
 * Tier 2: Evaluates "soft" heuristic-based prose rules.
 *
 * @param {string} text - The prose text to analyze.
 * @param {readonly HeuristicRule[]} rules - The set of heuristic rules to apply.
 * @returns {ProseViolation[]} - List of identified violations.
 */
export function evaluateHeuristicRules(
  text: string,
  rules: readonly HeuristicRule[] = HEURISTIC_RULES,
): ProseViolation[] {
  const violations: ProseViolation[] = [];

  for (const rule of rules) {
    const messages = rule.check(text);
    for (const msg of messages) {
      violations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        message: msg,
        fix: rule.fix,
      });
    }
  }

  return violations;
}

/* ------------------------------------------------------------------ */
/*  Tier 3: Prose metrics                                              */
/* ------------------------------------------------------------------ */

/**
 * Tier 3: Computes quantitative prose metrics and readability scores.
 *
 * @param {string} text - The prose text to analyze.
 * @returns {ProseMetrics} - Object containing word counts, ratios, and scores.
 *
 * @remarks
 * Includes:
 * - Flesch-Kincaid Reading Ease
 * - Unique Word Ratio (Vocabulary variety)
 * - Dialogue vs Narration ratio
 * - Sentence length variation (Standard Deviation)
 */
export function computeProseMetrics(text: string): ProseMetrics {
  const words = text.trim() ? text.trim().toLowerCase().split(/\s+/) : [];
  const wordCount = words.length;
  const sentences = splitSentences(text);
  const sentenceCount = sentences.length;
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  const uniqueWords = new Set(words);
  const uniqueWordRatio = wordCount > 0 ? uniqueWords.size / wordCount : 0;

  const emDashCount = (text.match(/\u2014/g) || []).length;
  const emDashPer100Words = wordCount > 0 ? (emDashCount / wordCount) * 100 : 0;

  const dialogueChars = (text.match(/[""\u201c][^""\u201d]*[""\u201d]/g) || []).reduce((sum, q) => sum + q.length, 0);
  const totalChars = text.length || 1;
  const dialogueToNarrationRatio = dialogueChars / totalChars;

  const adverbs = words.filter(w => {
    const clean = w.replace(/[^a-z]/g, '');
    return clean.endsWith('ly') && clean.length > 2 && !NON_ADVERBS.has(clean);
  });
  const adverbPercentage = wordCount > 0 ? (adverbs.length / wordCount) * 100 : 0;

  // Flesch-Kincaid readability: 206.835 − 1.015×(words/sentences) − 84.6×(syllables/words)
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const fleschKincaid =
    wordCount > 0 && sentenceCount > 0
      ? 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount)
      : 0;

  // Sentence length standard deviation
  const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
  const variance =
    sentenceCount > 0 ? sentenceLengths.reduce((sum, l) => sum + (l - avgSentenceLength) ** 2, 0) / sentenceCount : 0;
  const sentenceLengthStdDev = Math.sqrt(variance);

  return {
    wordCount,
    sentenceCount,
    avgSentenceLength,
    uniqueWordRatio,
    emDashPer100Words,
    dialogueToNarrationRatio,
    adverbPercentage,
    fleschKincaid,
    sentenceLengthStdDev,
  };
}

/* ------------------------------------------------------------------ */
/*  Voice differentiation                                              */
/* ------------------------------------------------------------------ */

const ATTRIBUTION_VERBS =
  '(?:said|asked|replied|whispered|called|murmured|added|continued|snapped|barked|noted|observed)';
// Post-attribution: "quote" Speaker said
const POST_ATTR_RE = new RegExp(
  `["\u201c]([^"\u201d]{1,400})["\u201d]\\s+([A-Z][a-z]{1,20})\\s+${ATTRIBUTION_VERBS}`,
  'g',
);
// Pre-attribution: Speaker said "quote"
const PRE_ATTR_RE = new RegExp(
  `([A-Z][a-z]{1,20})\\s+${ATTRIBUTION_VERBS}[,:]?\\s+["\u201c]([^"\u201d]{1,400})["\u201d]`,
  'g',
);

/**
 * Parse attribution patterns and return utterance word-count arrays per speaker.
 * Matches: "...utterance..." Name said/asked/...
 * and:     Name said/asked "...utterance..."
 */
export function extractSpeakerUtterances(text: string): Map<string, number[]> {
  const speakers = new Map<string, number[]>();

  function addUtterance(name: string, utterance: string): void {
    const wc = utterance
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0).length;
    if (wc === 0) return;
    const arr = speakers.get(name) ?? [];
    arr.push(wc);
    speakers.set(name, arr);
  }

  POST_ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = POST_ATTR_RE.exec(text)) !== null) {
    addUtterance(m[2]!, m[1]!);
  }

  PRE_ATTR_RE.lastIndex = 0;
  while ((m = PRE_ATTR_RE.exec(text)) !== null) {
    addUtterance(m[1]!, m[2]!);
  }

  return speakers;
}

/**
 * Warn when all identified speakers have near-identical utterance lengths.
 * Prevents "Same-Voice Syndrome" where all characters talk in identical rhythms.
 */
export function checkVoiceDifferentiation(text: string, warnings: string[]): void {
  const utterances = extractSpeakerUtterances(text);
  const qualified = [...utterances.entries()].filter(([, lengths]) => lengths.length >= 2);
  if (qualified.length < 2) return;

  const avgs = qualified.map(([name, lengths]) => ({
    name,
    avg: lengths.reduce((s, l) => s + l, 0) / lengths.length,
  }));

  const maxAvg = Math.max(...avgs.map(x => x.avg));
  const minAvg = Math.min(...avgs.map(x => x.avg));

  if (minAvg > 0 && maxAvg / minAvg - 1 < 0.25) {
    const summary = avgs.map(({ name, avg }) => `${name} (avg ${avg.toFixed(1)} words)`).join(', ');
    warnings.push(
      `Voice differentiation: ${summary} — all speakers have similar utterance length. Give each speaker a distinct rhythm.`,
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Shared prose evaluation logic (operates on pre-extracted text)     */
/* ------------------------------------------------------------------ */

/**
 * Runs all prose checks against already-extracted narrative text.
 *
 * @param {string} text - Pre-extracted prose text.
 * @param {string[]} failures - Array to push blocking errors into.
 * @returns {{ warnings: string[]; metrics: ProseMetrics }} - Warnings and metrics.
 */
export function checkProseContentFromText(
  text: string,
  failures: string[],
): { warnings: string[]; metrics: ProseMetrics } {
  const patternViolations = evaluatePatternRules(text);
  const heuristicViolations = evaluateHeuristicRules(text);
  const metrics = computeProseMetrics(text);

  for (const v of patternViolations) {
    if (v.severity === 'error') {
      failures.push(`Prose: [${v.ruleId}] ${v.message}. Fix: ${v.fix}`);
    }
  }

  const warnings: string[] = [];
  for (const v of heuristicViolations) {
    warnings.push(`Prose warning: [${v.ruleId}] ${v.message}. Suggestion: ${v.fix}`);
  }

  checkVoiceDifferentiation(text, warnings);

  // Metric threshold warnings — informational only, never block
  if (metrics.wordCount >= 50 && metrics.fleschKincaid < 35) {
    warnings.push(
      `Readability score ${metrics.fleschKincaid.toFixed(0)} (Flesch-Kincaid target: 60+) — prose may be too dense. Use shorter sentences and simpler words.`,
    );
  }
  if (metrics.wordCount > 100 && metrics.uniqueWordRatio < 0.5) {
    warnings.push(
      `Low vocabulary variety: ${(metrics.uniqueWordRatio * 100).toFixed(0)}% unique words — vary your word choices.`,
    );
  }
  if (metrics.dialogueToNarrationRatio > 0.65) {
    warnings.push(
      `Scene is ${(metrics.dialogueToNarrationRatio * 100).toFixed(0)}% dialogue — add grounding prose between exchanges.`,
    );
  }

  return { warnings, metrics };
}

/* ------------------------------------------------------------------ */
/*  Entry point — called from verify.ts scene check chain              */
/* ------------------------------------------------------------------ */

/**
 * Primary entry point for prose verification from HTML content.
 */
export function checkProseContent(
  html: string,
  failures: string[],
): { warnings: string[]; metrics: ProseMetrics } | null {
  const text = extractNarrativeText(html);
  if (!text) return null;
  return checkProseContentFromText(text, failures);
}
