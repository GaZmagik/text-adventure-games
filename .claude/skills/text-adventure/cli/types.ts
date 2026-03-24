// tag CLI — Master Type Definitions
// Mirrors save-codex.md § Full gmState Contract

// ── Primitive Types ────────────────────────────────────────────────

export interface StatBlock {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export type StatName = keyof StatBlock;

export type Pronouns = 'she/her' | 'he/him' | 'they/them';
export type DispositionState = 'hostile' | 'suspicious' | 'neutral' | 'friendly' | 'allied' | 'bonded';
export type BestiaryTier = 'minion' | 'rival' | 'nemesis';
export type NpcStatus = 'active' | 'injured' | 'incapacitated' | 'missing' | 'defected' | 'dead';

// ── Character ──────────────────────────────────────────────────────

export interface Character {
  name: string;
  class: string;
  hp: number;
  maxHp: number;
  ac: number;
  level: number;
  xp: number;
  currency: number;
  currencyName: string;
  stats: StatBlock;
  modifiers: StatBlock;
  proficiencyBonus: number;
  proficiencies: string[];
  abilities: string[];
  inventory: InventoryItem[];
  conditions: string[];
  equipment: { weapon: string; armour: string };
}

export interface InventoryItem {
  name: string;
  type: string;
  slots: number;
  description?: string;
}

// ── NPCs ───────────────────────────────────────────────────────────

export interface NpcMutation {
  id: string;
  name: string;
  pronouns: Pronouns;
  role: string;
  tier: BestiaryTier;
  level: number;
  stats: StatBlock;
  modifiers: StatBlock;
  hp: number;
  maxHp: number;
  ac: number;
  soak: number;
  damageDice: string;
  status: NpcStatus;
  alive: boolean;
  trust: number;
  disposition: DispositionState;
  dispositionSeed: number;
  currentRoom?: string;
  killedInScene?: number;
  specialAbilities?: string[];
}

// ── Time ───────────────────────────────────────────────────────────

export interface TimeState {
  period: string;
  date: string;
  elapsed: number;
  hour: number;
  playerKnowsDate: boolean;
  playerKnowsTime: boolean;
  calendarSystem: string;
  deadline: { label: string; remainingScenes: number } | null;
}

// ── Quests ──────────────────────────────────────────────────────────

export interface Quest {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'failed';
  objectives: QuestObjective[];
}

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
}

// ── Codex ──────────────────────────────────────────────────────────

export interface CodexMutation {
  id: string;
  state: 'locked' | 'partial' | 'discovered' | 'redacted';
  discoveredAt?: number;
  via?: string;
  secrets?: string[];
}

// ── Rolls ──────────────────────────────────────────────────────────

export interface RollRecord {
  scene: number;
  type: string;
  stat: string;
  roll: number;
  modifier: number;
  total: number;
  dc: number;
  outcome: string;
}

// ── Dice ──────────────────────────────────────────────────────────

export type DieType = 'd2' | 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

// ── Computation ────────────────────────────────────────────────────

export interface ComputationResult {
  type: 'contested_roll' | 'hazard_save' | 'encounter_roll';
  stat?: string;
  roll?: number;
  modifier?: number;
  total?: number;
  dc?: number;
  margin?: number;
  outcome?: string;
  npcId?: string;
  npcModifier?: number;
  dieType?: DieType;
  context?: Record<string, unknown>;
}

// ── State History ──────────────────────────────────────────────────

export interface StateHistoryEntry {
  timestamp: string;
  command: string;
  path: string;
  oldValue: unknown;
  newValue: unknown;
}

// ── Module States ──────────────────────────────────────────────────

export interface ShipState {
  name: string;
  systems: Record<string, { integrity: number; status: string; conditions: string[] }>;
  powerAllocations: Record<string, number>;
  repairParts: number;
  scenesSinceRepair: number;
}

export interface MapState {
  currentZone: string;
  visitedZones: string[];
  revealedZones: string[];
  doorStates: Record<string, string>;
  supplies?: { rations: number; water: number };
}

export interface CrewMutation {
  id: string;
  name: string;
  pronouns: Pronouns;
  role: string;
  morale: number;
  stress: number;
  loyalty: number;
  status: NpcStatus;
  task?: string;
}

export interface StoryArchitectState {
  threads: unknown[];
  foreshadowing: unknown[];
  consequences: unknown[];
  pacing: { act: number; actProgress: number; recentBeats: string[] };
}

export interface CarryForward {
  characterProgression: unknown;
  factionStandings: Record<string, number>;
  npcDispositions: unknown[];
  codexDiscoveries: string[];
  worldConsequences: string[];
}

export interface ArcSummary {
  arc: number;
  theme: string;
  conclusion: string;
}

// ── Master Game State ──────────────────────────────────────────────

export interface GmState {
  _version: number;
  scene: number;
  currentRoom: string;
  visitedRooms: string[];
  rollHistory: RollRecord[];
  character: Character | null;
  worldFlags: Record<string, boolean | number | string>;
  seed?: string;
  theme?: string;
  visualStyle?: string;
  modulesActive: string[];
  rosterMutations: NpcMutation[];
  codexMutations: CodexMutation[];
  time: TimeState;
  factions: Record<string, number>;
  quests: Quest[];
  storyArchitect?: StoryArchitectState;
  shipState?: ShipState;
  crewMutations?: CrewMutation[];
  mapState?: MapState;
  systemResources?: Record<string, unknown> | null;
  navPlottedCourse?: string[] | null;
  arc?: number;
  arcType?: 'standard' | 'epic' | 'branching';
  carryForward?: CarryForward | null;
  arcHistory?: ArcSummary[];
  _lastComputation?: ComputationResult;
  _stateHistory: StateHistoryEntry[];
}

// ── Command Types ──────────────────────────────────────────────────

export interface CommandResult {
  ok: boolean;
  command: string;
  data?: unknown;
  error?: { message: string; corrective: string };
  state_snapshot?: Partial<GmState>;
}

