import type { CommandResult } from '../types';

export function ok(data: unknown, command: string): CommandResult {
  return { ok: true, command, data };
}

export function fail(message: string, corrective: string, command: string): CommandResult {
  return { ok: false, command, error: { message, corrective } };
}

export function noState(): CommandResult {
  return fail(
    'No game state found.',
    'tag state reset',
    'state',
  );
}

export function npcNotFound(npcId: string, command = 'compute'): CommandResult {
  return fail(
    `NPC "${npcId}" not found in roster.`,
    'Check NPC ID with: tag state get rosterMutations',
    command,
  );
}

export function styleNotSet(): CommandResult {
  return fail(
    'No visual style set.',
    'tag state set visualStyle <style-name>',
    'render',
  );
}
