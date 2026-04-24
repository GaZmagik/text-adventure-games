import type { CommandResult, StatName, ComputationResult, RollOutcome, LevelupResult } from '../types';
import { ok, fail, noState, npcNotFound } from '../lib/errors';
import { tryLoadState, saveState } from '../lib/state-store';
import { rollD20 } from '../lib/dice';
import { getOpposingAttribute } from '../data/contested-pairings';
import { STAT_NAMES } from '../lib/constants';
import { parseArgs } from '../lib/args';
import { XP_THRESHOLDS, LEVEL_REWARDS } from '../data/xp-tables';
import { selectPendingRollForResolution } from '../lib/pending-rolls';

function isStatName(s: string): s is StatName {
  return (STAT_NAMES as readonly string[]).includes(s);
}

// Margin → outcome from die-rolls.md § Outcome Badge Text for Contested Checks
function contestOutcome(margin: number): RollOutcome {
  if (margin >= 5) return 'decisive_success';
  if (margin >= 1) return 'narrow_success';
  if (margin === 0) return 'narrow_failure'; // Tie: NPC favoured
  if (margin >= -4) return 'failure';
  return 'decisive_failure';
}

// Standard check outcome from die-rolls.md § Stage 3
function checkOutcome(roll: number, total: number, dc: number): RollOutcome {
  if (roll === 20) return 'critical_success';
  if (roll === 1) return 'critical_failure';
  if (total >= dc) return 'success';
  if (total >= dc - 3) return 'partial_success';
  return 'failure';
}

// Encounter table from modules/geo-map.md
function encounterType(roll: number, escalation: number): RollOutcome {
  const adjusted = roll + escalation;
  if (adjusted <= 8) return 'quiet';
  if (adjusted <= 15) return 'alert';
  return 'hostile';
}

async function contest(args: string[]): Promise<CommandResult> {
  if (args.length < 2) {
    return fail('Usage: tag compute contest <ATTR> <npc_id>', 'tag compute contest CHA merchant_01', 'compute contest');
  }

  const raw = args[0]!.toUpperCase();
  if (!isStatName(raw)) {
    return fail(
      `Invalid attribute: ${args[0]!}. Must be one of: ${STAT_NAMES.join(', ')}`,
      'tag compute contest CHA merchant_01',
      'compute contest',
    );
  }
  const stat = raw;

  const npcId = args[1]!;
  const state = await tryLoadState();
  if (!state) return noState('compute');
  const npc = state.rosterMutations.find(n => n.id === npcId);
  if (!npc) return npcNotFound(npcId);
  const pendingRoll = selectPendingRollForResolution(state._pendingRolls, state.rollHistory, state.scene, {
    type: 'contest',
    stat,
    npc: npcId,
  });

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
    dieType: 'd20',
    context: { npcRoll, npcTotal, opposingAttribute: opposingAttr, npcName: npc.name },
  };

  // _lastComputation is persisted to state.json for cross-command continuity
  // but intentionally excluded from portable save strings (see save.ts)
  state._lastComputation = computation;
  state.rollHistory.push({
    scene: state.scene,
    type: 'contested_roll',
    stat,
    roll: playerRoll,
    modifier: playerModifier,
    total: playerTotal,
    outcome,
    npcId,
    ...(pendingRoll ? { action: pendingRoll.action } : {}),
    ...(pendingRoll?.skill ? { skill: pendingRoll.skill } : {}),
  });
  await saveState(state);

  return ok(
    {
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
    },
    'compute contest',
  );
}

async function hazard(args: string[]): Promise<CommandResult> {
  if (args.length < 1) {
    return fail('Usage: tag compute hazard <ATTR> --dc <N>', 'tag compute hazard CON --dc 14', 'compute hazard');
  }

  const raw = args[0]!.toUpperCase();
  if (!isStatName(raw)) {
    return fail(`Invalid stat: "${raw}".`, `Valid stats: ${STAT_NAMES.join(', ')}`, 'compute hazard');
  }
  const stat = raw;

  const dcStr = parseArgs(args.slice(1)).flags.dc;
  if (dcStr == null) {
    return fail('Missing required flag: --dc <number>', 'tag compute hazard CON --dc 14', 'compute hazard');
  }

  const dc = Number(dcStr);
  if (!Number.isInteger(dc) || dc <= 0) {
    return fail(`Invalid DC value: "${dcStr}"`, 'tag compute hazard CON --dc 14', 'compute hazard');
  }

  const state = await tryLoadState();
  if (!state) return noState('compute');
  const pendingRoll = selectPendingRollForResolution(state._pendingRolls, state.rollHistory, state.scene, {
    type: 'hazard',
    stat,
    dc,
  });

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
    dieType: 'd20',
  };

  state._lastComputation = computation;
  state.rollHistory.push({
    scene: state.scene,
    type: 'hazard_save',
    stat,
    roll,
    modifier,
    total,
    dc,
    outcome,
    ...(pendingRoll ? { action: pendingRoll.action } : {}),
    ...(pendingRoll?.skill ? { skill: pendingRoll.skill } : {}),
  });
  await saveState(state);

  return ok({ type: 'hazard_save', stat, roll, modifier, total, dc, outcome }, 'compute hazard');
}

