// tag CLI — Setup Command
// Single-command game initialisation: applies settings + character in one call.
// Replaces the 10+ step manual setup between character creation and first scene.

import type { CommandResult, Character, CharacterOrigin, OpeningLens } from '../types';
import { ok, fail } from '../lib/errors';
import { saveState, createDefaultState, tryLoadState, backupState } from '../lib/state-store';
import { parseArgs } from '../lib/args';
import { clearWorkflowMarkers } from '../lib/workflow-markers';
import { containsForbiddenKeys } from '../lib/security';

function calcModifier(stat: number): number {
  return Math.floor((stat - 10) / 2);
}

function normaliseText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function isOpeningLens(value: unknown): value is OpeningLens {
  return value === 'rian' || value === 'suri' || value === 'mara';
}

function isCharacterOrigin(value: unknown): value is CharacterOrigin {
  return value === 'pregen' || value === 'custom';
}

function includesAnyLabel(label: string, keywords: string[]): boolean {
  return keywords.some(keyword => label.includes(keyword));
}

function inferOpeningLens(charData: Record<string, unknown>, stats: Character['stats']): OpeningLens {
  if (isOpeningLens(charData.openingLens)) return charData.openingLens;

  const classLabel = normaliseText(charData.archetypeLabel ?? charData.class);
  if (includesAnyLabel(classLabel, ['cartographer', 'navigator', 'investigator', 'survey', 'scholar', 'lorekeeper'])) {
    return 'rian';
  }
  if (includesAnyLabel(classLabel, ['diver', 'pilot', 'worker', 'hauler', 'mechanic', 'scout', 'salvager'])) {
    return 'suri';
  }
  if (includesAnyLabel(classLabel, ['medic', 'choir', 'chaplain', 'speaker', 'defector', 'witness'])) {
    return 'mara';
  }

  const proficiencies = Array.isArray(charData.proficiencies) ? charData.proficiencies.map(normaliseText) : [];
  const lensScores: Record<OpeningLens, number> = { rian: 0, suri: 0, mara: 0 };
  for (const proficiency of proficiencies) {
    if (['investigation', 'navigation', 'history', 'arcana', 'perception', 'analysis'].includes(proficiency))
      lensScores.rian += 2;
    if (['athletics', 'survival', 'stealth', 'repair', 'piloting', 'engineering', 'endurance'].includes(proficiency))
      lensScores.suri += 2;
    if (['medicine', 'persuasion', 'insight', 'lore', 'religion', 'empathy'].includes(proficiency))
      lensScores.mara += 2;
  }
  if (lensScores.rian > lensScores.suri && lensScores.rian > lensScores.mara) return 'rian';
  if (lensScores.mara > lensScores.rian && lensScores.mara > lensScores.suri) return 'mara';
  if (lensScores.suri > lensScores.rian && lensScores.suri > lensScores.mara) return 'suri';

  const rianStats = stats.INT + stats.WIS;
  const suriStats = stats.STR + stats.DEX + stats.CON;
  const maraStats = stats.WIS + stats.CHA + stats.INT;
  if (rianStats > suriStats && rianStats > maraStats) return 'rian';
  if (maraStats > rianStats && maraStats > suriStats) return 'mara';
  return 'suri';
}

function inferCharacterOrigin(charData: Record<string, unknown>): CharacterOrigin {
  return isCharacterOrigin(charData.characterOrigin) ? charData.characterOrigin : 'custom';
}

function inferPrologueVariant(
  charData: Record<string, unknown>,
  characterOrigin: CharacterOrigin,
  openingLens: OpeningLens,
): string {
  if (typeof charData.prologueVariant === 'string' && charData.prologueVariant.trim().length > 0) {
    return charData.prologueVariant.trim();
  }
  return `${characterOrigin}_${openingLens}`;
}

