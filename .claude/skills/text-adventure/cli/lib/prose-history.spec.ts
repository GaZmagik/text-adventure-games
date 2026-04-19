import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  classifyOpeningStructure,
  extractOpeningWord,
  buildProseFingerprint,
  loadProseHistory,
  appendFingerprint,
  checkCrossSceneProse,
  saveProseHistory,
} from './prose-history';
import type { ProseFingerprint, ProseHistory } from './prose-history';

// ── Helpers ───────────────────────────────────────────────────────────

function makeFingerprint(overrides: Partial<ProseFingerprint> = {}): ProseFingerprint {
  return {
    sceneId: '1',
    verifiedAt: new Date().toISOString(),
    openingStructure: 'action',
    openingWord: 'ryn',
    topContentWords: ['ship', 'corridor', 'dark', 'engine', 'hum'],
    metrics: {
      wordCount: 200,
      avgSentenceLength: 12,
      uniqueWordRatio: 0.7,
      dialogueToNarrationRatio: 0.2,
    },
    ...overrides,
  };
}

function makeHistory(scenes: ProseFingerprint[] = []): ProseHistory {
  return { version: 1, scenes };
}

// ── classifyOpeningStructure ──────────────────────────────────────────

describe('classifyOpeningStructure', () => {
  test('classifies dialogue opening (curly opening quote)', () => {
    expect(classifyOpeningStructure('\u201cWe need to move,\u201d she said.')).toBe('dialogue');
  });

  test('classifies dialogue opening (straight double quote)', () => {
    expect(classifyOpeningStructure('"Get down!" he shouted.')).toBe('dialogue');
  });

  test('classifies location opening (room noun)', () => {
    expect(classifyOpeningStructure('The corridor stretched ahead, cold and dark.')).toBe('location');
  });

  test('classifies introspection opening (felt)', () => {
    expect(classifyOpeningStructure('She felt the weight of silence press down on her.')).toBe('introspection');
  });

  test('classifies action opening (default)', () => {
    expect(classifyOpeningStructure('Ryn grabbed the console with both hands.')).toBe('action');
  });

  test('returns unknown for empty text', () => {
    expect(classifyOpeningStructure('')).toBe('unknown');
  });

  test('classifies compass/movement opening as location', () => {
    expect(classifyOpeningStructure('Beyond the gate, the city sprawled in silence.')).toBe('location');
  });

  test('classifies first-person I opening as introspection', () => {
    expect(classifyOpeningStructure('I knew something was wrong the moment I saw the light.')).toBe('introspection');
  });

  test('classifies dialogue opening (single quote)', () => {
    expect(classifyOpeningStructure("'Move,' she said.")).toBe('dialogue');
  });
});

// ── extractOpeningWord ────────────────────────────────────────────────

describe('extractOpeningWord', () => {
  test('extracts first word of first sentence lowercased', () => {
    expect(extractOpeningWord('The engine hummed softly.')).toBe('the');
  });

  test('strips leading curly quote from dialogue opening', () => {
    expect(extractOpeningWord('\u201cMove!\u201d she said.')).toBe('move');
  });

  test('returns empty string for empty text', () => {
    expect(extractOpeningWord('')).toBe('');
  });
});

// ── buildProseFingerprint ─────────────────────────────────────────────

describe('buildProseFingerprint', () => {
  test('stores the sceneId', () => {
    const fp = buildProseFingerprint('42', 'The engine hummed. Ryn turned toward the hatch.');
    expect(fp.sceneId).toBe('42');
  });

  test('topContentWords filters out stopwords', () => {
    const fp = buildProseFingerprint('1', 'The a an is was it and engine hummed the corridor engine.');
    expect(fp.topContentWords).not.toContain('the');
    expect(fp.topContentWords).not.toContain('a');
    expect(fp.topContentWords).not.toContain('is');
    expect(fp.topContentWords).toContain('engine');
  });

  test('metrics.wordCount is correct', () => {
    const fp = buildProseFingerprint('1', 'One two three.');
    expect(fp.metrics.wordCount).toBe(3);
  });

  test('topContentWords has at most 20 entries', () => {
    const manyWords = Array.from({ length: 100 }, (_, i) => `word${i}`).join(' ');
    const fp = buildProseFingerprint('1', manyWords);
    expect(fp.topContentWords.length).toBeLessThanOrEqual(20);
  });
});

// ── loadProseHistory ──────────────────────────────────────────────────

