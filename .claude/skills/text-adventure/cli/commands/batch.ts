import type { CommandResult } from '../types';
import { ok, fail } from '../lib/errors';
import { loadState, stateExists } from '../lib/state-store';
import { parseArgs } from '../lib/args';
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

  const lines = commands.split(';').map(s => s.trim()).filter(Boolean);
  const results: CommandResult[] = [];
  const labelled: Record<string, unknown> = {};
  const errors: { line: number; raw: string; error: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const parsedLine = parseLine(lines[i]);
    if (!parsedLine) continue;

    const resolvedArgs = resolveReferences(parsedLine.args, labelled);

    // Warn on unresolved $ref labels
    for (const arg of resolvedArgs) {
      if (arg.startsWith('$') && arg.length > 1 && !arg.startsWith('$$')) {
        errors.push({ line: i, raw: parsedLine.raw, error: `Unresolved reference: ${arg}` });
      }
    }

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

    if (parsedLine.label) {
      labelled[parsedLine.label] = result.data;
    }

    if (!result.ok) {
      errors.push({ line: i, raw: parsedLine.raw, error: result.error?.message ?? 'Unknown error' });
    }
  }

  // Get final state snapshot
  let stateSnapshot: Record<string, unknown> | null = null;
  if (!dryRun && await stateExists()) {
    stateSnapshot = await loadState() as unknown as Record<string, unknown>; // GmState lacks index sig
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
