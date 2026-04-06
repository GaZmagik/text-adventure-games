import type { CommandResult } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState, saveState } from '../lib/state-store';
import { resolveSafeReadPath } from '../lib/path-security';

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

  const rawPath = args[1];

  if (!rawPath) {
    return fail(
      'Missing result file path.',
      'Run: tag prose-check <scene-path> to generate the LLM command first.',
      'prose-gate',
    );
  }

  let resultPath: string;
  try {
    const resolved = resolveSafeReadPath(rawPath, { kind: 'Prose gate result', extensions: ['.json'] });
    if (!resolved) {
      return fail(`Invalid file path: ${rawPath}`, 'Path must end with .json and be within a safe directory.', 'prose-gate');
    }
    resultPath = resolved;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return fail(msg, 'Run: tag prose-check <scene-path> to generate the LLM command first.', 'prose-gate');
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const fileStat = Bun.file(resultPath).size;
  if (fileStat > MAX_FILE_SIZE) {
    return fail(`Result file too large: ${resultPath} (${fileStat} bytes, max 10 MB).`, 'This is not a valid prose review result.', 'prose-gate');
  }

  let parsed: unknown;
  try {
    const raw = await Bun.file(resultPath).text();
    parsed = JSON.parse(raw);
  } catch (err) {
    const msg = err instanceof SyntaxError ? 'Malformed JSON in result file.' : `Could not read result file: ${err instanceof Error ? err.message : String(err)}`;
    return fail(msg, `Check the file at: ${resultPath}`, 'prose-gate');
  }

  // Shape validation — guard against well-formed JSON with wrong structure
  if (
    typeof parsed !== 'object' || parsed === null ||
    typeof (parsed as Record<string, unknown>).overall !== 'string' ||
    typeof (parsed as Record<string, unknown>).rules !== 'object' || (parsed as Record<string, unknown>).rules === null ||
    Array.isArray((parsed as Record<string, unknown>).rules) ||
    Object.keys((parsed as Record<string, unknown>).rules as object).length === 0
  ) {
    return fail('Result JSON missing required fields (rules, overall).', `Check the file at: ${resultPath}`, 'prose-gate');
  }

  const validParsed = parsed as ProseReviewOutput;

  const state = await tryLoadState();
  if (!state) return noState('prose-gate');

  // Collect failing rules
  const failingRules = Object.entries(validParsed.rules).filter(
    ([, rule]) => rule.result === 'FAIL',
  );

  const hasFailures = failingRules.length > 0 || validParsed.overall !== 'PASS';

  if (hasFailures) {
    const failures = failingRules.map(([id, rule]) => {
      const count = rule.count ? ` (${rule.count})` : '';
      const suggestion = rule.suggestion ?? '';
      const citations = rule.citations?.map(c => `"${c}"`).join(', ') ?? '';
      return `[${id}] FAIL${count}: ${suggestion} ${citations}`.trim();
    });

    // If overall is FAIL but no individual rules failed, add a generic entry
    if (failures.length === 0 && validParsed.overall === 'FAIL') {
      failures.push('[overall] FAIL: Review flagged as failed. Re-examine the prose.');
    }

    return ok({
      verified: false,
      mode: 'llm',
      failures,
      message: `${failingRules.length} prose rule(s) failed. Revise prose and re-run tag prose-check.`,
    }, 'prose-gate');
  }

  state.worldFlags.proseGatedAt = Date.now();
  await saveState(state);

  return ok({
    verified: true,
    mode: 'llm',
    clearance: 'PROSE GATE: LLM CLEARANCE — independent review passed. Proceed to show_widget.',
  }, 'prose-gate');
}
