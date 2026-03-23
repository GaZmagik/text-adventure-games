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

export function npcNotFound(npcId: string): CommandResult {
  return fail(
    `NPC ${npcId} not found in state.`,
    `tag state create-npc ${npcId} --tier <tier> --name "<name>" --pronouns <pronouns> --role <role>`,
    'compute',
  );
}

export function styleNotSet(): CommandResult {
  return fail(
    'No visual style set.',
    'tag state set visualStyle <style-name>',
    'render',
  );
}
