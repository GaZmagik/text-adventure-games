import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import type { CommandResult, GmState, TimeState } from '../../types';
import { ok, fail, noState } from '../../lib/errors';
import { tryLoadState, saveState, getSyncMarkerPath } from '../../lib/state-store';
import { validateState } from '../../lib/validator';
import { TIER1_MODULES } from '../../lib/constants';
import { parseArgs } from '../../lib/args';
import { XP_THRESHOLDS } from '../../data/xp-tables';
import { containsForbiddenKeys } from '../../lib/security';
import { buildFeatureChecklist } from '../../metadata';
import { recordHistory } from './index';

const VALID_TIME_KEYS = new Set<string>([
  'period', 'date', 'elapsed', 'hour',
  'playerKnowsDate', 'playerKnowsTime', 'calendarSystem', 'deadline',
]);
const NPC_WORLDFLAG_PATTERN = /^npc_([a-z0-9_-]+)_/;

function buildSyncDiff(
  state: GmState,
  flags: Record<string, string>,
  warnings: string[],
): { diff: Record<string, { from: unknown; to: unknown }>; nextScene: number; parsedTime: Record<string, unknown> | null; earlyReturn: CommandResult | null } {
  const diff: Record<string, { from: unknown; to: unknown }> = {};

  let nextScene: number;
  if (flags.scene) {
    nextScene = Number(flags.scene);
    if (!Number.isFinite(nextScene) || nextScene < 0) {
      return {
        diff,
        nextScene: state.scene,
        parsedTime: null,
        earlyReturn: fail(
          `Invalid --scene value "${flags.scene}": must be a finite non-negative number.`,
          'Provide an integer scene number, e.g. --scene 5',
          'state sync',
        ),
      };
    }
  } else {
    nextScene = state.scene + 1;
  }
  if (nextScene !== state.scene) {
    diff.scene = { from: state.scene, to: nextScene };
  }

  if (flags.room && flags.room !== state.currentRoom) {
    diff.currentRoom = { from: state.currentRoom, to: flags.room };
  }

  let parsedTime: Record<string, unknown> | null = null;
  if (flags.time) {
    try {
      const raw: unknown = JSON.parse(flags.time);
      if (typeof raw !== 'object' || raw === null) {
        warnings.push('--time flag must be a JSON object.');
      } else if (containsForbiddenKeys(raw)) {
        warnings.push('--time flag contains forbidden keys (__proto__, constructor, prototype).');
      } else {
        const filtered: Record<string, unknown> = {};
        for (const key of Object.keys(raw as Record<string, unknown>)) {
          if (VALID_TIME_KEYS.has(key)) {
            filtered[key] = (raw as Record<string, unknown>)[key];
          } else {
            warnings.push(`--time key "${key}" is not a valid TimeState field; ignored.`);
          }
        }
        parsedTime = filtered;
        diff.time = { from: state.time, to: filtered };
      }
    } catch {
      warnings.push('--time flag contains invalid JSON.');
    }
  }

  return { diff, nextScene, parsedTime, earlyReturn: null };
}

function checkPendingComputation(state: GmState, warnings: string[]): void {
  if (state._lastComputation && state._lastComputation.type !== 'levelup_result') {
    const lastType = state._lastComputation.type;
    const lastRoll = state.rollHistory[state.rollHistory.length - 1];
    if (!lastRoll || lastRoll.type !== lastType || lastRoll.scene !== state.scene) {
      warnings.push(`Pending computation (${lastType}) may not be reflected in rollHistory.`);
    }
  }
}

function checkMissingModules(activeSet: Set<string>, warnings: string[]): void {
  const missingTier1 = TIER1_MODULES.filter(moduleName => !activeSet.has(moduleName));
  if (missingTier1.length > 0) {
    warnings.push(`Missing Tier 1 modules: ${missingTier1.join(', ')}. Re-read these files.`);
  }
}

function checkQuestWorldFlagSync(state: GmState, warnings: string[]): void {
  for (const quest of state.quests) {
    if (quest.objectives.length === 0) {
      warnings.push(`Quest "${quest.id}" has no objectives to validate.`);
      continue;
    }
    let allComplete = quest.objectives.length > 0;
    for (const obj of quest.objectives) {
      const canonicalKey = `quest:${quest.id}:${obj.id}:complete`;
      const flagSet = state.worldFlags[canonicalKey] === true;
      if (obj.completed && !flagSet) {
        warnings.push(
          `Quest objective "${quest.id}/${obj.id}" is complete but worldFlag `
          + `"${canonicalKey}" is not set. Use \`tag quest complete\` to sync.`,
        );
      }
      if (flagSet && !obj.completed) {
        warnings.push(
          `WorldFlag "${canonicalKey}" is set but quest objective `
          + `"${quest.id}/${obj.id}" is not marked complete.`,
        );
      }
      if (!obj.completed) allComplete = false;
    }
    const questFlag = `quest:${quest.id}:complete`;
    if (allComplete && state.worldFlags[questFlag] !== true) {
      warnings.push(
        `All objectives of quest "${quest.id}" are complete but worldFlag `
        + `"${questFlag}" is not set.`,
      );
    }
  }
}

function checkLevelUpEligibility(state: GmState, warnings: string[]): void {
  if (state.character) {
    const { level, xp } = state.character;
    const nextThreshold = XP_THRESHOLDS.find(threshold => threshold.level === level + 1);
    if (nextThreshold && xp >= nextThreshold.xp) {
      warnings.push(
        `Level-up available! XP ${xp} >= ${nextThreshold.xp} `
        + `(level ${level + 1}). Run \`tag compute levelup\`.`,
      );
    }
  }
}

