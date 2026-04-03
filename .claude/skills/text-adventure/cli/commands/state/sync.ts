import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CommandResult, GmState, TimeState } from '../../types';
import { isAllowedPath } from '../../lib/path-security';
import { ok, fail, noState } from '../../lib/errors';
import { tryLoadState, saveState, getSyncMarkerPath } from '../../lib/state-store';
import { validateState } from '../../lib/validator';
import { TIER1_MODULES, STAT_NAMES } from '../../lib/constants';
import { parseArgs } from '../../lib/args';
import { XP_THRESHOLDS } from '../../data/xp-tables';
import { containsForbiddenKeys } from '../../lib/security';
import { isRecord } from '../../lib/state-schema';
import { buildFeatureChecklist } from '../../metadata';
import { PROSE_CHECKLIST, RENDERING_RULES, SCENE_STRUCTURE, DENSITY_GUIDANCE } from '../../data/prose-guidance';
import { recordHistory } from './index';
import { getNeedsVerifyPath, getVerifyMarkerPath, readSignedMarker } from '../verify';
import { buildPendingRollCommand, resolvePendingRolls } from '../../lib/pending-rolls';

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
      if (!isRecord(raw)) {
        warnings.push('--time flag must be a JSON object.');
      } else if (containsForbiddenKeys(raw)) {
        warnings.push('--time flag contains forbidden keys (__proto__, constructor, prototype).');
      } else {
        const filtered: Record<string, unknown> = {};
        for (const key of Object.keys(raw)) {
          if (VALID_TIME_KEYS.has(key)) {
            filtered[key] = raw[key];
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
      state._levelupPending = true;
      warnings.push(
        `Level-up available! XP ${xp} >= ${nextThreshold.xp} `
        + `(level ${level + 1}). The scene footer will show a glowing Level Up button.`,
      );
    } else {
      state._levelupPending = false;
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
  if (!isAllowedPath(resolvedTranscripts)) {
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

/** Warn threshold — number of rollless scenes before advisory warning. */
const ROLLLESS_WARN_THRESHOLD = 3;
/** Block threshold — number of rollless scenes before hard block. */
const ROLLLESS_BLOCK_THRESHOLD = 5;
/** Rulebooks exempt from roll ratio enforcement. */
const NARRATIVE_RULEBOOKS = new Set(['narrative_engine']);

function checkPendingRolls(state: GmState, warnings: string[]): void {
  const { unresolved } = resolvePendingRolls(state._pendingRolls, state.rollHistory, state.scene);
  for (const pending of unresolved) {
    warnings.push(
      `Unresolved pending roll: action ${pending.action} requires ${pending.type} (${pending.stat}) `
      + `— run \`${buildPendingRollCommand(pending)}\`.`,
    );
  }
}

function checkRulebookSet(state: GmState, warnings: string[]): void {
  if (state.scene < 1) return;
  const rulebook = state.worldFlags.rulebook;
  if (typeof rulebook === 'string' && rulebook.length > 0) return;
  warnings.push(
    'worldFlags.rulebook is not set — dice enforcement will not trigger. '
    + 'Run `tag state set worldFlags.rulebook <system>` (e.g. d20_system, pf2e_lite, narrative_engine).',
  );
}

/** D20 system requires all 6 stats (STR/DEX/CON/INT/WIS/CHA) on the character. */
function checkStatCompleteness(state: GmState, warnings: string[]): void {
  if (!state.character) return;
  const rulebook = state.worldFlags.rulebook;
  if (typeof rulebook !== 'string' || !rulebook.includes('d20') && !rulebook.includes('dnd') && !rulebook.includes('pf2e')) return;
  const stats = state.character.stats;
  const missing = STAT_NAMES.filter(s => !(s in stats) || typeof stats[s] !== 'number');
  if (missing.length > 0) {
    warnings.push(
      `BLOCK: Character stats incomplete for ${rulebook} — missing: ${missing.join(', ')}. `
      + 'D20-based systems require all 6 attributes (STR, DEX, CON, INT, WIS, CHA). '
      + 'Set via `tag state set character.stats \'{"STR":10,"DEX":10,"CON":10,"INT":10,"WIS":10,"CHA":10}\'`.',
    );
  }
}

function checkRollRatio(state: GmState, warnings: string[]): void {
  const rulebook = state.worldFlags.rulebook;
  if (typeof rulebook !== 'string' || NARRATIVE_RULEBOOKS.has(rulebook)) return;

  const currentScene = state.scene;
  let lastRollScene = 0;
  for (const r of state.rollHistory) {
    if (r.scene > lastRollScene) lastRollScene = r.scene;
  }

  const rolllessScenes = currentScene - lastRollScene;
  if (rolllessScenes >= ROLLLESS_BLOCK_THRESHOLD) {
    warnings.push(
      `BLOCK: ${rolllessScenes} consecutive rollless scenes with ${rulebook}. `
      + 'A dice roll is required before advancing. Run `tag compute contest <ATTR> <npc_id>` '
      + 'or `tag compute hazard <ATTR> --dc <N>`.',
    );
  } else if (rolllessScenes >= ROLLLESS_WARN_THRESHOLD) {
    warnings.push(
      `${rolllessScenes} rollless scenes with ${rulebook}. `
      + 'Consider adding a dice roll soon to maintain mechanical engagement.',
    );
  }
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

  // On compaction: reset _modulesRead — GM must re-activate modules to reload content
  if (compactionDetected && Array.isArray(state._modulesRead) && state._modulesRead.length > 0) {
    warnings.push(
      `Compaction detected: _modulesRead reset to empty. Run \`tag module activate-tier 1\` then activate any Tier 2/3 modules to reload content into context.`,
    );
    state._modulesRead = [];
  }

  checkPendingRolls(state, warnings);
  checkRollRatio(state, warnings);
  checkRulebookSet(state, warnings);
  checkStatCompleteness(state, warnings);

  const featureChecklist = buildFeatureChecklist(state);
  const status = warnings.length > 0 ? 'warnings' : 'clean';

  if (apply) {
    // Block apply if scene widget was not verified — signed marker prevents forgery via echo
    if (state.scene > 0) {
      const lastVerifyScene = readSignedMarker(getVerifyMarkerPath());
      if (lastVerifyScene < state.scene) {
        return fail(
          `Scene ${state.scene} has not been verified. Last verified: ${lastVerifyScene < 0 ? 'never' : `scene ${lastVerifyScene}`}.`,
          'Run `tag verify /tmp/scene.html` with your composed HTML before advancing. '
          + 'This ensures the widget has all required elements (footer, panels, CSS, narrative, action cards).',
          'state sync',
        );
      }
    }

    const needsVerifyMarker = (() => {
      try {
        return readFileSync(getNeedsVerifyPath(), 'utf-8').trim();
      } catch {
        return '';
      }
    })();
    if (needsVerifyMarker.length > 0) {
      const markerScene = Number(needsVerifyMarker.split(':', 1)[0]);
      if (markerScene === state.scene) {
        return fail(
          `Scene ${state.scene} has been re-rendered since the last verification.`,
          'Run `tag verify /tmp/scene.html` on the latest composed HTML before advancing.',
          'state sync',
        );
      }
    }

    // Block apply if unresolved pending rolls exist
    const unresolvedRolls = resolvePendingRolls(state._pendingRolls, state.rollHistory, state.scene).unresolved;
    if (unresolvedRolls.length > 0) {
      const first = unresolvedRolls[0]!;
      return fail(
        `Cannot apply: ${unresolvedRolls.length} unresolved pending roll(s). `
        + `First: action ${first.action} (${first.type} ${first.stat}).`,
        `Run \`${buildPendingRollCommand(first)}\` first.`,
        'state sync',
      );
    }

    if (diff.scene) state.scene = nextScene;
    if (diff.currentRoom && flags.room) state.currentRoom = flags.room;
    if (parsedTime) {
      const coerced: Partial<TimeState> = {};
      if ('period' in parsedTime && typeof parsedTime.period === 'string') coerced.period = parsedTime.period;
      if ('date' in parsedTime && typeof parsedTime.date === 'string') coerced.date = parsedTime.date;
      if ('elapsed' in parsedTime && typeof parsedTime.elapsed === 'number') coerced.elapsed = parsedTime.elapsed;
      if ('hour' in parsedTime && typeof parsedTime.hour === 'number') coerced.hour = parsedTime.hour;
      if ('playerKnowsDate' in parsedTime && typeof parsedTime.playerKnowsDate === 'boolean') coerced.playerKnowsDate = parsedTime.playerKnowsDate;
      if ('playerKnowsTime' in parsedTime && typeof parsedTime.playerKnowsTime === 'boolean') coerced.playerKnowsTime = parsedTime.playerKnowsTime;
      if ('calendarSystem' in parsedTime && typeof parsedTime.calendarSystem === 'string') coerced.calendarSystem = parsedTime.calendarSystem;
      if ('deadline' in parsedTime) {
        const dl = parsedTime.deadline;
        if (dl === null) {
          coerced.deadline = null;
        } else if (typeof dl === 'object' && dl !== null && 'label' in dl && 'remainingScenes' in dl
          && typeof (dl as Record<string, unknown>).label === 'string'
          && typeof (dl as Record<string, unknown>).remainingScenes === 'number') {
          coerced.deadline = { label: (dl as Record<string, unknown>).label as string, remainingScenes: (dl as Record<string, unknown>).remainingScenes as number };
        }
      }
      state.time = { ...state.time, ...coerced };
    }
    if (filesystemCount > (state._compactionCount ?? 0)) {
      state._compactionCount = filesystemCount;
    }

    // Clear pending rolls on successful apply
    state._pendingRolls = [];

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
    const { signMarker } = await import('../verify');
    writeFileSync(getSyncMarkerPath(), signMarker(state.scene), 'utf-8');
  }

  return ok({
    status,
    diff,
    warnings,
    errors: [],
    featureChecklist,
    inlineGuidance: {
      proseChecklist: [...PROSE_CHECKLIST],
      renderingRules: [...RENDERING_RULES],
      sceneStructure: [...SCENE_STRUCTURE],
      densityGuidance: { ...DENSITY_GUIDANCE },
    },
    applied: apply,
    compactionDetected,
    rollHistoryCount: state.rollHistory.length,
    stateHistoryCount: state._stateHistory.length,
  }, 'state sync');
}