async function encounter(args: string[]): Promise<CommandResult> {
  const escalationStr = parseArgs(args).flags.escalation ?? '0';
  const escalation = Number(escalationStr);

  if (!Number.isInteger(escalation) || escalation < 0) {
    return fail(
      `Invalid escalation value: "${escalationStr}". Must be a non-negative integer.`,
      'tag compute encounter --escalation 2',
      'compute encounter',
    );
  }

  const roll = rollD20();
  const enc = encounterType(roll, escalation);

  const computation: ComputationResult = {
    type: 'encounter_roll',
    roll,
    dieType: 'd20',
    context: { escalation, encounter: enc },
  };

  const state = await tryLoadState();
  if (state) {
    state._lastComputation = computation;
    state.rollHistory.push({ scene: state.scene, type: 'encounter_roll', roll, outcome: enc });
    await saveState(state);
  }

  return ok({ type: 'encounter_roll', roll, escalation, encounter: enc }, 'compute encounter');
}

async function levelup(): Promise<CommandResult> {
  const state = await tryLoadState();
  if (!state) return noState('compute');
  if (!state.character) {
    return fail('No character exists.', 'Create a character first.', 'compute levelup');
  }

  const { level, xp } = state.character;
  const maxLevel = XP_THRESHOLDS[XP_THRESHOLDS.length - 1]!.level;

  if (level >= maxLevel) {
    return ok(
      { type: 'levelup_result', eligible: false, reason: 'already_max', currentLevel: level, currentXp: xp },
      'compute levelup',
    );
  }

  const nextThreshold = XP_THRESHOLDS.find(t => t.level === level + 1);
  if (!nextThreshold || xp < nextThreshold.xp) {
    return ok(
      {
        type: 'levelup_result',
        eligible: false,
        reason: 'insufficient_xp',
        currentLevel: level,
        currentXp: xp,
        nextThreshold: nextThreshold?.xp ?? null,
        xpNeeded: nextThreshold ? nextThreshold.xp - xp : null,
      },
      'compute levelup',
    );
  }

  const newLevel = level + 1;
  const reward = LEVEL_REWARDS[newLevel];
  const hpGain = reward?.hpGain ?? 0;
  const improvement = reward?.improvement ?? '';

  state.character.level = newLevel;
  state.character.maxHp += hpGain;
  state.character.hp += hpGain;
  // Proficiency bonus increases at levels 5 and 9 (d20 system)
  state.character.proficiencyBonus = newLevel >= 9 ? 4 : newLevel >= 5 ? 3 : 2;
  state._computedLevel = newLevel;
  state._levelupPending = false;

  const computation: LevelupResult = { type: 'levelup_result', previousLevel: level, newLevel, hpGain, improvement };
  state._lastComputation = computation;
  await saveState(state);

  return ok(
    {
      type: 'levelup_result',
      eligible: true,
      previousLevel: level,
      newLevel,
      hpGain,
      improvement,
      newMaxHp: state.character.maxHp,
      newHp: state.character.hp,
    },
    'compute levelup',
  );
}

export async function handleCompute(args: string[]): Promise<CommandResult> {
  const sub = args[0];
  switch (sub) {
    case 'contest':
      return contest(args.slice(1));
    case 'hazard':
      return hazard(args.slice(1));
    case 'encounter':
      return encounter(args.slice(1));
    case 'levelup':
      return levelup();
    case 'pregen':
      return pregen(args.slice(1));
    default:
      return fail(
        `Unknown compute subcommand: ${sub ?? '(none)'}. Available: contest, hazard, encounter, levelup, pregen`,
        'tag compute pregen --theme space --rulebook d20_system',
        'compute',
      );
  }
}

async function pregen(args: string[]): Promise<CommandResult> {
  const flags = parseArgs(args).flags;
  const theme = flags.theme || 'space';
  const rulebook = flags.rulebook || 'd20_system';

  // This command provides a structured template/hint for the AI GM
  // to follow when generating pre-generated character payloads.
  // It ensures the GM uses the correct schema for ta-character-creation.
  return ok(
    {
      type: 'pregen_template',
      theme,
      rulebook,
      schema: {
        name: 'Character Name',
        class: 'Archetype/Role',
        hook: 'Narrative hook (1-2 sentences)',
        stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
        hp: 10,
        ac: 10,
        proficiencies: ['Skill 1', 'Skill 2'],
        startingInventory: [{ name: 'Item Name', type: 'equipment|weapon|consumable|key_item', description: '...' }],
      },
      guidance: `Generate 3 character objects for the "${theme}" theme. Use high-fidelity narrative hooks and specific starting equipment. Return ONLY the JSON array of character objects.`,
    },
    'compute pregen',
  );
}