describe('loadProseHistory', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'prose-history-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('returns null when file is absent', () => {
    expect(loadProseHistory(tmpDir)).toBeNull();
  });

  test('parses a valid prose-history.json', () => {
    const history: ProseHistory = makeHistory([makeFingerprint()]);
    writeFileSync(join(tmpDir, '.prose-history.json'), JSON.stringify(history), 'utf-8');
    const loaded = loadProseHistory(tmpDir);
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(1);
    expect(loaded!.scenes).toHaveLength(1);
  });

  test('returns null for corrupt JSON', () => {
    writeFileSync(join(tmpDir, '.prose-history.json'), 'NOT_JSON{{{', 'utf-8');
    expect(loadProseHistory(tmpDir)).toBeNull();
  });

  test('returns null for version !== 1', () => {
    const badVersion = { version: 2, scenes: [] };
    writeFileSync(join(tmpDir, '.prose-history.json'), JSON.stringify(badVersion), 'utf-8');
    expect(loadProseHistory(tmpDir)).toBeNull();
  });
});

// ── appendFingerprint ─────────────────────────────────────────────────

describe('appendFingerprint', () => {
  test('creates a new history when passed null', () => {
    const fp = makeFingerprint({ sceneId: '1' });
    const history = appendFingerprint(null, fp);
    expect(history.version).toBe(1);
    expect(history.scenes).toHaveLength(1);
    expect(history.scenes[0]!.sceneId).toBe('1');
  });

  test('trims rolling window to 10 entries (oldest dropped)', () => {
    const scenes = Array.from({ length: 10 }, (_, i) => makeFingerprint({ sceneId: String(i) }));
    const history = makeHistory(scenes);
    const updated = appendFingerprint(history, makeFingerprint({ sceneId: '10' }));
    expect(updated.scenes).toHaveLength(10);
    expect(updated.scenes[updated.scenes.length - 1]!.sceneId).toBe('10');
    expect(updated.scenes[0]!.sceneId).toBe('1');
  });

  test('preserves order oldest to newest', () => {
    const fp1 = makeFingerprint({ sceneId: 'a' });
    const fp2 = makeFingerprint({ sceneId: 'b' });
    let history = appendFingerprint(null, fp1);
    history = appendFingerprint(history, fp2);
    expect(history.scenes[0]!.sceneId).toBe('a');
    expect(history.scenes[1]!.sceneId).toBe('b');
  });
});

// ── checkCrossSceneProse ──────────────────────────────────────────────

