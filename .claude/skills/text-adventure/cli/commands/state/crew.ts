// tag CLI — State Crew Subcommand
// Manages crew roster: add, morale, stress, loyalty, status, assign.

import type { CommandResult, CrewMutation, GmState, NpcStatus, Pronouns } from '../../types';
import { ok, fail, noState } from '../../lib/errors';
import { tryLoadState, saveState } from '../../lib/state-store';
import { parseArgs } from '../../lib/args';
import { recordHistory } from './index';
import { VALID_PRONOUNS, VALID_CREW_STATUSES } from '../../lib/constants';

const COMMAND = 'state crew';
const VALID_ACTIONS = ['add', 'morale', 'stress', 'loyalty', 'status', 'assign'] as const;

// ── Helpers ─────────────────────────────────────────────────────────

function findMember(state: GmState, id: string): CrewMutation | undefined {
  return state.crewMutations?.find(c => c.id === id);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isValidPronouns(s: string): s is Pronouns {
  return (VALID_PRONOUNS as readonly string[]).includes(s);
}

function isValidStatus(s: string): s is NpcStatus {
  return (VALID_CREW_STATUSES as readonly string[]).includes(s);
}

// ── Numeric stat adjustment ─────────────────────────────────────────

async function adjustStat(
  id: string,
  field: 'morale' | 'stress' | 'loyalty',
  rawAmount: string,
): Promise<CommandResult> {
  const amount = Number(rawAmount);
  if (Number.isNaN(amount)) {
    return fail(
      `"${rawAmount}" is not a valid numeric amount.`,
      `Usage: tag state crew ${field} <id> <+/-amount>`,
      COMMAND,
    );
  }

  const state = await tryLoadState();
  if (!state) return noState();

  const member = findMember(state, id);
  if (!member) {
    return fail(`Crew member "${id}" not found.`, 'Add them first with: tag state crew add <id>', COMMAND);
  }

  const oldValue = member[field];
  member[field] = clamp(member[field] + amount, 0, 100);

  recordHistory(state, `state crew ${field}`, `crewMutations.${id}.${field}`, oldValue, member[field]);
  await saveState(state);

  return ok({ id, field, oldValue, newValue: member[field] }, COMMAND);
}

// ── Action handlers ─────────────────────────────────────────────────

async function handleAdd(args: string[]): Promise<CommandResult> {
  const id = args[0];
  if (!id) {
    return fail('No id provided.', 'Usage: tag state crew add <id> --name <n> --pronouns <p> --role <r>', COMMAND);
  }

  const flags = parseArgs(args.slice(1), [], ['name', 'pronouns', 'role']).flags;

  if (!flags.name) {
    return fail('Missing --name flag.', 'Usage: tag state crew add <id> --name <name>', COMMAND);
  }

  if (!flags.pronouns) {
    return fail('Missing --pronouns flag.', `Valid pronouns: ${VALID_PRONOUNS.join(', ')}`, COMMAND);
  }

  if (!isValidPronouns(flags.pronouns)) {
    return fail(`Invalid pronouns "${flags.pronouns}".`, `Valid pronouns: ${VALID_PRONOUNS.join(', ')}`, COMMAND);
  }

  if (!flags.role) {
    return fail('Missing --role flag.', 'Usage: tag state crew add <id> --role <role>', COMMAND);
  }

  const state = await tryLoadState();
  if (!state) return noState();

  if (!state.crewMutations) state.crewMutations = [];

  if (findMember(state, id)) {
    return fail(`Crew member "${id}" already exists.`, 'Use a different id or modify with morale/status/assign.', COMMAND);
  }

  const member: CrewMutation = {
    id,
    name: flags.name,
    pronouns: flags.pronouns,
    role: flags.role,
    morale: 70,
    stress: 20,
    loyalty: 50,
    status: 'active',
  };

  state.crewMutations.push(member);
  recordHistory(state, 'state crew add', `crewMutations.${id}`, null, member);
  await saveState(state);

  return ok(member, COMMAND);
}

async function handleStatus(args: string[]): Promise<CommandResult> {
  const id = args[0];
  if (!id) {
    return fail('No id provided.', 'Usage: tag state crew status <id> <newStatus>', COMMAND);
  }

  const newStatus = args[1];
  if (!newStatus) {
    return fail('No status provided.', `Valid statuses: ${VALID_CREW_STATUSES.join(', ')}`, COMMAND);
  }

  if (!isValidStatus(newStatus)) {
    return fail(
      `Invalid status "${newStatus}".`,
      `Valid statuses: ${VALID_CREW_STATUSES.join(', ')}`,
      COMMAND,
    );
  }

  const state = await tryLoadState();
  if (!state) return noState();

  const member = findMember(state, id);
  if (!member) {
    return fail(`Crew member "${id}" not found.`, 'Add them first with: tag state crew add <id>', COMMAND);
  }

  const oldStatus = member.status;
  member.status = newStatus;

  recordHistory(state, 'state crew status', `crewMutations.${id}.status`, oldStatus, newStatus);
  await saveState(state);

  return ok({ id, oldStatus, newStatus }, COMMAND);
}

async function handleAssign(args: string[]): Promise<CommandResult> {
  const id = args[0];
  if (!id) {
    return fail('No id provided.', 'Usage: tag state crew assign <id> <task>', COMMAND);
  }

  const task = args.slice(1).join(' ');
  if (!task) {
    return fail('No task provided.', 'Usage: tag state crew assign <id> <task>. Use "none" to clear.', COMMAND);
  }

  const state = await tryLoadState();
  if (!state) return noState();

  const member = findMember(state, id);
  if (!member) {
    return fail(`Crew member "${id}" not found.`, 'Add them first with: tag state crew add <id>', COMMAND);
  }

  const oldTask = member.task;

  if (task === 'none' || task === 'idle') {
    delete member.task;
  } else {
    member.task = task;
  }

  recordHistory(state, 'state crew assign', `crewMutations.${id}.task`, oldTask ?? null, member.task ?? null);
  await saveState(state);

  return ok({ id, oldTask: oldTask ?? null, newTask: member.task ?? null }, COMMAND);
}

// ── Main handler ────────────────────────────────────────────────────

export async function handleCrew(args: string[]): Promise<CommandResult> {
  const action = args[0];

  if (!action) {
    return fail(
      'No action provided.',
      `Valid actions: ${VALID_ACTIONS.join(', ')}. Usage: tag state crew <action> <id> [flags]`,
      COMMAND,
    );
  }

  switch (action) {
    case 'add':     return handleAdd(args.slice(1));
    case 'morale':  return adjustStat(args[1]!, 'morale', args[2]!);
    case 'stress':  return adjustStat(args[1]!, 'stress', args[2]!);
    case 'loyalty': return adjustStat(args[1]!, 'loyalty', args[2]!);
    case 'status':  return handleStatus(args.slice(1));
    case 'assign':  return handleAssign(args.slice(1));
    default:
      return fail(
        `Unknown crew action: "${action}".`,
        `Valid actions: ${VALID_ACTIONS.join(', ')}`,
        COMMAND,
      );
  }
}
