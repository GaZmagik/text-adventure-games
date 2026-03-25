// tag CLI — Quest Command
// Manage quests, objectives, and clues. Subcommands: complete, add-objective, add-clue, status, list.

import type { CommandResult, GmState, Quest } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState, saveState } from '../lib/state-store';
import { parseArgs } from '../lib/args';
import { recordHistory } from './state';

const VALID_SUBCOMMANDS = ['complete', 'add-objective', 'add-clue', 'status', 'list'] as const;

/** Find a quest by id, returning a fail result if not found. */
function findQuest(
  state: GmState,
  questId: string,
  command: string,
): { quest: Quest } | { error: CommandResult } {
  const quest = state.quests.find(q => q.id === questId);
  if (!quest) {
    return {
      error: fail(
        `Quest "${questId}" not found.`,
        'Check quest IDs with: tag quest list',
        command,
      ),
    };
  }
  return { quest };
}

// ── Subcommand handlers ──────────────────────────────────────────

async function handleComplete(args: string[]): Promise<CommandResult> {
  const questId = args[0];
  const objectiveId = args[1];

  if (!questId) {
    return fail('No quest-id provided.', 'Usage: tag quest complete <quest-id> <objective-id>', 'quest complete');
  }
  if (!objectiveId) {
    return fail('No objective-id provided.', 'Usage: tag quest complete <quest-id> <objective-id>', 'quest complete');
  }

  const state = await tryLoadState();
  if (!state) return noState('quest');

  const lookup = findQuest(state, questId, 'quest complete');
  if ('error' in lookup) return lookup.error;
  const { quest } = lookup;

  const objective = quest.objectives.find(o => o.id === objectiveId);
  if (!objective) {
    return fail(
      `Objective "${objectiveId}" not found in quest "${questId}".`,
      `Available objectives: ${quest.objectives.map(o => o.id).join(', ')}`,
      'quest complete',
    );
  }

  const oldCompleted = objective.completed;
  objective.completed = true;

  // Two-way worldFlags binding — objective level
  state.worldFlags[`quest:${questId}:${objectiveId}:complete`] = true;

  // If ALL objectives now complete, set quest-level flag and mark quest completed
  const allComplete = quest.objectives.every(o => o.completed);
  if (allComplete) {
    quest.status = 'completed';
    state.worldFlags[`quest:${questId}:complete`] = true;
  }

  recordHistory(
    state,
    'quest complete',
    `quests.${questId}.objectives.${objectiveId}.completed`,
    oldCompleted,
    true,
  );
  await saveState(state);

  return ok({
    questId,
    objectiveId,
    completed: true,
    allObjectivesComplete: allComplete,
  }, 'quest complete');
}

const ID_RE = /^[a-zA-Z0-9_-]+$/;

async function handleAddObjective(args: string[]): Promise<CommandResult> {
  const questId = args[0];
  if (!questId) {
    return fail('No quest-id provided.', 'Usage: tag quest add-objective <quest-id> --id <obj-id> --desc "text"', 'quest add-objective');
  }

  const { flags } = parseArgs(args.slice(1), [], ['desc', 'id']);
  const objId = flags.id;
  const desc = flags.desc;

  if (!objId) {
    return fail('Missing --id flag.', 'Usage: tag quest add-objective <quest-id> --id <obj-id> --desc "text"', 'quest add-objective');
  }
  if (!ID_RE.test(objId)) {
    return fail(
      `Invalid objective id: "${objId}". Must contain only letters, numbers, hyphens, and underscores.`,
      'Example: --id find_beacon',
      'quest add-objective',
    );
  }
  if (!desc) {
    return fail('Missing --desc flag.', 'Usage: tag quest add-objective <quest-id> --id <obj-id> --desc "text"', 'quest add-objective');
  }

  const state = await tryLoadState();
  if (!state) return noState('quest');

  const lookup = findQuest(state, questId, 'quest add-objective');
  if ('error' in lookup) return lookup.error;
  const { quest } = lookup;

  const newObjective = { id: objId, description: desc, completed: false };
  quest.objectives.push(newObjective);

  recordHistory(
    state,
    'quest add-objective',
    `quests.${questId}.objectives`,
    null,
    newObjective,
  );
  await saveState(state);

  return ok(newObjective, 'quest add-objective');
}

async function handleAddClue(args: string[]): Promise<CommandResult> {
  const questId = args[0];
  const clueText = args[1];

  if (!questId) {
    return fail('No quest-id provided.', 'Usage: tag quest add-clue <quest-id> "clue text"', 'quest add-clue');
  }
  if (!clueText) {
    return fail('No clue text provided.', 'Usage: tag quest add-clue <quest-id> "clue text"', 'quest add-clue');
  }

  const state = await tryLoadState();
  if (!state) return noState('quest');

  const lookup = findQuest(state, questId, 'quest add-clue');
  if ('error' in lookup) return lookup.error;
  const { quest } = lookup;

  quest.clues.push(clueText);

  recordHistory(
    state,
    'quest add-clue',
    `quests.${questId}.clues`,
    null,
    clueText,
  );
  await saveState(state);

  return ok({ questId, clue: clueText, totalClues: quest.clues.length }, 'quest add-clue');
}

async function handleStatus(args: string[]): Promise<CommandResult> {
  const questId = args[0];

  if (!questId) {
    return fail('No quest-id provided.', 'Usage: tag quest status <quest-id>', 'quest status');
  }

  const state = await tryLoadState();
  if (!state) return noState('quest');

  const lookup = findQuest(state, questId, 'quest status');
  if ('error' in lookup) return lookup.error;
  const { quest } = lookup;

  let completed = 0;
  for (const o of quest.objectives) if (o.completed) completed++;
  const total = quest.objectives.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return ok({
    title: quest.title,
    completed,
    total,
    percentage,
    clueCount: quest.clues.length,
  }, 'quest status');
}

async function handleList(): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) return noState('quest');

  const list = state.quests.map(quest => {
    let completed = 0;
    for (const o of quest.objectives) if (o.completed) completed++;
    const total = quest.objectives.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { id: quest.id, title: quest.title, status: quest.status, completed, total, percentage };
  });

  return ok(list, 'quest list');
}

// ── Main handler ─────────────────────────────────────────────────

export async function handleQuest(args: string[]): Promise<CommandResult> {
  const subcommand = args[0];

  if (!subcommand) {
    return fail(
      'No subcommand provided.',
      `Valid subcommands: ${VALID_SUBCOMMANDS.join(', ')}. Run: tag quest --help`,
      'quest',
    );
  }

  switch (subcommand) {
    case 'complete':
      return handleComplete(args.slice(1));
    case 'add-objective':
      return handleAddObjective(args.slice(1));
    case 'add-clue':
      return handleAddClue(args.slice(1));
    case 'status':
      return handleStatus(args.slice(1));
    case 'list':
      return handleList();
    default:
      return fail(
        `Unknown subcommand: "${subcommand}".`,
        `Valid subcommands: ${VALID_SUBCOMMANDS.join(', ')}`,
        'quest',
      );
  }
}
