import type { CommandResult } from '../types';
import { ok, fail } from '../lib/errors';
import { loadState, stateExists } from '../lib/state-store';
import { handleState } from './state';
import { handleCompute } from './compute';
import { handleSave } from './save';
import { handleRender } from './render';

interface ParsedLine {
  raw: string;
  label?: string;
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
  const command = tokens[0];
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
    const labelName = parts[0];

    let value: unknown = labelled[labelName];
    if (value === undefined) return arg; // Unresolved — leave as-is

    // Navigate dot path
    for (let i = 1; i < parts.length; i++) {
      if (value === null || value === undefined) return arg;
      if (typeof value === 'object') {
        value = (value as Record<string, unknown>)[parts[i]];
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

function parseInput(args: string[]): { lines: string[]; dryRun: boolean } | null {
  let dryRun = false;
  let commands: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--commands' && i + 1 < args.length) {
      commands = args[i + 1];
      i++;
    }
  }

  if (!commands) return null;

  const lines = commands.split(';').map(s => s.trim()).filter(Boolean);
  return { lines, dryRun };
}

export async function handleBatch(args: string[]): Promise<CommandResult> {
  const input = parseInput(args);
  if (!input) {
    return fail(
      'No commands provided. Use --commands "cmd1; cmd2" or pipe via stdin.',
      'tag batch --commands "state get character.hp; compute contest CHA merchant_01"',
      'batch',
    );
  }

  const { lines, dryRun } = input;
  const results: CommandResult[] = [];
  const labelled: Record<string, unknown> = {};
  const errors: { line: number; raw: string; error: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLine(lines[i]);
    if (!parsed) continue;

    const resolvedArgs = resolveReferences(parsed.args, labelled);

    if (dryRun) {
      results.push({
        ok: true,
        command: `${parsed.command} ${resolvedArgs.join(' ')}`,
        data: null,
        validated: true,
      });
      if (parsed.label) {
        labelled[parsed.label] = null;
      }
      continue;
    }

    const result = await dispatch(parsed.command, resolvedArgs);
    results.push(result);

    if (parsed.label) {
      labelled[parsed.label] = result.data;
    }

    if (!result.ok) {
      errors.push({ line: i, raw: parsed.raw, error: result.error?.message ?? 'Unknown error' });
    }
  }

  // Get final state snapshot
  let stateSnapshot: Record<string, unknown> | null = null;
  if (!dryRun && await stateExists()) {
    stateSnapshot = await loadState() as unknown as Record<string, unknown>;
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
