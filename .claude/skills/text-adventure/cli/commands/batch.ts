import type { CommandResult, GmState } from '../types';
import { ok, fail } from '../lib/errors';
import {
  flushStateStoreContext,
  tryLoadState,
  withStateStoreContext,
} from '../lib/state-store';
import { parseArgs } from '../lib/args';
import { FORBIDDEN_KEYS, MUTATING_COMMANDS } from '../lib/constants';
import { handleState } from './state';
import { handleCompute } from './compute';
import { handleSave } from './save';
import { handleRender } from './render';
import { handleQuest } from './quest';
import { handleRules } from './rules';
import { handleModule } from './module';
import { handleExport } from './export';
import { handleVerify } from './verify';
import { handleStyle } from './style';
import { handleSetup } from './setup';
import { handleScenario } from './scenario';
import { handleLore } from './lore';
import { handleSettings } from './settings';
import { handleProseCheck } from './prose-check';
import { handleProseGate } from './prose-gate';

type ParsedLine = {
  raw: string;
  label?: string | undefined;
  command: string;
  args: string[];
}

function parseLine(line: string): ParsedLine | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const tokens = tokenizeCommand(trimmed);
  if (tokens.length === 0) return null;

  let label: string | undefined;
  if (tokens.length >= 3 && tokens[tokens.length - 2] === 'as') {
    const candidate = tokens[tokens.length - 1]!;
    if (!FORBIDDEN_KEYS.has(candidate)) {
      label = candidate;
      tokens.splice(tokens.length - 2, 2);
    }
  }

  const command = tokens[0]!;
  const args = tokens.slice(1);

  return { raw: trimmed, label, command, args };
}

