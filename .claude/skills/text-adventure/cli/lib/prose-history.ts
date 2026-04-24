// Cross-scene prose repetition fingerprinting for `tag verify`.
// Writes .prose-history.json to the state dir on each successful scene verify.
// Warnings only — never blocks verify.

import { join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { splitSentences, splitParagraphs } from './text-utils';
import type { ProseMetrics } from '../data/prose-rules';

// ── Types ─────────────────────────────────────────────────────────────

export type ParagraphStructure = 'dialogue' | 'action' | 'location' | 'introspection' | 'unknown';

export type ProseFingerprint = {
  sceneId: string;
  verifiedAt: string;
  openingStructure: ParagraphStructure;
  openingWord: string;
  topContentWords: string[];
  metrics: {
    wordCount: number;
    avgSentenceLength: number;
    uniqueWordRatio: number;
    dialogueToNarrationRatio: number;
  };
};

export type ProseHistory = {
  version: 1;
  scenes: ProseFingerprint[]; // ordered oldest → newest; max 10 entries
};

// ── Constants ─────────────────────────────────────────────────────────

const HISTORY_FILE = '.prose-history.json';
const MAX_HISTORY = 10;
const VOCAB_OVERLAP_THRESHOLD = 0.6;

// Common English stopwords — articles, prepositions, pronouns, auxiliaries
const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'shall',
  'can',
  'it',
  'its',
  'this',
  'that',
  'these',
  'those',
  'i',
  'me',
  'my',
  'we',
  'our',
  'you',
  'your',
  'he',
  'she',
  'him',
  'her',
  'his',
  'they',
  'them',
  'their',
  'not',
  'no',
  'so',
  'as',
  'if',
  'up',
  'out',
  'into',
  'over',
  'after',
  'then',
  'there',
  'about',
  'all',
  'which',
  'who',
  'what',
]);

// ── Opening structure classifier ──────────────────────────────────────

const LOCATION_NOUNS =
  /^(the|a|an)\s+(corridor|chamber|bay|dock|hull|room|hall|city|street|forest|courtyard|bridge|deck|plaza|alley|square|gate|passage|vault|airlock|hangar|hold|cabin|tunnel|cavern|warehouse|market|port|station)\b/i;
const LOCATION_COMPASS = /^(north|south|east|west|beyond|above|below|ahead)\b/i;
const INTROSPECTION_RE = /^(i\s|she\s|he\s|they\s).{0,40}(felt|knew|wondered|thought|remembered|realised|realized)\b/i;

