// tag CLI — Compact Command
// Recovery from context compaction. Clears the compaction block marker,
// syncs _compactionCount to prevent re-detection loops,
// resets freshness epochs so render gates re-enforce module/style re-reads,
// and returns recovery steps + a ready-to-paste batch command.

import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CommandResult } from '../types';
import { ok, fail } from '../lib/errors';
import { tryLoadState, saveState, backupState } from '../lib/state-store';
import { clearCompactionBlock } from '../lib/workflow-markers';
import { isAllowedPath } from '../lib/path-security';
import { JOURNAL_FILENAME } from './state/sync';

/** Read current transcript count from filesystem, excluding journal.txt. */
function readTranscriptCount(): number | null {
  const transcriptsDir = process.env.TAG_TRANSCRIPTS_DIR || '/mnt/transcripts';
  const resolved = resolve(transcriptsDir);
  if (!isAllowedPath(resolved)) return null;
  try {
    const entries = readdirSync(transcriptsDir);
    return entries.filter(e => e !== JOURNAL_FILENAME).length;
  } catch {
    return null;
  }
}

/** Shell-quote a string with single quotes (POSIX-safe). */
function shQuote(s: string): string {
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

/** Build a single batch command string that performs all recovery steps. */
function buildRecoveryBatch(loreSource: string | null): string {
  const steps: string[] = [];
  if (loreSource) {
    steps.push(`export load ${shQuote(loreSource)}`);
  }
  steps.push('module activate-tier 1');
  steps.push('module activate-tier 2');
  steps.push('style activate');
  return steps.join('; ');
}

async function restore(): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) {
    clearCompactionBlock();
    return ok({
      restored: true,
      loreSource: null,
      modulesActive: [],
      recoveryBatch: buildRecoveryBatch(null),
      nextSteps: [
        'No game state found. Run `tag state reset` to create one.',
      ],
    }, 'compact restore');
  }

  // Backup before mutation — consistent with setup.ts and export.ts
  await backupState();

  // Sync _compactionCount to filesystem — prevents re-detection loop
  const fsCount = readTranscriptCount();
  if (fsCount !== null && fsCount > (state._compactionCount ?? 0)) {
    state._compactionCount = fsCount;
  }

  // Reset freshness tracking — forces re-reads through render gates
  state._modulesRead = [];
  delete state._proseCraftEpoch;
  delete state._styleReadEpoch;
  await saveState(state);

  // Clear block AFTER successful save — if save throws, block stays active
  clearCompactionBlock();

  const loreSource = state._loreSource ?? null;
  const modulesActive = state.modulesActive ?? [];
  const recoveryBatch = buildRecoveryBatch(loreSource);
  const nextSteps: string[] = [];

  if (loreSource) {
    nextSteps.push(`Lore source on record: ${loreSource}. Run \`tag export load ${shQuote(loreSource)}\` if world data needs reloading.`);
  }
  nextSteps.push('Run `tag module activate-tier 1` then `tag module activate-tier 2` to reload module specs.');
  nextSteps.push('Run `tag style activate` to reload visual style guidance.');
  nextSteps.push('Run `tag state sync --apply --scene <current>` to verify state consistency before next scene.');
  nextSteps.push(`Or run as a single batch: \`tag batch --commands "${recoveryBatch}"\``);

  return ok({
    restored: true,
    loreSource,
    modulesActive,
    recoveryBatch,
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