function checkNpcReferenceGaps(state: GmState, npcIds: Set<string>, warnings: string[]): void {
  for (const key of Object.keys(state.worldFlags)) {
    const match = NPC_WORLDFLAG_PATTERN.exec(key);
    if (match) {
      const npcId = match[1]!;
      if (!npcIds.has(npcId) && !npcIds.has(`npc_${npcId}`)) {
        warnings.push(`WorldFlag "${key}" references NPC "${npcId}" not found in rosterMutations.`);
      }
    }
  }
}

export const JOURNAL_FILENAME = 'journal.txt';

function checkCompaction(
  state: GmState,
  warnings: string[],
): { compactionDetected: boolean; filesystemCount: number } {
  const transcriptsDir = process.env.TAG_TRANSCRIPTS_DIR || '/mnt/transcripts';

  const resolvedTranscripts = resolve(transcriptsDir);
  const home = homedir();
  const tmp = tmpdir();
  const homePrefix = home === '/' ? home : home + '/';
  const tmpPrefix = tmp === '/' ? tmp : tmp + '/';
  const validPrefixes = [homePrefix, tmpPrefix, '/mnt/'];
  if (!validPrefixes.some(prefix => resolvedTranscripts.startsWith(prefix))) {
    warnings.push(
      `Compaction check skipped: TAG_TRANSCRIPTS_DIR "${transcriptsDir}" is outside allowed paths `
      + '(home, temp, or /mnt/). Set TAG_TRANSCRIPTS_DIR to a valid location.',
    );
    return { compactionDetected: false, filesystemCount: 0 };
  }

  let filesystemCount = 0;

  try {
    const entries = readdirSync(transcriptsDir);
    filesystemCount = entries.filter(e => e !== JOURNAL_FILENAME).length;
  } catch (err: unknown) {
    const code = err && typeof err === 'object' && 'code' in err
      ? (err as NodeJS.ErrnoException).code
      : undefined;
    if (code !== 'ENOENT') {
      warnings.push(
        `Compaction check skipped: could not read "${transcriptsDir}" (${code ?? 'unknown'}). `
        + 'Check TAG_TRANSCRIPTS_DIR and directory permissions.',
      );
    }
    return { compactionDetected: false, filesystemCount: 0 };
  }

  const storedCount = state._compactionCount ?? 0;
  const newCompactions = filesystemCount - storedCount;

  if (newCompactions > 0) {
    const modules = state.modulesActive ?? [];
    const moduleList = modules.length > 0
      ? modules.map(m => `modules/${m}.md`).join(', ')
      : '(none active)';

    warnings.push(
      `${newCompactions} new compaction${newCompactions > 1 ? 's' : ''} detected `
      + `(stored: ${storedCount}, current: ${filesystemCount}). `
      + `Context may be lost. Re-read: ${moduleList}. `
      + `Recovery: run \`tag state sync --apply --scene ${state.scene}\` then \`tag state context\` and re-read all listed files.`,
    );

    return { compactionDetected: true, filesystemCount };
  }

  return { compactionDetected: false, filesystemCount };
}

export async function handleSync(args: string[]): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) return noState();

  const parsed = parseArgs(args, ['apply']);
  const apply = parsed.booleans.has('apply');
  const flags = parsed.flags;

  const warnings: string[] = [];
  const { diff, nextScene, parsedTime, earlyReturn } = buildSyncDiff(state, flags, warnings);
  if (earlyReturn) return earlyReturn;

  checkPendingComputation(state, warnings);

  const active: string[] = state.modulesActive ?? [];
  const activeSet = new Set(active);
  checkMissingModules(activeSet, warnings);

  checkQuestWorldFlagSync(state, warnings);
  checkLevelUpEligibility(state, warnings);

  const npcIds = new Set<string>();
  for (const npc of state.rosterMutations) npcIds.add(npc.id);
  checkNpcReferenceGaps(state, npcIds, warnings);

  const { compactionDetected, filesystemCount } = checkCompaction(state, warnings);

  const featureChecklist = buildFeatureChecklist(state);
  const status = warnings.length > 0 ? 'warnings' : 'clean';

  if (apply) {
    if (diff.scene) state.scene = nextScene;
    if (diff.currentRoom && flags.room) state.currentRoom = flags.room;
    if (parsedTime) {
      state.time = { ...state.time, ...(parsedTime as Partial<TimeState>) };
    }
    if (filesystemCount > (state._compactionCount ?? 0)) {
      state._compactionCount = filesystemCount;
    }

    const validation = validateState(state);
    if (!validation.valid) {
      return fail(
        `Sync would produce invalid state: ${validation.errors.join('; ')}`,
        'Fix the sync flags so the resulting state is structurally valid.',
        'state sync',
      );
    }

    recordHistory(state, 'state sync', 'sync', null, diff);
    await saveState(state);
    await Bun.write(getSyncMarkerPath(), String(state.scene));
  }

  return ok({
    status,
    diff,
    warnings,
    errors: [],
    featureChecklist,
    applied: apply,
    compactionDetected,
    rollHistoryCount: state.rollHistory.length,
    stateHistoryCount: state._stateHistory.length,
  }, 'state sync');
}
