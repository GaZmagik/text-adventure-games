// tag CLI — Lore Serialiser
// Pure functions for .lore.md generation and parsing.

import type {
  GmState, NpcMutation, Quest, CodexMutation, TimeState,
  MapState, StoryArchitectState, CarryForward, ArcSummary, ShipState, CrewMutation,
} from '../types';
import { SCHEMA_VERSION } from './constants';
export { parseLoreFrontmatter, buildLoreFrontmatter } from './lore-frontmatter';
export type { LoreFrontmatter } from './lore-frontmatter';

// ── Types ────────────────────────────────────────────────────────────

/** 
 * Summary of the player character that was active at the time of export. 
 */
export type PreviousAdventurer = {
  name: string;
  class: string;
  level: number;
} | null;

/** 
 * The mechanical data payload embedded in a .lore.md file. 
 * 
 * @remarks
 * This object is serialised to Base64 and embedded in an HTML comment 
 * (LF1 format) at the end of the exported file. It contains the minimum 
 * state required to reconstruct the world for a new player.
 */
export type LoreMechanicalData = {
  _loreVersion: 1;
  _schemaVersion: string;
  rosterMutations: NpcMutation[];
  factions: Record<string, number>;
  quests: Quest[];
  worldFlags: Record<string, boolean | number | string>;
  currentRoom: string;
  openingLens?: GmState['openingLens'];
  prologueVariant?: string;
  prologueComplete?: boolean;
  characterOrigin?: GmState['characterOrigin'];
  time: TimeState;
  modulesActive: string[];
  seed?: string;
  theme?: string;
  visualStyle?: string;
  codexMutations: CodexMutation[];
  mapState?: MapState;
  storyArchitect?: StoryArchitectState;
  shipState?: ShipState;
  crewMutations?: CrewMutation[];
  arc?: number;
  arcType?: 'standard' | 'epic' | 'branching';
  carryForward?: CarryForward | null;
  arcHistory?: ArcSummary[];
  previousAdventurer: PreviousAdventurer;
  authoredBody?: string;
  outputStyle?: string;
  pacingProfile?: 'fast' | 'normal' | 'slow';
  authoredSourceId?: string;
};

// ── YAML escaping ───────────────────────────────────────────────────

/** 
 * Escape a value for safe YAML frontmatter interpolation. 
 */
function yamlSafe(value: string): string {
  if (/^[a-zA-Z0-9._\-]+$/.test(value)) return value;
  return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
}

// ── Faction label thresholds ─────────────────────────────────────────

/**
 * Maps a numeric faction standing to a human-readable label.
 */
function factionLabel(standing: number): string {
  if (standing < -50) return 'hostile';
  if (standing < -20) return 'unfriendly';
  if (standing <= 20) return 'neutral';
  if (standing <= 50) return 'friendly';
  return 'allied';
}

// ── extractMechanicalData ────────────────────────────────────────────

/**
 * Extracts the world-sharing data from a live GmState.
 * 
 * @param {GmState} state - The current game state.
 * @returns {LoreMechanicalData} - The stripped world data.
 * 
 * @remarks
 * This function handles the "World Export" logic:
 * 1. Captures character info as `previousAdventurer`.
 * 2. Resets all codex entries to `locked` (for discovery by the new player).
 * 3. Resets map visibility (`visitedZones`).
 * 4. Preserves NPCs, Factions, Quests, and World Flags.
 */
export function extractMechanicalData(state: GmState): LoreMechanicalData {
  const previousAdventurer: PreviousAdventurer = state.character
    ? { name: state.character.name, class: state.character.class, level: state.character.level }
    : null;

  // Reset codex states to locked
  const codexMutations: CodexMutation[] = state.codexMutations.map(c => ({
    ...c,
    state: 'locked' as const,
  }));

  // Empty visitedZones in mapState
  const mapState: MapState | undefined = state.mapState
    ? { ...state.mapState, visitedZones: [] }
    : undefined;

  const data: LoreMechanicalData = {
    _loreVersion: 1,
    _schemaVersion: SCHEMA_VERSION,
    rosterMutations: state.rosterMutations,
    factions: state.factions,
    quests: state.quests,
    worldFlags: state.worldFlags,
    currentRoom: state.currentRoom,
    ...(state.openingLens !== undefined ? { openingLens: state.openingLens } : {}),
    ...(state.prologueVariant !== undefined ? { prologueVariant: state.prologueVariant } : {}),
    ...(state.prologueComplete !== undefined ? { prologueComplete: state.prologueComplete } : {}),
    ...(state.characterOrigin !== undefined ? { characterOrigin: state.characterOrigin } : {}),
    time: state.time,
    modulesActive: state.modulesActive,
    ...(state.seed !== undefined ? { seed: state.seed } : {}),
    ...(state.theme !== undefined ? { theme: state.theme } : {}),
    ...(state.visualStyle !== undefined ? { visualStyle: state.visualStyle } : {}),
    codexMutations,
    ...(mapState !== undefined ? { mapState } : {}),
    ...(state.storyArchitect !== undefined ? { storyArchitect: state.storyArchitect } : {}),
    ...(state.shipState !== undefined ? { shipState: state.shipState } : {}),
    ...(state.crewMutations !== undefined ? { crewMutations: state.crewMutations } : {}),
    ...(state.arc !== undefined ? { arc: state.arc } : {}),
    ...(state.arcType !== undefined ? { arcType: state.arcType } : {}),
    ...(state.carryForward !== undefined ? { carryForward: state.carryForward } : {}),
    ...(state.arcHistory !== undefined ? { arcHistory: state.arcHistory } : {}),
    previousAdventurer,
    ...(state.authoredBody !== undefined ? { authoredBody: state.authoredBody } : {}),
    ...(state.outputStyle !== undefined ? { outputStyle: state.outputStyle } : {}),
    ...(state.pacingProfile !== undefined ? { pacingProfile: state.pacingProfile } : {}),
    ...(state.authoredSourceId !== undefined ? { authoredSourceId: state.authoredSourceId } : {}),
  };

  return data;
}

