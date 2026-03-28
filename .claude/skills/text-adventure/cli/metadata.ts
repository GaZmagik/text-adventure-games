import type { GmState } from './types';
import { MODULE_DIGESTS } from './data/module-digests';

export type TopLevelCommandName =
  | 'state'
  | 'compute'
  | 'render'
  | 'save'
  | 'quest'
  | 'batch'
  | 'rules'
  | 'export';

export type SubcommandHelp = {
  name: string;
  usage: string;
  description: string;
  example: string;
};

export type CommandHelp = {
  command: string;
  description: string;
  subcommands: SubcommandHelp[];
};

export const TOP_LEVEL_COMMANDS = [
  'state',
  'compute',
  'render',
  'save',
  'quest',
  'batch',
  'rules',
  'export',
] as const satisfies readonly TopLevelCommandName[];

export const COMMAND_HELP: Record<TopLevelCommandName, CommandHelp> = {
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
      { name: 'context', usage: 'tag state context', description: 'Check module context — lists required files and module digests for recovery after compaction', example: 'tag state context' },
      { name: 'sync', usage: 'tag state sync [--apply] [--scene N] [--room id]', description: 'Post-scene verification — checks module context, quest/worldFlag consistency, level-up eligibility. MANDATORY before every scene.', example: 'tag state sync --apply --scene 5 --room bridge' },
    ],
  },
  compute: {
    command: 'tag compute',
    description: 'Probabilistic operations reading from state. Writes results to _lastComputation only.',
    subcommands: [
      { name: 'contest', usage: 'tag compute contest <ATTR> <npc_id>', description: 'Hidden contested roll — reads NPC modifier from state, rolls d20, computes margin', example: 'tag compute contest CHA merchant_01' },
      { name: 'hazard', usage: 'tag compute hazard <ATTR> --dc <N>', description: 'Environmental hazard save roll', example: 'tag compute hazard CON --dc 14' },
      { name: 'encounter', usage: 'tag compute encounter --escalation <N>', description: 'Random encounter roll against encounter table', example: 'tag compute encounter --escalation 2' },
      { name: 'levelup', usage: 'tag compute levelup', description: 'Check XP threshold and level up character if eligible', example: 'tag compute levelup' },
    ],
  },
  render: {
    command: 'tag render',
    description: 'Deterministic HTML widget generation with real CSS from style files.',
    subcommands: [
      { name: '<widget>', usage: "tag render <widget> [--style <name>] [--raw] [--data '<json>']", description: 'Generate complete HTML for a widget type. Reads state and active style. Add --raw for plain HTML instead of JSON.', example: 'tag render scene --style terminal' },
    ],
  },
  save: {
    command: 'tag save',
    description: 'Persistence operations — generate, load, validate, and migrate save files.',
    subcommands: [
      { name: 'generate', usage: 'tag save generate', description: 'Generate a save payload from current game state', example: 'tag save generate' },
      { name: 'load', usage: 'tag save load <file.save.md | save-string>', description: 'Load a save from a trusted file path or raw save string', example: 'tag save load game.save.md' },
      { name: 'validate', usage: 'tag save validate <string|file>', description: 'Check save integrity without loading', example: 'tag save validate game.save.md' },
      { name: 'migrate', usage: 'tag save migrate <string|file>', description: 'Forward-migrate an older save to current format', example: 'tag save migrate old-game.save.md' },
    ],
  },
  quest: {
    command: 'tag quest',
    description: 'Quest lifecycle management — complete quests, add objectives/clues, check status.',
    subcommands: [
      { name: 'complete', usage: 'tag quest complete <quest_id> <objective_id>', description: 'Mark a quest objective as completed', example: 'tag quest complete main_quest_01 find_base' },
      { name: 'add-objective', usage: 'tag quest add-objective <quest_id> --id <id> --desc "text"', description: 'Add a new objective to an active quest', example: 'tag quest add-objective main_quest_01 --id find_base --desc "Find the hidden base"' },
      { name: 'add-clue', usage: 'tag quest add-clue <quest_id> "clue text"', description: 'Add a clue or journal entry to a quest', example: 'tag quest add-clue main_quest_01 "The base is in sector 7"' },
      { name: 'status', usage: 'tag quest status <quest_id>', description: 'Show current status and objectives for a quest', example: 'tag quest status main_quest_01' },
      { name: 'list', usage: 'tag quest list', description: 'List all quests with their current status', example: 'tag quest list' },
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
  export: {
    command: 'tag export',
    description: 'World-sharing via .lore.md files. Generates human-readable markdown with embedded checksummed mechanical payload.',
    subcommands: [
      { name: 'generate', usage: 'tag export generate', description: 'Generate a .lore.md from current game state with NPC roster, factions, quests, and embedded LF1 payload', example: 'tag export generate' },
      { name: 'load', usage: 'tag export load <file.lore.md>', description: 'Load a .lore.md file and apply its mechanical data to game state', example: 'tag export load /path/to/world.lore.md' },
      { name: 'validate', usage: 'tag export validate <file.lore.md>', description: 'Validate a .lore.md payload without applying it', example: 'tag export validate /path/to/world.lore.md' },
    ],
  },
};

export const MUTATING_COMMANDS = new Set<string>([
  'state',
  'save',
  'compute',
  'quest',
  'export',
]);

export const WIDGET_TYPE_NAMES = [
  'scene', 'ticker', 'character', 'dice', 'dice-pool', 'ship', 'crew', 'codex', 'map',
  'starchart', 'footer', 'save-div', 'levelup', 'recap', 'combat-turn',
  'dialogue', 'settings', 'scenario-select', 'character-creation', 'arc-complete',
] as const;

export const PRE_GAME_WIDGETS = new Set<string>([
  'settings',
  'scenario-select',
  'character-creation',
  'dice-pool',
]);

/** Alias — pre-config widgets are the same set as pre-game widgets. */
export const PRE_CONFIG_WIDGETS: Set<string> = PRE_GAME_WIDGETS;

export const WIDGET_STYLE_SCOPES: Record<string, readonly string[] | undefined> = {
  scene: ['vars'],
  dice: ['vars'],
  'dice-pool': ['vars'],
  recap: ['vars'],
};

/** CSS selectors each widget type needs from the full theme block.
 *  Used by filterCssBySelectors to tree-shake unused rules. */
export const WIDGET_CSS_SELECTORS: Record<string, readonly string[]> = {
  scene: [
    // Widget root + progressive reveal
    '.root', '#reveal-full',
    // Location bar
    '.loc-bar', '.loc-name', '.scene-num',
    // Atmosphere pills
    '.atmo-strip', '.atmo-pill',
    // Narrative (serif override)
    '.narrative', '.brief-text',
    // Narrative inline highlights
    '.nar-npc', '.nar-item', '.nar-sfx', '.nar-name', '.nar-aside',
    // Section label
    '.section-label',
    // Button rows + buttons
    '.btn-row', '.btn-action', '.action-btn', '.btn-poi', '.poi-btn',
    '.continue-btn', '.btn-neutral',
    // Action cards
    '.action-card', '.action-card-num', '.action-card-body',
    '.action-card-title', '.action-card-desc', '.action-card-mech',
    // Status bar + pips
    '.status-bar', '.hp-pips', '.pip', '.xp-track', '.xp-fill',
    // Footer
    '.footer-row', '.footer-left', '.footer-right', '.footer-btn',
    // Panel overlay
    '#panel-overlay', '.panel-header', '.panel-title', '.panel-close-btn', '.panel-content',
    // Animations
    '@keyframes sta-fade-in', '@keyframes sta-die-spin', '@keyframes sta-init-pulse',
    // Shared transitions + focus
    'button:focus-visible', '[data-prompt]:focus-visible',
    // Misc
    '.chapter-heading', '.fallback-text',
    // Reduced motion
    '@media (prefers-reduced-motion',
  ],
};

export const WIDGET_CSS_SCOPES: Record<string, readonly string[]> = {
  scene: ['shared', 'scene', 'atmosphere'],
  dice: ['dice'],
  'dice-pool': ['dice'],
  'combat-turn': ['shared', 'dice', 'scene'],
  character: ['shared'],
  'character-creation': ['shared'],
  settings: ['shared'],
  'scenario-select': ['shared'],
  ship: ['shared'],
  crew: ['shared'],
  codex: ['shared'],
  map: ['shared'],
  starchart: ['shared'],
  ticker: ['shared'],
  footer: ['shared'],
  'save-div': ['shared'],
  levelup: ['shared'],
  recap: ['shared', 'dice'],
  dialogue: ['shared'],
  'arc-complete': ['shared'],
};

const PROSE_CRAFT_PATH = 'modules/prose-craft.md';

export function buildModulesRequired(state: GmState | null): string[] {
  const active = state?.modulesActive ?? [];
  const hasProseCraft = active.includes('prose-craft');
  return hasProseCraft
    ? active.map(moduleName => `modules/${moduleName}.md`)
    : [PROSE_CRAFT_PATH, ...active.map(moduleName => `modules/${moduleName}.md`)];
}

export function buildFeatureChecklist(state: GmState | null): string[] {
  const active = state?.modulesActive ?? [];
  const items: string[] = [];

  items.push('prose-craft ON -> re-read modules/prose-craft.md this turn');

  for (const moduleName of active) {
    if (moduleName === 'prose-craft') continue;

    const digest = MODULE_DIGESTS[moduleName];
    if (moduleName === 'audio') {
      items.push('audio ON -> scene must include Web Audio soundscape with play/stop button');
      continue;
    }
    if (moduleName === 'atmosphere') {
      items.push('atmosphere ON -> scene must include .atmosphere-strip div with 3-5 sensory pills');
      continue;
    }
    if (digest) {
      items.push(`${moduleName} ON -> ${digest}`);
      continue;
    }
    items.push(`${moduleName} ON -> re-read modules/${moduleName}.md this turn`);
  }

  return items;
}
