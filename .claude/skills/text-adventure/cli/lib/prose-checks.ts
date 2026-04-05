// Deterministic prose content analysis engine — no LLM dependency.
// Evaluates narrative text against data-driven rules from prose-rules.ts.

import { stripHtml } from './verify-checks';
import {
  PATTERN_RULES,
  HEURISTIC_RULES,
  NON_ADVERBS,
} from '../data/prose-rules';
import type {
  PatternRule,
  HeuristicRule,
  ProseViolation,
  ProseMetrics,
} from '../data/prose-rules';

/* ------------------------------------------------------------------ */
/*  Text extraction                                                    */
/* ------------------------------------------------------------------ */

const NARRATIVE_PATTERN = /<div\b[^>]*(?:id\s*=\s*(['"])narrative\1|class\s*=\s*(['"])[^'"]*\bnarrative\b[^'"]*\2)[^>]*>([\s\S]*?)<\/div>/gi;

/** Extract and concatenate narrative text from scene HTML, stripping tags. */
export function extractNarrativeText(html: string): string | null {
  const blocks: string[] = [];
  let match: RegExpExecArray | null;
  NARRATIVE_PATTERN.lastIndex = 0;
  while ((match = NARRATIVE_PATTERN.exec(html)) !== null) {
    blocks.push(stripHtml(match[3]!));
  }
  if (blocks.length === 0) return null;
  return blocks.join('\n\n');
}

/* ------------------------------------------------------------------ */
/*  Splitting utilities                                                */
/* ------------------------------------------------------------------ */

export function splitSentences(text: string): string[] {
  if (!text.trim()) return [];
  return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
}

export function splitParagraphs(text: string): string[] {
  return text.split(/\n\n+/).filter(p => p.trim().length > 0);
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/* ------------------------------------------------------------------ */
/*  Tier 1: Pattern rule evaluation                                    */
/* ------------------------------------------------------------------ */

export function evaluatePatternRules(
  text: string,
  rules: readonly PatternRule[] = PATTERN_RULES,
): ProseViolation[] {
  const violations: ProseViolation[] = [];

  for (const rule of rules) {
    const re = new RegExp(rule.pattern.source, rule.pattern.flags);
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

  const dialogueChars = (text.match(/[""\u201c][^""\u201d]*[""\u201d]/g) || [])
    .reduce((sum, q) => sum + q.length, 0);
  const totalChars = text.length || 1;
  const dialogueToNarrationRatio = dialogueChars / totalChars;

  const adverbs = words.filter(w => {
    const clean = w.replace(/[^a-z]/g, '');
    return clean.endsWith('ly') && clean.length > 2 && !NON_ADVERBS.has(clean);
  });
  const adverbPercentage = wordCount > 0 ? (adverbs.length / wordCount) * 100 : 0;

  return {
    wordCount,
    sentenceCount,
    avgSentenceLength,
    uniqueWordRatio,
    emDashPer100Words,
    dialogueToNarrationRatio,
    adverbPercentage,
  };
}

/* ------------------------------------------------------------------ */
/*  Entry point — called from verify.ts scene check chain              */
/* ------------------------------------------------------------------ */

export function checkProseContent(
  html: string,
  failures: string[],
): { warnings: string[]; metrics: ProseMetrics } | null {
  const text = extractNarrativeText(html);
  if (!text) return null;

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

  return { warnings, metrics };
}