// ── encodeLorePayload ────────────────────────────────────────────────

/**
 * Encodes mechanical data into a Base64-packed LF1 string.
 */
export function encodeLorePayload(data: LoreMechanicalData): string {
  return 'LF1:' + Buffer.from(JSON.stringify(data), 'utf-8').toString('base64');
}

// ── extractLorePayload ───────────────────────────────────────────────

/** Regular expression for finding the embedded lore comment. */
const RE_LORE_PAYLOAD = /<!--\s*LORE:([\da-fA-F]{8}\.LF\d+:[\S]+)\s*-->/;

/**
 * Extracts the raw LF1 payload string from a markdown file's comments.
 */
export function extractLorePayload(content: string): string | null {
  const match = content.match(RE_LORE_PAYLOAD);
  return match ? match[1]! : null;
}

// ── extractFrontmatterField ──────────────────────────────────────────

/**
 * Naively extracts a single field value from YAML frontmatter.
 */
export function extractFrontmatterField(content: string, field: string): string | null {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;
  const frontmatter = fmMatch[1]!;
  const line = frontmatter.split('\n').find(l => l.startsWith(field + ':'));
  if (!line) return null;
  let value = line.slice(field.length + 1).trim();
  // Strip surrounding quotes
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return value;
}

// ── buildLoreMarkdown ────────────────────────────────────────────────

/** Builds the YAML frontmatter for the lore export. */
function buildFrontmatter(state: GmState): string {
  const now = new Date().toISOString();
  const title = state.theme
    ? `Lore Export — ${state.theme}`
    : 'Lore Export';
  const rulebook = typeof state.worldFlags.rulebook === 'string' && state.worldFlags.rulebook.trim().length > 0
    ? state.worldFlags.rulebook.trim()
    : 'd20_system';
  const calendarSystem = state.time?.calendarSystem ?? 'elapsed-only';
  const startDate = state.time?.date ?? 'Day 1';
  const startTime = state.time?.hour != null ? `${String(state.time.hour)}:00` : '08:00';
  const modules = state.modulesActive ?? [];

  const lines = [
    '---',
    'format: text-adventure-lore',
    'version: 1',
    `skill-version: ${SCHEMA_VERSION}`,
    `title: ${yamlSafe(title)}`,
    'author: GM',
    `theme: ${yamlSafe(state.theme ?? 'unset')}`,
    'tone: unset',
    'acts: 3',
    'estimated-scenes: 30',
    'players: 1',
    'difficulty: normal',
    'edited: false',
    'exported: true',
    `exported-from: scene ${state.scene}`,
    `exported-date: ${now}`,
    `seed: ${yamlSafe(state.seed ?? 'none')}`,
    `rulebook: ${yamlSafe(rulebook)}`,
    `calendar-system: ${yamlSafe(calendarSystem)}`,
    `start-date: ${yamlSafe(startDate)}`,
    `start-time: ${yamlSafe(startTime)}`,
    `recommended-styles: ${yamlSafe(state.visualStyle ?? 'default')}`,
    `required-modules: ${modules.join(', ') || 'none'}`,
    `optional-modules: none`,
  ];
  if (state.outputStyle) lines.push(`output-style: ${yamlSafe(state.outputStyle)}`);
  if (state.pacingProfile) lines.push(`pacing-profile: ${yamlSafe(state.pacingProfile)}`);
  lines.push('---');
  return lines.join('\n');
}

/** Builds the 'Previous Adventurer' section. */
function buildPreviousAdventurer(state: GmState): string {
  const lines = ['## Previous Adventurer', ''];
  if (state.character) {
    lines.push(`**${state.character.name}** — ${state.character.class}, Level ${state.character.level}`);
  } else {
    lines.push('No previous adventurer.');
  }
  lines.push('');
  return lines.join('\n');
}

