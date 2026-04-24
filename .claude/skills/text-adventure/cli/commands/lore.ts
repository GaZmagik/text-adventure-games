// Lore command handlers surface imported defaults, pre-generated characters, and lore pipeline status.
import type { CommandResult } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState } from '../lib/state-store';

async function defaults(): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) return noState();

  const d = state._loreDefaults ?? null;
  return ok(
    {
      defaults: d,
      ...(d
        ? {
            message: `Lore defaults: ${Object.entries(d)
              .map(([k, v]) => `${k}=${v}`)
              .join(', ')}`,
          }
        : {
            message:
              'No lore defaults found in state. Run `tag export load <file.lore.md>` to import lore with authored defaults.',
          }),
    },
    'lore defaults',
  );
}

async function pregen(): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) return noState();

  const chars = state._lorePregen ?? [];
  return ok(
    {
      count: chars.length,
      characters: chars,
      ...(chars.length > 0
        ? { message: `${chars.length} pre-generated character(s): ${chars.map(c => c.name).join(', ')}` }
        : {
            message:
              'No pre-generated characters found in state. Run `tag export load <file.lore.md>` to import lore with authored characters.',
          }),
    },
    'lore pregen',
  );
}

async function status(): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) return noState();

  const loreSource = state._loreSource ?? null;
  const hasDefaults = !!state._loreDefaults && Object.keys(state._loreDefaults).length > 0;
  const hasPregen = Array.isArray(state._lorePregen) && state._lorePregen.length > 0;
  const pregenModuleActive = state.modulesActive.includes('pre-generated-characters');

  const issues: string[] = [];
  if (hasPregen && !pregenModuleActive) {
    issues.push(
      `State has ${state._lorePregen!.length} pre-generated character(s) but pre-generated-characters module is not active. ` +
        'Run `tag module activate pre-generated-characters`.',
    );
  }
  if (!loreSource) {
    issues.push('No lore source loaded. Run `tag export load <file.lore.md>` to import adventure data.');
  }

  return ok(
    {
      loreSource,
      hasDefaults,
      hasPregen,
      pregenCount: hasPregen ? state._lorePregen!.length : 0,
      defaultKeys: hasDefaults ? Object.keys(state._loreDefaults!) : [],
      pregenModuleActive,
      issues,
      ...(issues.length === 0
        ? { message: 'Lore pipeline healthy.' }
        : { message: `Lore pipeline has ${issues.length} issue(s).` }),
    },
    'lore status',
  );
}

export async function handleLore(args: string[]): Promise<CommandResult> {
  const subcommand = args[0];

  if (!subcommand) {
    return fail('No subcommand provided.', 'Usage: tag lore defaults | pregen | status', 'lore');
  }

  switch (subcommand) {
    case 'defaults':
      return defaults();
    case 'pregen':
      return pregen();
    case 'status':
      return status();
    default:
      return fail(`Unknown subcommand: ${subcommand}`, 'Valid subcommands: defaults, pregen, status', 'lore');
  }
}
