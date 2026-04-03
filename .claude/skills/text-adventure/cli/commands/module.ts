import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CommandResult, GmState } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState, saveState } from '../lib/state-store';
import { TIER1_MODULES } from '../lib/constants';

/** Module directory relative to import.meta.dir (cli/commands/) → ../../modules/ */
const MODULE_DIR = join(import.meta.dir, '..', '..', 'modules');

const TIER2_MODULES = [
  'scenarios', 'bestiary', 'story-architect', 'ship-systems', 'crew-manifest',
  'star-chart', 'geo-map', 'procedural-world-gen', 'world-history', 'lore-codex',
  'rpg-systems', 'ai-npc', 'atmosphere', 'audio', 'pre-generated-characters',
];

const TIER3_MODULES = [
  'adventure-exporting', 'adventure-authoring', 'arc-patterns', 'genre-mechanics',
];

const TIERS: Record<number, readonly string[]> = {
  1: TIER1_MODULES,
  2: TIER2_MODULES,
  3: TIER3_MODULES,
};

function readModule(name: string): string | null {
  const path = join(MODULE_DIR, `${name}.md`);
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf-8');
}

function ensureModulesRead(state: GmState): string[] {
  state._modulesRead ??= [];
  return state._modulesRead;
}

async function activateOne(name: string): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) return noState();

  const content = readModule(name);
  if (content === null) {
    return fail(
      `Module "${name}" not found at modules/${name}.md.`,
      `Valid modules: ${[...TIER1_MODULES, ...TIER2_MODULES, ...TIER3_MODULES].join(', ')}`,
      'module',
    );
  }

  // Add to modulesActive if not present
  const addedToActive = !state.modulesActive.includes(name);
  if (addedToActive) state.modulesActive.push(name);

  // Add to _modulesRead
  const read = ensureModulesRead(state);
  const addedToRead = !read.includes(name);
  if (addedToRead) read.push(name);

  // Stamp prose-craft freshness epoch
  if (name === 'prose-craft') {
    state._proseCraftEpoch = state._compactionCount ?? 0;
  }

  await saveState(state);

  return ok({
    module: name,
    content,
    chars: content.length,
    addedToActive,
    addedToRead,
  }, 'module');
}

async function activateTier(tierStr: string): Promise<CommandResult> {
  const tier = Number(tierStr);
  const modules = TIERS[tier];
  if (!modules) {
    return fail(
      `Invalid tier "${tierStr}". Valid tiers: 1, 2, 3.`,
      'Usage: tag module activate-tier 1',
      'module',
    );
  }

  const state = await tryLoadState();
  if (!state) return noState();

  const read = ensureModulesRead(state);
  const results: { name: string; content: string; chars: number }[] = [];

  for (const name of modules) {
    const content = readModule(name);
    if (content === null) continue;

    if (!state.modulesActive.includes(name)) state.modulesActive.push(name);
    if (!read.includes(name)) read.push(name);
    if (name === 'prose-craft') {
      state._proseCraftEpoch = state._compactionCount ?? 0;
    }

    results.push({ name, content, chars: content.length });
  }

  await saveState(state);

  return ok({
    tier,
    modules: results,
    totalChars: results.reduce((sum, m) => sum + m.chars, 0),
    count: results.length,
  }, 'module');
}

async function status(): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) return noState();

  const active = state.modulesActive;
  const read = ensureModulesRead(state);
  const unread = active.filter(m => !read.includes(m));

  return ok({
    active,
    read: [...read],
    unread,
    allRead: unread.length === 0,
  }, 'module');
}

export async function handleModule(args: string[]): Promise<CommandResult> {
  const subcommand = args[0];

  if (!subcommand) {
    return fail(
      'No subcommand provided.',
      'Usage: tag module activate <name> | activate-tier <N> | status',
      'module',
    );
  }

  switch (subcommand) {
    case 'activate':
      if (!args[1]) return fail('No module name provided.', 'Usage: tag module activate <name>', 'module');
      return activateOne(args[1]);
    case 'activate-tier':
      if (!args[1]) return fail('No tier provided.', 'Usage: tag module activate-tier <N>', 'module');
      return activateTier(args[1]);
    case 'status':
      return status();
    default:
      return fail(
        `Unknown subcommand: ${subcommand}`,
        'Valid subcommands: activate, activate-tier, status',
        'module',
      );
  }
}