/** Builds the 'Location Atlas' section from map state. */
function buildLocationAtlas(state: GmState): string {
  const lines = ['## Location Atlas', ''];
  if (state.mapState) {
    lines.push(`- **Current Zone:** ${state.mapState.currentZone}`);
    if (state.mapState.revealedZones.length > 0) {
      lines.push(`- **Revealed Zones:** ${state.mapState.revealedZones.join(', ')}`);
    }
    for (const [door, doorState] of Object.entries(state.mapState.doorStates)) {
      lines.push(`- **Door** ${door}: ${doorState}`);
    }
  } else {
    lines.push('No map data available.');
  }
  lines.push('');
  return lines.join('\n');
}

/** Builds the 'NPC Roster' section. */
function buildNpcRoster(state: GmState): string {
  const lines = ['## NPC Roster', ''];
  if (state.rosterMutations.length === 0) {
    lines.push('No NPCs registered.');
    lines.push('');
    return lines.join('\n');
  }
  for (const npc of state.rosterMutations) {
    lines.push(`### ${npc.name}`);
    lines.push('');
    lines.push(`- **ID:** ${npc.id}`);
    lines.push(`- **Role:** ${npc.role}`);
    lines.push(`- **Pronouns:** ${npc.pronouns}`);
    lines.push(`- **Tier:** ${npc.tier}`);
    lines.push(`- **Level:** ${npc.level}`);
    lines.push(`- **HP:** ${npc.hp}/${npc.maxHp}`);
    lines.push(`- **AC:** ${npc.ac}`);
    lines.push(`- **Soak:** ${npc.soak}`);
    lines.push(`- **Damage Dice:** ${npc.damageDice}`);
    lines.push(`- **Disposition:** ${npc.disposition} (trust: ${npc.trust})`);
    lines.push(`- **Status:** ${npc.status}`);
    const stats = Object.entries(npc.stats).map(([k, v]) => `${k}: ${v}`).join(', ');
    lines.push(`- **Stats:** ${stats}`);
    const mods = Object.entries(npc.modifiers).map(([k, v]) => `${k}: ${v}`).join(', ');
    lines.push(`- **Modifiers:** ${mods}`);
    lines.push('');
    lines.push('*Prose description: (to be written by GM)*');
    lines.push('');
  }
  return lines.join('\n');
}

/** Builds the 'Story Spine' section from quest data. */
function buildStorySpine(state: GmState): string {
  const lines = ['## Story Spine', ''];
  if (state.quests.length === 0) {
    lines.push('No quests registered.');
    lines.push('');
    return lines.join('\n');
  }
  for (const quest of state.quests) {
    lines.push(`### ${quest.title}`);
    lines.push('');
    lines.push(`- **ID:** ${quest.id}`);
    lines.push(`- **Status:** ${quest.status}`);
    if (quest.objectives.length > 0) {
      lines.push('- **Objectives:**');
      for (const obj of quest.objectives) {
        const check = obj.completed ? '[x]' : '[ ]';
        lines.push(`  - ${check} ${obj.description}`);
      }
    }
    if (quest.clues.length > 0) {
      lines.push(`- **Clues:** ${quest.clues.join('; ')}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

/** Builds the 'Faction Dynamics' section. */
function buildFactionDynamics(state: GmState): string {
  const lines = ['## Faction Dynamics', ''];
  const entries = Object.entries(state.factions);
  if (entries.length === 0) {
    lines.push('No factions registered.');
    lines.push('');
    return lines.join('\n');
  }
  for (const [name, standing] of entries) {
    const label = factionLabel(standing);
    lines.push(`- **${name}:** ${standing} (${label})`);
  }
  lines.push('');
  return lines.join('\n');
}

/** Builds the 'Codex Entries' section. */
function buildCodexEntries(state: GmState): string {
  const lines = ['## Codex Entries', ''];
  if (state.codexMutations.length === 0) {
    lines.push('No codex entries.');
    lines.push('');
    return lines.join('\n');
  }
  for (const entry of state.codexMutations) {
    lines.push(`- **${entry.id}:** ${entry.state}`);
    if (entry.via) lines.push(`  - Discovered via: ${entry.via}`);
  }
  lines.push('');
  return lines.join('\n');
}

/**
 * Builds the complete human-readable .lore.md content.
 * 
 * @param {GmState} state - The game state to export.
 * @returns {string} - Full Markdown content with YAML frontmatter.
 */
export function buildLoreMarkdown(state: GmState): string {
  const sections = [
    buildFrontmatter(state),
    '',
    '## World History',
    '',
    '*(World history to be written by GM based on the adventure so far.)*',
    '',
    buildPreviousAdventurer(state),
    buildLocationAtlas(state),
    buildNpcRoster(state),
    buildStorySpine(state),
    '## Encounter Tables',
    '',
    '*(Encounter tables to be designed by GM.)*',
    '',
    '## Loot and Rewards',
    '',
    '*(Loot tables to be designed by GM.)*',
    '',
    buildFactionDynamics(state),
    buildCodexEntries(state),
  ];
  return sections.join('\n');
}
