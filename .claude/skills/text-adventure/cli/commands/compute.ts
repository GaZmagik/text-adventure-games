import type { CommandResult, StatName, ComputationResult } from '../types';
import { ok, fail, noState, npcNotFound } from '../lib/errors';
import { tryLoadState, saveState } from '../lib/state-store';
import { rollD20 } from '../lib/dice';
import { getOpposingAttribute } from '../data/contested-pairings';
import { STAT_NAMES } from '../lib/constants';

// Margin → outcome from die-rolls.md § Outcome Badge Text for Contested Checks
function contestOutcome(margin: number): string {
  if (margin >= 5) return 'decisive_success';
  if (margin >= 1) return 'narrow_success';
  if (margin === 0) return 'narrow_failure'; // Tie: NPC favoured
  if (margin >= -4) return 'failure';
  return 'decisive_failure';
}

// Standard check outcome from die-rolls.md § Stage 3
function checkOutcome(roll: number, total: number, dc: number): string {
  if (roll === 20) return 'critical_success';
  if (roll === 1) return 'critical_failure';
  if (total >= dc) return 'success';
  if (total >= dc - 3) return 'partial_success';
  return 'failure';
}

// Encounter table from modules/geo-map.md
function encounterType(roll: number, escalation: number): string {
  const adjusted = roll + escalation;
  if (adjusted <= 8) return 'quiet';
  if (adjusted <= 15) return 'alert';
  return 'hostile';
}

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}


async function contest(args: string[]): Promise<CommandResult> {
  if (args.length < 2) {
    return fail(
      'Usage: tag compute contest <ATTR> <npc_id>',
      'tag compute contest CHA merchant_01',
      'compute contest',
    );
  }

  const stat = args[0].toUpperCase() as StatName;
  if (!STAT_NAMES.includes(stat)) {
    return fail(
      `Invalid attribute: ${args[0]}. Must be one of: ${STAT_NAMES.join(', ')}`,
      'tag compute contest CHA merchant_01',
      'compute contest',
    );
  }

  const npcId = args[1];
  const state = await tryLoadState();
  if (!state) return noState();
  const npc = state.rosterMutations.find(n => n.id === npcId);
  if (!npc) return npcNotFound(npcId);

  const opposingAttr = getOpposingAttribute(stat);
  const npcModifier = npc.modifiers[opposingAttr];
  const playerModifier = state.character?.modifiers[stat] ?? 0;

  const playerRoll = rollD20();
  const npcRoll = rollD20();
  const playerTotal = playerRoll + playerModifier;
  const npcTotal = npcRoll + npcModifier;
  const margin = playerTotal - npcTotal;
  const outcome = contestOutcome(margin);

  const computation: ComputationResult = {
    type: 'contested_roll',
    stat,
    roll: playerRoll,
    modifier: playerModifier,
    total: playerTotal,
    margin,
    outcome,
    npcId,
    npcModifier,
    context: { npcRoll, npcTotal, opposingAttribute: opposingAttr, npcName: npc.name },
  };

  state._lastComputation = computation;
  await saveState(state);

  return ok({
    type: 'contested_roll',
    stat,
    roll: playerRoll,
    modifier: playerModifier,
    total: playerTotal,
    npcRoll,
    npcModifier,
    npcTotal,
    margin,
    outcome,
    npcId,
    npcName: npc.name,
    opposingAttribute: opposingAttr,
  }, 'compute contest');
}

async function hazard(args: string[]): Promise<CommandResult> {
  if (args.length < 1) {
    return fail('Usage: tag compute hazard <ATTR> --dc <N>', 'tag compute hazard CON --dc 14', 'compute hazard');
  }

  const stat = args[0].toUpperCase() as StatName;
  if (!STAT_NAMES.includes(stat)) {
    return fail(`Invalid stat: "${stat}".`, `Valid stats: ${STAT_NAMES.join(', ')}`, 'compute hazard');
  }

  const dcStr = parseFlag(args, '--dc');
  if (!dcStr) {
    return fail('Missing required flag: --dc <number>', 'tag compute hazard CON --dc 14', 'compute hazard');
  }

  const dc = parseInt(dcStr, 10);
  if (Number.isNaN(dc)) {
    return fail(`Invalid DC value: ${dcStr}`, 'tag compute hazard CON --dc 14', 'compute hazard');
  }

  const state = await tryLoadState();
  if (!state) return noState();

  const modifier = state.character?.modifiers[stat] ?? 0;
  const roll = rollD20();
  const total = roll + modifier;
  const outcome = checkOutcome(roll, total, dc);

  const computation: ComputationResult = {
    type: 'hazard_save',
    stat,
    roll,
    modifier,
    total,
    dc,
    outcome,
  };

  state._lastComputation = computation;
  await saveState(state);

  return ok({ type: 'hazard_save', stat, roll, modifier, total, dc, outcome }, 'compute hazard');
}

async function encounter(args: string[]): Promise<CommandResult> {
  const escalationStr = parseFlag(args, '--escalation') ?? '0';
  const escalation = parseInt(escalationStr, 10) || 0;

  const roll = rollD20();
  const enc = encounterType(roll, escalation);

  const computation: ComputationResult = {
    type: 'encounter_roll',
    roll,
    context: { escalation, encounter: enc },
  };

  const state = await tryLoadState();
  if (state) {
    state._lastComputation = computation;
    await saveState(state);
  }

  return ok({ type: 'encounter_roll', roll, escalation, encounter: enc }, 'compute encounter');
}

export async function handleCompute(args: string[]): Promise<CommandResult> {
  const sub = args[0];
  switch (sub) {
    case 'contest': return contest(args.slice(1));
    case 'hazard': return hazard(args.slice(1));
    case 'encounter': return encounter(args.slice(1));
    default:
      return fail(
        `Unknown compute subcommand: ${sub ?? '(none)'}. Available: contest, hazard, encounter`,
        'tag compute contest CHA merchant_01',
        'compute',
      );
  }
}
