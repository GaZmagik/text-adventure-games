import type { CommandResult } from '../types';

/** Safely extract a message string from an unknown caught error. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function ok<T>(data: T, command: string): CommandResult<T> {
  return { ok: true, command, data };
}

export function fail(message: string, corrective: string, command: string): CommandResult {
  return { ok: false, command, error: { message, corrective } };
}

export function noState(command = 'state'): CommandResult {
  return fail(
    'No game state found.',
    'tag state reset',
    command,
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
