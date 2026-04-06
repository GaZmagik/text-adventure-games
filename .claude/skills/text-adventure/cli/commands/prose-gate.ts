import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import type { CommandResult } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState, saveState } from '../lib/state-store';
import { resolveSafeReadPath, readSafeTextFile } from '../lib/path-security';
import { fnv32 } from '../lib/fnv32';
import { PROSE_GATE_FILE } from '../lib/constants';

// ── Gate file types ───────────────────────────────────────────────

type GateFile = {
  scenePath: string;
  sceneHash: string;
  mode: string;
  timestamp: number;
  deterministicErrors: string[];
  deterministicWarnings: string[];
  warningsAcknowledged: boolean;
};

type GateValidationResult =
  | { valid: true; gate: GateFile }
  | { valid: false; result: CommandResult };

// ── Gate file validation ──────────────────────────────────────────

function readAndValidateGate(command: string): GateValidationResult {
  // Read gate file
  let raw: string;
  try {
    raw = readFileSync(PROSE_GATE_FILE, 'utf-8');
  } catch {
    return {
      valid: false,
      result: fail(
        'prose-check has not been run on this scene.',
        'Run: tag prose-check <path> first.',
        command,
      ),
    };
  }

  // Parse gate file
  let gate: GateFile;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== 'object' || parsed === null ||
      typeof (parsed as Record<string, unknown>)['scenePath'] !== 'string' ||
      typeof (parsed as Record<string, unknown>)['sceneHash'] !== 'string'
    ) {
      throw new Error('bad shape');
    }
    gate = parsed as GateFile;
  } catch {
    return {
      valid: false,
      result: fail(
        'Gate file is corrupt or unreadable.',
        'Delete /tmp/prose-check.gate and re-run: tag prose-check <path>',
        command,
      ),
    };
  }

  // Verify scene hash
  let sceneHtml: string;
  try {
    sceneHtml = readFileSync(gate.scenePath, 'utf-8');
  } catch {
    return {
      valid: false,
      result: fail(
        `Scene file not found: ${gate.scenePath}`,
        'Re-run: tag prose-check <path>',
        command,
      ),
    };
  }

  if (fnv32(sceneHtml) !== gate.sceneHash) {
    return {
      valid: false,
      result: fail(
        'Scene has changed since prose-check was run.',
        'Re-run: tag prose-check <path> after editing prose.',
        command,
      ),
    };
  }

  // Block on deterministic errors (always)
  if (gate.deterministicErrors.length > 0) {
    const errList = gate.deterministicErrors.join('\n');
    return {
      valid: false,
      result: fail(
        `Prose errors must be fixed before proceeding:\n${errList}`,
        'Fix prose errors and re-run: tag prose-check <path>',
        command,
      ),
    };
  }

  // Block on unacknowledged warnings (first pass only)
  if (gate.deterministicWarnings.length > 0 && !gate.warningsAcknowledged) {
    const updatedGate = { ...gate, warningsAcknowledged: true };
    try {
      writeFileSync(PROSE_GATE_FILE, JSON.stringify(updatedGate), { encoding: 'utf-8', mode: 0o600 });
    } catch {
      // best effort
    }
    const warnList = gate.deterministicWarnings.join('\n');
    return {
      valid: false,
      result: fail(
        `Prose warnings (${gate.deterministicWarnings.length}):\n${warnList}`,
        'Warnings acknowledged. Re-run: tag prose-gate to proceed.',
        command,
      ),
    };
  }

  return { valid: true, gate };
}

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

// ── Type guards ───────────────────────────────────────────────────

function isRuleResult(v: unknown): v is RuleResult {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>)['result'] === 'string' &&
    ((v as Record<string, unknown>)['result'] === 'PASS' || (v as Record<string, unknown>)['result'] === 'FAIL')
  );
}

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

    const gateResult = readAndValidateGate('prose-gate');
    if (!gateResult.valid) return gateResult.result;

    try { unlinkSync(PROSE_GATE_FILE); } catch { /* already gone */ }
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

  const state = await tryLoadState();
  if (!state) return noState('prose-gate');

  const gateResult = readAndValidateGate('prose-gate');
  if (!gateResult.valid) return gateResult.result;

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

  let parsed: unknown;
  try {
    const raw = await readSafeTextFile(resultPath, 'Prose gate result');
    parsed = JSON.parse(raw);
  } catch (err) {
    const msg = err instanceof SyntaxError ? 'Malformed JSON in result file.' : `Could not read result file: ${err instanceof Error ? err.message : String(err)}`;
    return fail(msg, `Check the file at: ${resultPath}`, 'prose-gate');
  }

  // Shape validation — guard against well-formed JSON with wrong structure
  if (typeof parsed !== 'object' || parsed === null) {
    return fail('Result JSON missing required fields (rules, overall).', `Check the file at: ${resultPath}`, 'prose-gate');
  }

  const candidate = parsed as Record<string, unknown>;

  if (
    typeof candidate['overall'] !== 'string' ||
    typeof candidate['rules'] !== 'object' || candidate['rules'] === null ||
    Array.isArray(candidate['rules']) ||
    Object.keys(candidate['rules'] as object).length === 0
  ) {
    return fail('Result JSON missing required fields (rules, overall).', `Check the file at: ${resultPath}`, 'prose-gate');
  }

  // Per-rule type validation — guard against null/non-string result values
  const rulesObj = candidate['rules'] as Record<string, unknown>;
  for (const [ruleId, ruleEntry] of Object.entries(rulesObj)) {
    if (!isRuleResult(ruleEntry)) {
      return fail(
        `Malformed rule entry "${ruleId}": result must be "PASS" or "FAIL".`,
        'Check the LLM result file format.',
        'prose-gate',
      );
    }
  }

  const validParsed = parsed as ProseReviewOutput;

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

    // Do NOT delete gate file on LLM content failures
    return ok({
      verified: false,
      mode: 'llm',
      failures,
      message: `${failingRules.length} prose rule(s) failed. Revise prose and re-run tag prose-check.`,
    }, 'prose-gate');
  }

  // LLM pass — delete gate file
  try { unlinkSync(PROSE_GATE_FILE); } catch { /* already gone */ }
  state.worldFlags.proseGatedAt = Date.now();
  await saveState(state);

  return ok({
    verified: true,
    mode: 'llm',
    clearance: 'PROSE GATE: LLM CLEARANCE — independent review passed. Proceed to show_widget.',
  }, 'prose-gate');
}
