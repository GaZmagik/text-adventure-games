import type { CommandResult, GmState } from '../types';
import { ok, fail } from '../lib/errors';
import { tryLoadState } from '../lib/state-store';
import { parseArgs } from '../lib/args';
import { FORBIDDEN_KEYS, MUTATING_COMMANDS } from '../lib/constants';
import { handleState } from './state';
import { handleCompute } from './compute';
import { handleSave } from './save';
import { handleRender } from './render';

type ParsedLine = {
  raw: string;
  label?: string | undefined;
  command: string;
  args: string[];
}

function parseLine(line: string): ParsedLine | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  let label: string | undefined;
  let working = trimmed;

  // Extract trailing "as <label>"
  const asMatch = working.match(/\s+as\s+(\S+)\s*$/);
  if (asMatch) {
    label = asMatch[1];
    working = working.slice(0, -asMatch[0].length);
  }

  const tokens = working.split(/\s+/);
  const command = tokens[0]!;
  const args = tokens.slice(1);

  return { raw: trimmed, label, command, args };
}

function resolveReferences(
  args: string[],
  labelled: Record<string, unknown>,
): string[] {
  return args.map(arg => {
    if (!arg.startsWith('$')) return arg;

    const ref = arg.slice(1); // Remove $
    const parts = ref.split('.');
    const labelName = parts[0]!;

    let value: unknown = labelled[labelName];
    if (value === undefined) return arg; // Unresolved — leave as-is

    // Navigate dot path
    for (let i = 1; i < parts.length; i++) {
      if (FORBIDDEN_KEYS.has(parts[i]!)) return arg;
      if (value === null || value === undefined) return arg;
      if (typeof value === 'object') {
        value = (value as Record<string, unknown>)[parts[i]!];
      } else {
        return arg;
      }
    }

    return String(value);
  });
}

async function dispatch(command: string, args: string[]): Promise<CommandResult> {
  switch (command) {
    case 'state': return handleState(args);
    case 'compute': return handleCompute(args);
    case 'save': return handleSave(args);
    case 'render':
      return handleRender(args);
    default:
      return fail(`Unknown command in batch: ${command}`, 'tag --help', 'batch');
  }
}

export async function handleBatch(args: string[]): Promise<CommandResult> {
  const parsed = parseArgs(args, ['dry-run']);
  const dryRun = parsed.booleans.has('dry-run');
  const commands = parsed.flags.commands;
  if (!commands) {
    return fail(
      'No commands provided. Use --commands "cmd1; cmd2" or pipe via stdin.',
      'tag batch --commands "state get character.hp; compute contest CHA merchant_01"',
      'batch',
    );
  }

  // WARNING: Naive semicolon split — will break JSON values containing semicolons.
  // A proper fix would support quoting/escaping, but for v1.3.0 this is an accepted limitation.
  // Batch commands should avoid semicolons in string values.
  const lines = commands.split(';').map(s => s.trim()).filter(Boolean);

  const MAX_BATCH_COMMANDS = 100;
  if (lines.length > MAX_BATCH_COMMANDS) {
    return fail(`Batch too large: ${lines.length} commands (max ${MAX_BATCH_COMMANDS}).`, 'batch', 'Split into smaller batches.');
  }
  const results: CommandResult[] = [];
  const labelled: Record<string, unknown> = {};
  const errors: { line: number; raw: string; error: string }[] = [];
  let didMutate = false;

  for (let i = 0; i < lines.length; i++) {
    const parsedLine = parseLine(lines[i]!);
    if (!parsedLine) continue;

    const resolvedArgs = resolveReferences(parsedLine.args, labelled);

    // Warn on unresolved $ref labels — skip command entirely if any are found
    let hasUnresolvedRef = false;
    for (const arg of resolvedArgs) {
      if (arg.startsWith('$') && arg.length > 1 && !arg.startsWith('$$')) {
        errors.push({ line: i, raw: parsedLine.raw, error: `Unresolved reference: ${arg}` });
        hasUnresolvedRef = true;
      }
    }
    if (hasUnresolvedRef) continue; // Skip command — unresolved reference would produce bad state

    if (dryRun) {
      results.push({
        ok: true,
        command: `${parsedLine.command} ${resolvedArgs.join(' ')}`,
        data: null,
      });
      if (parsedLine.label) {
        labelled[parsedLine.label] = null;
      }
      continue;
    }

    const result = await dispatch(parsedLine.command, resolvedArgs);
    results.push(result);
    if (MUTATING_COMMANDS.has(parsedLine.command)) didMutate = true;

    if (parsedLine.label && !FORBIDDEN_KEYS.has(parsedLine.label)) {
      labelled[parsedLine.label] = result.data;
    }

    if (!result.ok) {
      errors.push({ line: i, raw: parsedLine.raw, error: result.error?.message ?? 'Unknown error' });
    }
  }

  // Get final state snapshot — only if commands actually mutated state
  let stateSnapshot: GmState | null = null;
  if (!dryRun && didMutate) {
    stateSnapshot = await tryLoadState();
  }

  return ok({
    results,
    labelled,
    errors,
    dryRun,
    state_snapshot: stateSnapshot,
    commandCount: results.length,
  }, 'batch');
}
