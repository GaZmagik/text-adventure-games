import type { CommandResult } from './types';
import { ok } from './lib/errors';

interface SubcommandHelp {
  name: string;
  usage: string;
  description: string;
  example: string;
}

interface CommandHelp {
  command: string;
  description: string;
  subcommands: SubcommandHelp[];
}

const COMMANDS: Record<string, CommandHelp> = {
  state: {
    command: 'tag state',
    description: 'Game state CRUD and NPC creation. Source of truth for all game data.',
    subcommands: [
      { name: 'get', usage: 'tag state get <dot.path>', description: 'Read a value from game state by dot-notation path', example: 'tag state get character.stats.STR' },
      { name: 'set', usage: 'tag state set <dot.path> <value>', description: 'Set, increment (+=), or decrement (-=) a state value', example: 'tag state set character.hp -= 5' },
      { name: 'create-npc', usage: 'tag state create-npc <id> --name <n> --tier <tier> --pronouns <p> --role <r>', description: 'Generate and persist a complete NPC stat block from bestiary tier rules', example: 'tag state create-npc guard_01 --name "Guard Captain" --tier rival --pronouns he/him --role guard' },
      { name: 'validate', usage: 'tag state validate', description: 'Check game state against schema and report issues', example: 'tag state validate' },
      { name: 'reset', usage: 'tag state reset', description: 'Initialise a fresh empty game state', example: 'tag state reset' },
      { name: 'history', usage: 'tag state history [--limit <n>]', description: 'Show recent state mutations', example: 'tag state history --limit 5' },
    ],
  },
  compute: {
    command: 'tag compute',
    description: 'Probabilistic operations reading from state. Writes results to _lastComputation only.',
    subcommands: [
      { name: 'contest', usage: 'tag compute contest <ATTR> <npc_id>', description: 'Hidden contested roll — reads NPC modifier from state, rolls d20, computes margin', example: 'tag compute contest CHA merchant_01' },
      { name: 'hazard', usage: 'tag compute hazard <type> --dc <N>', description: 'Environmental hazard save roll', example: 'tag compute hazard radiation --dc 14' },
      { name: 'encounter', usage: 'tag compute encounter --escalation <N>', description: 'Random encounter roll against encounter table', example: 'tag compute encounter --escalation 2' },
    ],
  },
  render: {
    command: 'tag render',
    description: 'Deterministic HTML widget generation with real CSS from style files.',
    subcommands: [
      { name: '<widget>', usage: "tag render <widget> [--style <name>] [--raw] [--data '<json>']", description: "Generate complete HTML for a widget type. Reads state and active style. Add --raw for plain HTML instead of JSON.", example: 'tag render scene --style terminal' },
    ],
  },
  save: {
    command: 'tag save',
    description: 'Persistence operations — generate, load, validate, and migrate save files.',
    subcommands: [
      { name: 'generate', usage: 'tag save generate', description: 'Generate a save payload from current game state', example: 'tag save generate' },
      { name: 'load', usage: 'tag save load <file.save.md>', description: 'Load a save from a .save.md file path — ALWAYS use a file path, never pass the raw save string as an argument', example: 'tag save load /mnt/user-data/uploads/game.save.md' },
      { name: 'validate', usage: 'tag save validate <string|file>', description: 'Check save integrity without loading', example: 'tag save validate game.save.md' },
      { name: 'migrate', usage: 'tag save migrate <string|file>', description: 'Forward-migrate an older save to current format', example: 'tag save migrate old-game.save.md' },
    ],
  },
  batch: {
    command: 'tag batch',
    description: 'Execute multiple commands in one call. Semicolon-separated via --commands flag.',
    subcommands: [
      { name: '--commands', usage: 'tag batch --commands "cmd1; cmd2"', description: 'Semicolon-separated commands', example: 'tag batch --commands "state get character.hp; compute contest CHA merchant_01"' },
      { name: '--dry-run', usage: 'tag batch --dry-run --commands "cmd1; cmd2"', description: 'Validate commands without executing', example: 'tag batch --dry-run --commands "state get character.hp; save validate"' },
    ],
  },
  rules: {
    command: 'tag rules',
    description: 'Quick-reference cheat sheet of game rules with file/line references. Run when unsure about any rule.',
    subcommands: [
      { name: '(none)', usage: 'tag rules', description: 'Show all 20 rules across all categories', example: 'tag rules' },
      { name: '<category>', usage: 'tag rules <category>', description: 'Filter by category: output, agency, cli, prose, technical', example: 'tag rules output' },
      { name: '<keyword>', usage: 'tag rules <keyword>', description: 'Search rules by keyword', example: 'tag rules widget' },
    ],
  },
};

// SYNC: must match TEMPLATES keys in commands/render.ts
// TEMPLATES is not exported from render.ts; update this list whenever a template is added or removed.
const WIDGET_TYPES = [
  'scene', 'ticker', 'character', 'dice', 'ship', 'crew', 'codex',
  'map', 'starchart', 'footer', 'save-div', 'levelup', 'recap',
  'combat-turn', 'dialogue', 'settings', 'scenario-select', 'character-creation',
];

export function getTopLevelHelp(): CommandResult {
  return ok({
    commands: Object.values(COMMANDS).map(c => ({
      command: c.command,
      description: c.description,
    })),
    widgetTypes: WIDGET_TYPES,
    usage: 'tag <command> [subcommand] [options]',
    examples: [
      'tag state reset',
      'tag compute contest CHA merchant_01',
      'tag render scene --style terminal',
      'tag save generate',
    ],
  }, 'help');
}

export function getCommandHelp(command: string): CommandResult {
  const help = COMMANDS[command];
  if (!help) {
    return {
      ok: false,
      command: 'help',
      error: {
        message: `Unknown command: ${command}`,
        corrective: `Valid commands: ${Object.keys(COMMANDS).join(', ')}`,
      },
    };
  }
  return ok(help, 'help');
}
