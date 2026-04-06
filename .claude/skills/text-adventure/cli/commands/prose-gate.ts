import { existsSync, readFileSync } from 'node:fs';
import type { CommandResult } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState, saveState } from '../lib/state-store';

// ── Types ─────────────────────────────────────────────────────────

type RuleResult = {
  result: 'PASS' | 'FAIL';
  count?: number;
  citations?: string[];
  suggestion?: string;
};

type ProseReviewOutput = {
  rules: Record<string, RuleResult>;
  total_pass: number;
  total_fail: number;
  overall: 'PASS' | 'FAIL';
};

// ── Handler ───────────────────────────────────────────────────────

export async function handleProseGate(args: string[]): Promise<CommandResult> {
  const flag = args[0];

  if (!flag || (flag !== '--manual' && flag !== '--llm')) {
    return fail(
      flag ? `Unknown flag "${flag}".` : 'Missing flag.',
      'Usage: tag prose-gate --manual  OR  tag prose-gate --llm <path>',
      'prose-gate',
    );
  }

  // ── --manual ────────────────────────────────────────────────────

  if (flag === '--manual') {
    const state = await tryLoadState();
    if (!state) return noState('prose-gate');

    state.worldFlags.proseGatedAt = Date.now();
    await saveState(state);

    return ok({
      verified: true,
      mode: 'manual',
      clearance: 'PROSE GATE: MANUAL CLEARANCE — self-review certified. Proceed to show_widget.',
    }, 'prose-gate');
  }

  // ── --llm <path> ────────────────────────────────────────────────

  const resultPath = args[1];

  if (!resultPath || !existsSync(resultPath)) {
    return fail(
      resultPath ? `Result file not found: ${resultPath}` : 'Missing result file path.',
      'Run: tag prose-check <scene-path> to generate the LLM command first.',
      'prose-gate',
    );
  }

  let parsed: ProseReviewOutput;
  try {
    const raw = readFileSync(resultPath, 'utf-8');
    parsed = JSON.parse(raw) as ProseReviewOutput;
  } catch {
    return fail(
      'Malformed JSON in result file.',
      `Check the file at: ${resultPath}`,
      'prose-gate',
    );
  }

  const state = await tryLoadState();
  if (!state) return noState('prose-gate');

  // Collect failing rules
  const failingRules = Object.entries(parsed.rules ?? {}).filter(
    ([, rule]) => rule.result === 'FAIL',
  );

  const hasFailures = failingRules.length > 0 || parsed.overall !== 'PASS';

  if (hasFailures) {
    const failures = failingRules.map(([id, rule]) => {
      const count = rule.count ? ` (${rule.count})` : '';
      const suggestion = rule.suggestion ?? '';
      const citations = rule.citations?.map(c => `"${c}"`).join(', ') ?? '';
      return `[${id}] FAIL${count}: ${suggestion} ${citations}`.trim();
    });

    // If overall is FAIL but no individual rules failed, add a generic entry
    if (failures.length === 0 && parsed.overall === 'FAIL') {
      failures.push('[overall] FAIL: Review flagged as failed. Re-examine the prose.');
    }

    return ok({
      verified: false,
      mode: 'llm',
      failures,
      message: `${failingRules.length} prose rule(s) failed. Revise prose and re-run tag prose-check.`,
    }, 'prose-gate');
  }

  return ok({
    verified: true,
    mode: 'llm',
    clearance: 'PROSE GATE: LLM CLEARANCE — independent review passed. Proceed to show_widget.',
  }, 'prose-gate');
}
