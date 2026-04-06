import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CommandResult } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState } from '../lib/state-store';
import { resolveSafeReadPath, readSafeTextFile } from '../lib/path-security';
import { extractNarrativeText, countWords } from '../lib/prose-checks';

// ── Baked-in constants ────────────────────────────────────────────

const PROSE_REVIEW_PROMPT = `You are an independent prose quality reviewer. Evaluate the text against 6 rules. Return ONLY a JSON object matching the schema — no prose, no preamble.

RULES:
1. voice_differentiation: If 2+ speakers, do they sound distinct in vocabulary, sentence structure, and personality — beyond utterance length? PASS if fewer than 2 identified speakers.
2. exposition_dump: Does any stretch of 3+ consecutive sentences deliver backstory with no action beat, sensory detail, or POV reaction to ground it?
3. earned_length: Could this passage be 20%+ shorter without losing meaning, texture, or atmosphere?
4. thesaurus_abuse: Are there conspicuously rare or overly formal word choices that pull the reader out of the scene?
5. sensory_quality: Where non-visual senses appear (sound, smell, temperature, texture, taste), are they specific and earned — or generic filler?
6. redefinition_overuse: Does the "not X — Y" or "not X. Y." redefinition construction appear more than 2 times?

For each FAIL: include citations (short direct quotes) and a concrete suggestion. Count = number of instances for quantifiable rules.`;

const PROSE_REVIEW_SCHEMA = JSON.stringify({
  type: 'object',
  required: ['rules', 'total_pass', 'total_fail', 'overall'],
  properties: {
    rules: {
      type: 'object',
      required: ['voice_differentiation', 'exposition_dump', 'earned_length', 'thesaurus_abuse', 'sensory_quality', 'redefinition_overuse'],
      properties: {
        voice_differentiation: { $ref: '#/$defs/rule_result' },
        exposition_dump:       { $ref: '#/$defs/rule_result' },
        earned_length:         { $ref: '#/$defs/rule_result' },
        thesaurus_abuse:       { $ref: '#/$defs/rule_result' },
        sensory_quality:       { $ref: '#/$defs/rule_result' },
        redefinition_overuse:  { $ref: '#/$defs/rule_result' },
      },
    },
    total_pass: { type: 'number' },
    total_fail: { type: 'number' },
    overall:    { type: 'string', enum: ['PASS', 'FAIL'] },
  },
  $defs: {
    rule_result: {
      type: 'object',
      required: ['result'],
      properties: {
        result:     { type: 'string', enum: ['PASS', 'FAIL'] },
        count:      { type: 'number' },
        citations:  { type: 'array', items: { type: 'string' } },
        suggestion: { type: 'string' },
      },
    },
  },
});

const MANUAL_CHECKLIST = [
  { id: 'voice_differentiation', question: 'Do speakers sound distinct beyond utterance length — in vocabulary, rhythm, personality?' },
  { id: 'exposition_dump', question: 'Any 3+ consecutive sentences of backstory with no action beat or sensory grounding?' },
  { id: 'earned_length', question: 'Could this be 20%+ shorter without losing meaning, texture, or atmosphere?' },
  { id: 'thesaurus_abuse', question: 'Any conspicuously rare vocabulary that pulls the reader out of the scene?' },
  { id: 'sensory_quality', question: 'Where non-visual senses appear, are they specific and earned — or generic?' },
  { id: 'redefinition_overuse', question: 'Does the "not X — Y" construction appear more than 2 times?' },
] as const;

const INPUT_FILE = join(tmpdir(), 'prose-check-input.txt');
const OUTPUT_FILE = join(tmpdir(), 'prose-check-result.json');

// ── Shell command builder ─────────────────────────────────────────

function buildCommand(): string {
  const escapedPrompt = PROSE_REVIEW_PROMPT.replace(/'/g, "'\\''");
  const escapedSchema = PROSE_REVIEW_SCHEMA.replace(/'/g, "'\\''");
  return `claude -p --model sonnet --permission-mode bypassPermissions --system-prompt '${escapedPrompt}' --json-schema '${escapedSchema}' < '${INPUT_FILE}' > '${OUTPUT_FILE}' 2>&1`;
}

// ── Handler ───────────────────────────────────────────────────────

export async function handleProseCheck(args: string[]): Promise<CommandResult> {
  const filePath = args[0];

  if (!filePath) {
    return fail('Missing path.', 'Usage: tag prose-check <path>', 'prose-check');
  }

  let safePath: string;
  try {
    const resolved = resolveSafeReadPath(filePath, { kind: 'Prose check', extensions: ['.html', '.htm'] });
    if (!resolved) {
      return fail(`Invalid file path: ${filePath}`, 'Path must start with /, ./, ../, or ~/ or end with .html or .htm.', 'prose-check');
    }
    safePath = resolved;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return fail(msg, 'Run tag render first to generate the scene HTML.', 'prose-check');
  }

  let html: string;
  try {
    html = await readSafeTextFile(safePath, 'Prose check');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return fail(msg, 'Run tag render first to generate the scene HTML.', 'prose-check');
  }

  const state = await tryLoadState();
  if (!state) return noState('prose-check');
  const prose = extractNarrativeText(html);

  if (!prose) {
    return ok({
      proseExtracted: false,
      message: 'No narrative text found in HTML. Prose check skipped.',
    }, 'prose-check');
  }

  const wordCount = countWords(prose);
  const mode = state.worldFlags?.proseMode === 'llm' ? 'llm' : 'manual';

  if (mode === 'llm') {
    try {
      writeFileSync(INPUT_FILE, prose, { encoding: 'utf-8', mode: 0o600 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return fail(`Could not write prose input file: ${msg}`, 'Check /tmp is writable and has sufficient space.', 'prose-check');
    }
    return ok({
      mode: 'llm',
      proseExtracted: true,
      wordCount,
      inputFile: INPUT_FILE,
      outputFile: OUTPUT_FILE,
      command: buildCommand(),
      nextStep: `Run the command above via claude-code:Bash (ignore 'failed' — it runs). Then: tag prose-gate --llm ${OUTPUT_FILE}`,
      message: 'LLM prose review required. Run the command above.',
    }, 'prose-check');
  }

  // Default: manual
  return ok({
    mode: 'manual',
    proseExtracted: true,
    wordCount,
    checklist: MANUAL_CHECKLIST,
    nextStep: 'Review your prose against each item. When satisfied: tag prose-gate --manual',
    message: 'Manual prose self-review required.',
  }, 'prose-check');
}