export async function handleSetup(args: string[]): Promise<CommandResult> {
  const subcommand = args[0];
  if (subcommand !== 'apply') {
    return fail(
      "Unknown subcommand. Usage: tag setup apply --settings '<json>' --character '<json>'",
      "tag setup apply --settings '...' --character '...'",
      'setup',
    );
  }

  const parsed = parseArgs(args.slice(1), []);
  const settingsRaw = parsed.flags.settings;
  const characterRaw = parsed.flags.character;

  if (!settingsRaw) {
    return fail(
      'Missing --settings flag.',
      'tag setup apply --settings \'{"rulebook":"d20_system","visualStyle":"station","modules":[...]}\' --character \'...\'',
      'setup',
    );
  }
  if (!characterRaw) {
    return fail(
      'Missing --character flag.',
      'tag setup apply --settings \'...\' --character \'{"name":"...","stats":{...},"hp":N,"ac":N,"proficiencies":[...],"abilities":[...],"pronouns":"..."}\'',
      'setup',
    );
  }

  let settings: Record<string, unknown>;
  let charData: Record<string, unknown>;
  try {
    settings = JSON.parse(settingsRaw);
  } catch {
    return fail('Invalid JSON in --settings flag.', 'Provide valid JSON.', 'setup');
  }
  try {
    charData = JSON.parse(characterRaw);
  } catch {
    return fail('Invalid JSON in --character flag.', 'Provide valid JSON.', 'setup');
  }
  if (containsForbiddenKeys(settings)) {
    return fail(
      '--settings contains forbidden keys (__proto__, constructor, prototype).',
      'Remove prohibited keys from --settings JSON.',
      'setup',
    );
  }
  if (containsForbiddenKeys(charData)) {
    return fail(
      '--character contains forbidden keys (__proto__, constructor, prototype).',
      'Remove prohibited keys from --character JSON.',
      'setup',
    );
  }

  // Check for existing lore-populated state — merge onto it instead of replacing.
  await backupState();
  const existing = await tryLoadState();
  const hasLoreData =
    existing !== null &&
    ((typeof existing._loreSource === 'string' && existing._loreSource.length > 0) ||
      existing.rosterMutations.length > 0 ||
      existing.codexMutations.length > 0);
  const state = hasLoreData ? existing : createDefaultState();

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
  const openingLens = inferOpeningLens(charData, stats);
  const characterOrigin = inferCharacterOrigin(charData);
  const prologueVariant = inferPrologueVariant(charData, characterOrigin, openingLens);
  const startingCurrency = Number(charData.currency ?? charData.startingCurrency) || 0;
  const currencyName = String(charData.currencyName ?? 'credits');

  const character: Character = {
    name,
    class: archetypeLabel,
    hp,
    maxHp: hp,
    ac,
    level: 1,
    xp: 0,
    currency: startingCurrency,
    currencyName,
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
  if (
    Array.isArray(charData.abilities) ||
    Array.isArray(charData.equipment) ||
    Array.isArray(charData.startingInventory)
  ) {
    const gear = Array.isArray(charData.equipment)
      ? charData.equipment
      : Array.isArray(charData.startingInventory)
        ? charData.startingInventory
        : charData.abilities;
    if (Array.isArray(gear)) {
      character.inventory = gear.map((item, i) => {
        if (typeof item === 'string') {
          const isWeapon =
            item.toLowerCase().includes('d4') ||
            item.toLowerCase().includes('d6') ||
            item.toLowerCase().includes('d8') ||
            item.toLowerCase().includes('weapon') ||
            item.toLowerCase().includes('pistol') ||
            item.toLowerCase().includes('sword');
          const isArmour =
            item.toLowerCase().includes('ac') ||
            item.toLowerCase().includes('armour') ||
            item.toLowerCase().includes('armor') ||
            item.toLowerCase().includes('suit') ||
            item.toLowerCase().includes('cloak') ||
            item.toLowerCase().includes('shield');
          const type = isWeapon
            ? 'weapon'
            : isArmour
              ? 'armour'
              : i === 0
                ? 'weapon'
                : i === 1
                  ? 'armour'
                  : 'consumable';
          if (isWeapon && character.equipment.weapon === 'None') character.equipment.weapon = item;
          if (isArmour && character.equipment.armour === 'None') character.equipment.armour = item;
          return { name: item, type, slots: 1, description: '' };
        }
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          const name = String(record.name ?? `Item ${i + 1}`);
          const type = typeof record.type === 'string' ? record.type : 'misc';
          const description = String(record.description ?? record.effect ?? '');
          const slots = Number(record.slots) || 1;
          if (type === 'weapon' && character.equipment.weapon === 'None') character.equipment.weapon = name;
          if ((type === 'armour' || type === 'armor') && character.equipment.armour === 'None')
            character.equipment.armour = name;
          return { name, type, slots, description };
        }
        return { name: String(item), type: 'misc', slots: 1, description: '' };
      });
    }
  }

  state.character = character;
  state.openingLens = openingLens;
  state.prologueVariant = prologueVariant;
  state.prologueComplete = false;
  state.characterOrigin = characterOrigin;
  state.worldFlags.pronouns = pronouns;
  state.worldFlags.openingLens = openingLens;
  state.worldFlags.prologueVariant = prologueVariant;
  state.worldFlags.prologueComplete = false;
  state.worldFlags.characterOrigin = characterOrigin;

  await saveState(state);
  clearWorkflowMarkers();

  return ok(
    {
      applied: true,
      merged: hasLoreData,
      character: {
        name,
        class: archetypeLabel,
        pronouns,
        hp,
        ac,
        stats,
        currency: startingCurrency,
        openingLens,
        prologueVariant,
        characterOrigin,
      },
      settings: { visualStyle, rulebook, difficulty, pacing, moduleCount: modules.length },
      nextStep:
        'Run `tag module activate-tier 1` then `tag module activate-tier 2` to load module content. Then `tag state sync --apply --scene 1 --room <starting_room>` to begin.',
    },
    'setup',
  );
}
