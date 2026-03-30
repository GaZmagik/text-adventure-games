// tag CLI — Setup Command
// Single-command game initialisation: applies settings + character in one call.
// Replaces the 10+ step manual setup between character creation and first scene.

import type { CommandResult, Character } from '../types';
import { ok, fail } from '../lib/errors';
import { tryLoadState, saveState, createDefaultState } from '../lib/state-store';
import { parseArgs } from '../lib/args';

function calcModifier(stat: number): number {
  return Math.floor((stat - 10) / 2);
}

export async function handleSetup(args: string[]): Promise<CommandResult> {
  const subcommand = args[0];
  if (subcommand !== 'apply') {
    return fail('Unknown subcommand. Usage: tag setup apply --settings \'<json>\' --character \'<json>\'', 'tag setup apply --settings \'...\' --character \'...\'', 'setup');
  }

  const parsed = parseArgs(args.slice(1), []);
  const settingsRaw = parsed.flags.settings;
  const characterRaw = parsed.flags.character;

  if (!settingsRaw) {
    return fail('Missing --settings flag.', 'tag setup apply --settings \'{"rulebook":"d20_system","visualStyle":"station","modules":[...]}\' --character \'...\'', 'setup');
  }
  if (!characterRaw) {
    return fail('Missing --character flag.', 'tag setup apply --settings \'...\' --character \'{"name":"...","stats":{...},"hp":N,"ac":N,"proficiencies":[...],"abilities":[...],"pronouns":"..."}\'', 'setup');
  }

  let settings: Record<string, unknown>;
  let charData: Record<string, unknown>;
  try { settings = JSON.parse(settingsRaw); } catch { return fail('Invalid JSON in --settings flag.', 'Provide valid JSON.', 'setup'); }
  try { charData = JSON.parse(characterRaw); } catch { return fail('Invalid JSON in --character flag.', 'Provide valid JSON.', 'setup'); }

  // Initialise or load state
  let state = await tryLoadState();
  if (!state) state = createDefaultState();

  // Apply settings
  const visualStyle = String(settings.visualStyle ?? 'station');
  const rulebook = String(settings.rulebook ?? 'd20_system');
  const difficulty = String(settings.difficulty ?? 'normal');
  const pacing = String(settings.pacing ?? 'normal');
  const modules = Array.isArray(settings.modules) ? settings.modules.map(String) : state.modulesActive;

  state.visualStyle = visualStyle;
  state.worldFlags.rulebook = rulebook;
  state.worldFlags.difficulty = difficulty;
  state.worldFlags.pacing = pacing;
  state.modulesActive = modules;

  // Apply character
  const name = String(charData.name ?? 'Unnamed');
  const pronouns = String(charData.pronouns ?? 'they/them');
  const statsRaw = (charData.stats ?? {}) as Record<string, unknown>;
  const stats = {
    STR: Number(statsRaw.STR) || 10,
    DEX: Number(statsRaw.DEX) || 10,
    CON: Number(statsRaw.CON) || 10,
    INT: Number(statsRaw.INT) || 10,
    WIS: Number(statsRaw.WIS) || 10,
    CHA: Number(statsRaw.CHA) || 10,
  };
  const modifiers = {
    STR: calcModifier(stats.STR),
    DEX: calcModifier(stats.DEX),
    CON: calcModifier(stats.CON),
    INT: calcModifier(stats.INT),
    WIS: calcModifier(stats.WIS),
    CHA: calcModifier(stats.CHA),
  };

  const hp = Number(charData.hp) || 10;
  const ac = Number(charData.ac) || 10;
  const proficiencies = Array.isArray(charData.proficiencies) ? charData.proficiencies.map(String) : [];
  const abilities = Array.isArray(charData.abilities) ? charData.abilities.map(String) : [];
  const archetypeLabel = String(charData.archetypeLabel ?? charData.class ?? 'Adventurer');

  const character: Character = {
    name,
    class: archetypeLabel,
    hp, maxHp: hp,
    ac,
    level: 1,
    xp: 0,
    currency: 0,
    currencyName: 'credits',
    stats,
    modifiers,
    proficiencyBonus: 2,
    proficiencies,
    abilities,
    inventory: [],
    conditions: [],
    equipment: { weapon: 'None', armour: 'None' },
  };

  // Apply equipment from charData if provided
  if (Array.isArray(charData.abilities) || Array.isArray(charData.equipment)) {
    const gear = Array.isArray(charData.equipment) ? charData.equipment : charData.abilities;
    if (Array.isArray(gear)) {
      character.inventory = gear.map((item, i) => {
        if (typeof item === 'string') {
          const isWeapon = item.toLowerCase().includes('d4') || item.toLowerCase().includes('d6') || item.toLowerCase().includes('d8') || item.toLowerCase().includes('weapon') || item.toLowerCase().includes('pistol') || item.toLowerCase().includes('sword');
          const isArmour = item.toLowerCase().includes('ac') || item.toLowerCase().includes('armour') || item.toLowerCase().includes('armor') || item.toLowerCase().includes('suit') || item.toLowerCase().includes('cloak') || item.toLowerCase().includes('shield');
          const type = isWeapon ? 'weapon' : isArmour ? 'armour' : i === 0 ? 'weapon' : i === 1 ? 'armour' : 'consumable';
          if (isWeapon && character.equipment.weapon === 'None') character.equipment.weapon = item;
          if (isArmour && character.equipment.armour === 'None') character.equipment.armour = item;
          return { name: item, type, slots: 1, description: '' };
        }
        return { name: String(item), type: 'misc', slots: 1, description: '' };
      });
    }
  }

  state.character = character;
  state.worldFlags.pronouns = pronouns;

  await saveState(state);

  return ok({
    applied: true,
    character: { name, class: archetypeLabel, pronouns, hp, ac, stats },
    settings: { visualStyle, rulebook, difficulty, pacing, moduleCount: modules.length },
    nextStep: 'Run `tag module activate-tier 1` then `tag module activate-tier 2` to load module content. Then `tag state sync --apply --scene 1 --room <starting_room>` to begin.',
  }, 'setup');
}