export function classifyOpeningStructure(text: string): ParagraphStructure {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length === 0) return 'unknown';
  const first = paragraphs[0]!.trim();
  if (first.length < 3) return 'unknown';

  // Dialogue: starts with a quotation mark
  if (/^[\u201c"']/.test(first)) return 'dialogue';

  const firstSentence = splitSentences(first)[0] ?? first;

  // Introspection: first-person "I" or psychological verb pattern
  if (/^I\b/.test(firstSentence) || INTROSPECTION_RE.test(firstSentence)) return 'introspection';

  // Location: place noun or compass/movement word
  if (LOCATION_NOUNS.test(firstSentence) || LOCATION_COMPASS.test(firstSentence)) return 'location';

  return 'action';
}

export function extractOpeningWord(text: string): string {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length === 0) return '';
  const first = paragraphs[0]!.trim();
  const sentences = splitSentences(first);
  const firstSentence = (sentences[0] ?? first).trim();
  // Strip leading quote character (curly or straight)
  const stripped = firstSentence.replace(/^[\u201c"']/, '').trim();
  const word = stripped.split(/\s+/)[0] ?? '';
  return word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

// ── Top content words ─────────────────────────────────────────────────

function buildTopContentWords(text: string, max = 20): string[] {
  const freq = new Map<string, number>();
  for (const raw of text.toLowerCase().split(/\s+/)) {
    const w = raw.replace(/[^a-z0-9]/g, '');
    if (w.length > 2 && !STOPWORDS.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

// ── buildProseFingerprint ─────────────────────────────────────────────

export function buildProseFingerprint(
  sceneId: string,
  text: string,
  metricsHint?: Pick<ProseMetrics, 'wordCount' | 'avgSentenceLength' | 'uniqueWordRatio' | 'dialogueToNarrationRatio'>,
): ProseFingerprint {
  let metrics: ProseFingerprint['metrics'];

  if (metricsHint !== undefined) {
    metrics = {
      wordCount: metricsHint.wordCount,
      avgSentenceLength: metricsHint.avgSentenceLength,
      uniqueWordRatio: metricsHint.uniqueWordRatio,
      dialogueToNarrationRatio: metricsHint.dialogueToNarrationRatio,
    };
  } else {
    const words = text.trim() ? text.trim().toLowerCase().split(/\s+/) : [];
    const wordCount = words.length;
    const sentences = splitSentences(text);
    const sentenceCount = sentences.length;
    const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const uniqueWordRatio = wordCount > 0 ? new Set(words).size / wordCount : 0;
    const dialogueChars = (text.match(/["\u201c][^"\u201d]*["\u201d]/g) ?? []).reduce((sum, q) => sum + q.length, 0);
    const dialogueToNarrationRatio = text.length > 0 ? dialogueChars / text.length : 0;
    metrics = { wordCount, avgSentenceLength, uniqueWordRatio, dialogueToNarrationRatio };
  }

  return {
    sceneId,
    verifiedAt: new Date().toISOString(),
    openingStructure: classifyOpeningStructure(text),
    openingWord: extractOpeningWord(text),
    topContentWords: buildTopContentWords(text),
    metrics,
  };
}

// ── Load / save ───────────────────────────────────────────────────────

function isProseFingerprint(x: unknown): x is ProseFingerprint {
  if (typeof x !== 'object' || x === null) return false;
  const f = x as Record<string, unknown>;
  return (
    typeof f.sceneId === 'string' &&
    typeof f.verifiedAt === 'string' &&
    typeof f.openingStructure === 'string' &&
    typeof f.openingWord === 'string' &&
    Array.isArray(f.topContentWords) &&
    typeof f.metrics === 'object' &&
    f.metrics !== null
  );
}

export function loadProseHistory(stateDir: string): ProseHistory | null {
  try {
    const raw = readFileSync(join(stateDir, HISTORY_FILE), 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as Record<string, unknown>).version === 1 &&
      Array.isArray((parsed as Record<string, unknown>).scenes)
    ) {
      if (!((parsed as Record<string, unknown>).scenes as unknown[]).every(isProseFingerprint)) return null;
      return parsed as ProseHistory;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveProseHistory(stateDir: string, history: ProseHistory): void {
  const target = join(stateDir, HISTORY_FILE);
  const tmp = `${target}.tmp`;
  try {
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(tmp, JSON.stringify(history, null, 2), 'utf-8');
    renameSync(tmp, target);
  } catch (err) {
    console.error(`prose-history: failed to save ${target}: ${(err as Error).message}`);
    try {
      unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
}

// ── appendFingerprint ─────────────────────────────────────────────────

export function appendFingerprint(history: ProseHistory | null, fingerprint: ProseFingerprint): ProseHistory {
  const existing = history?.scenes ?? [];
  const scenes = [...existing, fingerprint].slice(-MAX_HISTORY);
  return { version: 1, scenes };
}

// ── Cross-scene checks ────────────────────────────────────────────────

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

export function checkCrossSceneProse(
  fingerprint: ProseFingerprint,
  history: ProseHistory | null,
  failures: string[],
  warnings: string[],
): void {
  if (!history || history.scenes.length === 0) return;

  const scenes = history.scenes;
  const prev = scenes[scenes.length - 1]!;
  const prevPrev = scenes.length >= 2 ? scenes[scenes.length - 2] : null;

  // 1. Consecutive opening structure: 2 in a row → warning; 3 in a row → error
  if (fingerprint.openingStructure !== 'unknown' && prev.openingStructure === fingerprint.openingStructure) {
    if (prevPrev?.openingStructure === fingerprint.openingStructure) {
      failures.push(
        `Prose: [cross-scene-opening-structure] Scene opens with a ${fingerprint.openingStructure} paragraph for the 3rd consecutive time. Vary how you open scenes.`,
      );
    } else {
      warnings.push(
        `Prose history: [cross-scene-opening-structure] Scene opens with a ${fingerprint.openingStructure} paragraph for the 2nd consecutive time. Consider varying your scene openings.`,
      );
    }
  }

  // 2. Vocabulary overlap with immediately previous scene (Jaccard > 60%)
  const overlap = jaccardSimilarity(fingerprint.topContentWords, prev.topContentWords);
  if (overlap > VOCAB_OVERLAP_THRESHOLD) {
    warnings.push(
      `Prose history: [cross-scene-vocabulary] ${Math.round(overlap * 100)}% vocabulary overlap with the previous scene (${prev.sceneId}). Introduce fresh words and imagery.`,
    );
  }

  // 3. Consecutive opening word (3 scenes in a row)
  if (
    prevPrev &&
    fingerprint.openingWord.length > 0 &&
    prev.openingWord === fingerprint.openingWord &&
    prevPrev.openingWord === fingerprint.openingWord
  ) {
    warnings.push(
      `Prose history: [cross-scene-opener-word] Scene opens with "${fingerprint.openingWord}" for the 3rd consecutive time. Vary your sentence openers.`,
    );
  }
}