function splitBatchCommands(input: string): string[] {
  const commands: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  let escape = false;
  let braceDepth = 0;
  let bracketDepth = 0;

  for (const ch of input) {
    if (escape) {
      current += ch;
      escape = false;
      continue;
    }

    if (quote) {
      current += ch;
      if (ch === '\\') {
        escape = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === '{') {
      braceDepth += 1;
      current += ch;
      continue;
    }
    if (ch === '}') {
      braceDepth = Math.max(0, braceDepth - 1);
      current += ch;
      continue;
    }
    if (ch === '[') {
      bracketDepth += 1;
      current += ch;
      continue;
    }
    if (ch === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      current += ch;
      continue;
    }
    if (ch === ';' && braceDepth === 0 && bracketDepth === 0) {
      const trimmed = current.trim();
      if (trimmed) commands.push(trimmed);
      current = '';
      continue;
    }
    current += ch;
  }

  const tail = current.trim();
  if (tail) commands.push(tail);
  return commands;
}

function tokenizeCommand(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  let escape = false;
  let braceDepth = 0;
  let bracketDepth = 0;

  const pushCurrent = () => {
    if (!current) return;
    const quoted = current.length >= 2
      && ((current.startsWith('"') && current.endsWith('"'))
        || (current.startsWith("'") && current.endsWith("'")));
    tokens.push(quoted ? current.slice(1, -1) : current);
    current = '';
  };

  for (const ch of input) {
    if (escape) {
      current += ch;
      escape = false;
      continue;
    }

    if (quote) {
      current += ch;
      if (ch === '\\') {
        escape = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === '{') {
      braceDepth += 1;
      current += ch;
      continue;
    }
    if (ch === '}') {
      braceDepth = Math.max(0, braceDepth - 1);
      current += ch;
      continue;
    }
    if (ch === '[') {
      bracketDepth += 1;
      current += ch;
      continue;
    }
    if (ch === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      current += ch;
      continue;
    }
    if (/\s/.test(ch) && braceDepth === 0 && bracketDepth === 0) {
      pushCurrent();
      continue;
    }
    current += ch;
  }

  pushCurrent();
  return tokens;
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
  const handler = BATCH_COMMAND_HANDLERS[command];
  if (!handler) {
    return fail(`Unknown command in batch: ${command}`, 'tag --help', 'batch');
  }
  return handler(args);
}

export const BATCH_COMMAND_HANDLERS: Record<string, (args: string[]) => Promise<CommandResult>> = {
  state: handleState,
  compute: handleCompute,
  save: handleSave,
  render: handleRender,
  quest: handleQuest,
  rules: handleRules,
  export: handleExport,
  verify: handleVerify,
  module: handleModule,
  style: handleStyle,
  setup: handleSetup,
  scenario: handleScenario,
  lore: handleLore,
  settings: handleSettings,
  'prose-check': handleProseCheck,
  'prose-gate': handleProseGate,
};

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

  const lines = splitBatchCommands(commands);

  const MAX_BATCH_COMMANDS = 100;
  if (lines.length > MAX_BATCH_COMMANDS) {
    return fail(`Batch too large: ${lines.length} commands (max ${MAX_BATCH_COMMANDS}).`, 'Split into smaller batches.', 'batch');
  }
  const results: CommandResult[] = [];
  const labelled: Record<string, unknown> = {};
  const errors: { line: number; raw: string; error: string }[] = [];
  let didMutate = false;

  let stateSnapshot: GmState | null = null;
  let persistedWrites = 0;
  let bufferedWrites = 0;

  if (dryRun) {
    for (let i = 0; i < lines.length; i++) {
      const parsedLine = parseLine(lines[i]!);
      if (!parsedLine) continue;

      const resolvedArgs = resolveReferences(parsedLine.args, labelled);
      let hasUnresolvedRef = false;
      for (const arg of resolvedArgs) {
        if (arg.startsWith('$') && arg.length > 1 && !arg.startsWith('$$')) {
          errors.push({ line: i, raw: parsedLine.raw, error: `Unresolved reference: ${arg}` });
          hasUnresolvedRef = true;
        }
      }
      if (hasUnresolvedRef) continue;

      results.push({
        ok: true,
        command: `${parsedLine.command} ${resolvedArgs.join(' ')}`.trim(),
      });
      if (parsedLine.label) {
        labelled[parsedLine.label] = undefined;
      }
    }
  } else {
    const contextResult = await withStateStoreContext(async () => {
      for (let i = 0; i < lines.length; i++) {
        const parsedLine = parseLine(lines[i]!);
        if (!parsedLine) continue;

        const resolvedArgs = resolveReferences(parsedLine.args, labelled);

        let hasUnresolvedRef = false;
        for (const arg of resolvedArgs) {
          if (arg.startsWith('$') && arg.length > 1 && !arg.startsWith('$$')) {
            errors.push({ line: i, raw: parsedLine.raw, error: `Unresolved reference: ${arg}` });
            hasUnresolvedRef = true;
          }
        }
        if (hasUnresolvedRef) continue;

        let result: CommandResult;
        try {
          result = await dispatch(parsedLine.command, resolvedArgs);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          result = fail(message, `Check batch command ${i + 1}: ${parsedLine.raw}`, 'batch');
        }

        results.push(result);
        if (MUTATING_COMMANDS.has(parsedLine.command)) didMutate = true;

        if (parsedLine.label && !FORBIDDEN_KEYS.has(parsedLine.label)) {
          labelled[parsedLine.label] = result.data;
        }

        if (!result.ok) {
          errors.push({ line: i, raw: parsedLine.raw, error: result.error?.message ?? 'Unknown error' });
        }
      }

      try {
        if (didMutate) {
          stateSnapshot = await flushStateStoreContext();
        } else {
          stateSnapshot = await tryLoadState();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push({ line: -1, raw: '(post-batch flush)', error: message });
      }
    });

    persistedWrites = contextResult.stats.diskWrites;
    bufferedWrites = contextResult.stats.virtualWrites;
  }

  return ok({
    results,
    labelled,
    errors,
    dryRun,
    state_snapshot: stateSnapshot,
    commandCount: results.length,
    ...(dryRun ? {} : { bufferedWrites, persistedWrites }),
  }, 'batch');
}
