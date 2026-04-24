// World generation command applies deterministic procedural maps, factions, NPCs, and quest seeds.
import type { CommandResult, WorldTheme } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState, saveState } from '../lib/state-store';
import { parseArgs } from '../lib/args';
import { generateWorld, isWorldTheme } from '../lib/worldgen';
import { applyWorldSeedPayload, buildWorldSeedPayload } from '../lib/map-adapter';
import { recordHistory } from './state';

const VALID_SUBCOMMANDS = ['generate'] as const;

async function handleGenerate(args: string[]): Promise<CommandResult> {
  const { flags, booleans } = parseArgs(args, ['apply']);
  const seed = flags.seed;
  const theme = flags.theme;
  const apply = booleans.has('apply');

  if (!seed) {
    return fail(
      'Missing --seed flag.',
      'Usage: tag world generate --seed <seed> [--theme space|dungeon|horror] [--apply]',
      'world generate',
    );
  }
  if (theme && !isWorldTheme(theme)) {
    return fail(`Invalid --theme value "${theme}".`, 'Use one of: space, dungeon, horror.', 'world generate');
  }

  const selectedTheme = theme ? (theme as WorldTheme) : undefined;
  const worldData = generateWorld(seed, selectedTheme);
  const payload = buildWorldSeedPayload(worldData);

  if (!apply) {
    return ok(
      {
        applied: false,
        worldData,
        mapState: payload.mapState,
        factions: payload.factions,
        rosterCount: payload.rosterMutations.length,
        codexCount: payload.codexMutations.length,
        questCount: payload.quests.length,
      },
      'world generate',
    );
  }

  const state = await tryLoadState();
  if (!state) return noState('world generate');

  const oldWorld = state.worldData ?? null;
  applyWorldSeedPayload(state, payload);
  recordHistory(state, 'world generate', 'worldData', oldWorld, worldData);
  await saveState(state);

  return ok(
    {
      applied: true,
      seed: worldData.seed,
      theme: worldData.theme,
      currentRoom: worldData.startRoom,
      roomCount: worldData.meta.roomCount,
      npcCount: worldData.meta.npcCount,
      factionCount: worldData.factions.factions.length,
      questCount: payload.quests.length,
    },
    'world generate',
  );
}

export async function handleWorld(args: string[]): Promise<CommandResult> {
  const subcommand = args[0];
  if (!subcommand) {
    return fail(
      'No subcommand provided.',
      `Valid subcommands: ${VALID_SUBCOMMANDS.join(', ')}. Run: tag world --help`,
      'world',
    );
  }

  switch (subcommand) {
    case 'generate':
      return handleGenerate(args.slice(1));
    default:
      return fail(
        `Unknown subcommand: "${subcommand}".`,
        `Valid subcommands: ${VALID_SUBCOMMANDS.join(', ')}`,
        'world',
      );
  }
}
