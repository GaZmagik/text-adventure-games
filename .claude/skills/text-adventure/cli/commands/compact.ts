// tag CLI — Compact Command
// Recovery from context compaction. Clears the compaction block marker,
// resets freshness epochs so render gates re-enforce module/style re-reads,
// and returns the recovery steps the GM must follow.

import type { CommandResult } from '../types';
import { ok, fail } from '../lib/errors';
import { tryLoadState, saveState, backupState } from '../lib/state-store';
import { clearCompactionBlock } from '../lib/workflow-markers';

async function restore(): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) {
    clearCompactionBlock();
    return ok({
      restored: true,
      loreSource: null,
      modulesActive: [],
      nextSteps: [
        'No game state found. Run `tag state reset` to create one.',
      ],
    }, 'compact restore');
  }

  // Backup before mutation — consistent with setup.ts and export.ts
  await backupState();

  // Reset freshness tracking — forces re-reads through render gates
  state._modulesRead = [];
  delete state._proseCraftEpoch;
  delete state._styleReadEpoch;
  await saveState(state);

  // Clear block AFTER successful save — if save throws, block stays active
  clearCompactionBlock();

  const loreSource = state._loreSource ?? null;
  const modulesActive = state.modulesActive ?? [];
  const nextSteps: string[] = [];

  if (loreSource) {
    nextSteps.push(`Lore source on record: ${loreSource}. Run \`tag export load ${loreSource}\` if world data needs reloading.`);
  }
  nextSteps.push('Run `tag module activate-tier 1` then `tag module activate-tier 2` to reload module specs.');
  nextSteps.push('Run `tag style activate` to reload visual style guidance.');
  nextSteps.push('Run `tag state sync --apply --scene <current>` to verify state consistency before next scene.');

  return ok({
    restored: true,
    loreSource,
    modulesActive,
    nextSteps,
  }, 'compact restore');
}

export async function handleCompact(args: string[]): Promise<CommandResult> {
  const sub = args[0];
  switch (sub) {
    case 'restore': return restore();
    default:
      return fail(
        `Unknown compact subcommand: ${sub ?? '(none)'}. Available: restore`,
        'tag compact restore',
        'compact',
      );
  }
}