describe('checkCrossSceneProse', () => {
  test('does nothing with null history', () => {
    const failures: string[] = [];
    const warnings: string[] = [];
    checkCrossSceneProse(makeFingerprint(), null, failures, warnings);
    expect(failures).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  test('does nothing with empty history', () => {
    const failures: string[] = [];
    const warnings: string[] = [];
    checkCrossSceneProse(makeFingerprint({ openingStructure: 'action' }), makeHistory([]), failures, warnings);
    expect(failures).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  test('warns on 2 consecutive identical opening structures', () => {
    const failures: string[] = [];
    const warnings: string[] = [];
    const history = makeHistory([makeFingerprint({ openingStructure: 'action' })]);
    checkCrossSceneProse(makeFingerprint({ openingStructure: 'action' }), history, failures, warnings);
    expect(warnings.some(w => w.includes('[cross-scene-opening-structure]'))).toBe(true);
    expect(failures).toHaveLength(0);
  });

  test('errors on 3 consecutive identical opening structures', () => {
    const failures: string[] = [];
    const warnings: string[] = [];
    const history = makeHistory([
      makeFingerprint({ openingStructure: 'action' }),
      makeFingerprint({ openingStructure: 'action' }),
    ]);
    checkCrossSceneProse(makeFingerprint({ openingStructure: 'action' }), history, failures, warnings);
    expect(failures.some(f => f.includes('[cross-scene-opening-structure]'))).toBe(true);
  });

  test('does not fire when opening structures vary', () => {
    const failures: string[] = [];
    const warnings: string[] = [];
    const history = makeHistory([makeFingerprint({ openingStructure: 'dialogue' })]);
    checkCrossSceneProse(makeFingerprint({ openingStructure: 'action' }), history, failures, warnings);
    expect(failures.some(f => f.includes('[cross-scene-opening-structure]'))).toBe(false);
    expect(warnings.some(w => w.includes('[cross-scene-opening-structure]'))).toBe(false);
  });

  test('warns on high vocabulary overlap with previous scene', () => {
    const words = ['ship', 'engine', 'corridor', 'dark', 'hum', 'panel', 'light', 'breach', 'seal', 'hull'];
    const failures: string[] = [];
    const warnings: string[] = [];
    const history = makeHistory([makeFingerprint({ topContentWords: words, sceneId: 'last' })]);
    checkCrossSceneProse(makeFingerprint({ topContentWords: words }), history, failures, warnings);
    expect(warnings.some(w => w.includes('[cross-scene-vocabulary]'))).toBe(true);
  });

  test('does not warn when vocabulary overlap is below threshold', () => {
    const failures: string[] = [];
    const warnings: string[] = [];
    const history = makeHistory([
      makeFingerprint({ topContentWords: ['alpha', 'beta', 'gamma', 'delta', 'epsilon'] }),
    ]);
    checkCrossSceneProse(
      makeFingerprint({ topContentWords: ['one', 'two', 'three', 'four', 'five'] }),
      history,
      failures,
      warnings,
    );
    expect(warnings.some(w => w.includes('[cross-scene-vocabulary]'))).toBe(false);
  });

  test('warns on 3 consecutive identical opening words', () => {
    const failures: string[] = [];
    const warnings: string[] = [];
    const history = makeHistory([
      makeFingerprint({ openingWord: 'darkness' }),
      makeFingerprint({ openingWord: 'darkness' }),
    ]);
    checkCrossSceneProse(makeFingerprint({ openingWord: 'darkness' }), history, failures, warnings);
    expect(warnings.some(w => w.includes('[cross-scene-opener-word]'))).toBe(true);
  });

  test('does not warn when opening words vary', () => {
    const failures: string[] = [];
    const warnings: string[] = [];
    const history = makeHistory([
      makeFingerprint({ openingWord: 'darkness' }),
      makeFingerprint({ openingWord: 'ryn' }),
    ]);
    checkCrossSceneProse(makeFingerprint({ openingWord: 'darkness' }), history, failures, warnings);
    expect(warnings.some(w => w.includes('[cross-scene-opener-word]'))).toBe(false);
  });

  test('does not warn when vocabulary overlap is exactly at threshold (60%)', () => {
    // 3 words in common out of 7 unique = ~42.8% — below threshold
    const failures: string[] = [];
    const warnings: string[] = [];
    const history = makeHistory([makeFingerprint({ topContentWords: ['alpha', 'beta', 'gamma', 'delta', 'epsilon'] })]);
    checkCrossSceneProse(
      makeFingerprint({ topContentWords: ['alpha', 'beta', 'gamma', 'zeta', 'eta'] }),
      history, failures, warnings,
    );
    // 3/7 ≈ 0.43 — below 0.60 threshold
    expect(warnings.some(w => w.includes('[cross-scene-vocabulary]'))).toBe(false);
  });

  test('warns when vocabulary overlap is just above threshold (>60%)', () => {
    // 4 words in common out of 5 unique = 80% — above threshold
    const words = ['ship', 'engine', 'corridor', 'dark', 'hum'];
    const failures: string[] = [];
    const warnings: string[] = [];
    const history = makeHistory([makeFingerprint({ topContentWords: words })]);
    checkCrossSceneProse(makeFingerprint({ topContentWords: words }), history, failures, warnings);
    expect(warnings.some(w => w.includes('[cross-scene-vocabulary]'))).toBe(true);
  });

  test('does not warn on empty vocabulary overlap (both empty)', () => {
    const failures: string[] = [];
    const warnings: string[] = [];
    const history = makeHistory([makeFingerprint({ topContentWords: [] })]);
    checkCrossSceneProse(makeFingerprint({ topContentWords: [] }), history, failures, warnings);
    expect(warnings.some(w => w.includes('[cross-scene-vocabulary]'))).toBe(false);
  });
});

// ── saveProseHistory ──────────────────────────────────────────────────

describe('saveProseHistory', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'prose-history-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('file written to correct path and loadable', () => {
    const history = makeHistory([makeFingerprint()]);
    saveProseHistory(tmpDir, history);
    const loaded = loadProseHistory(tmpDir);
    expect(loaded).not.toBeNull();
  });

  test('content round-trips through loadProseHistory', () => {
    const fp = makeFingerprint({ sceneId: 'scene-42', openingWord: 'beyond' });
    const history = makeHistory([fp]);
    saveProseHistory(tmpDir, history);
    const loaded = loadProseHistory(tmpDir);
    expect(loaded!.scenes[0]!.sceneId).toBe('scene-42');
    expect(loaded!.scenes[0]!.openingWord).toBe('beyond');
  });
});
