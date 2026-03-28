// tag CLI — Master Type Definitions
// Mirrors save-codex.md § Full gmState Contract

// ── Primitive Types ────────────────────────────────────────────────

export type StatBlock = {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
};

export type StatName = keyof StatBlock;

export type Pronouns = 'she/her' | 'he/him' | 'they/them';
export type DispositionState = 'hostile' | 'suspicious' | 'neutral' | 'friendly' | 'allied' | 'bonded';
export type BestiaryTier = 'minion' | 'rival' | 'nemesis';
export type NpcStatus = 'active' | 'injured' | 'incapacitated' | 'missing' | 'defected' | 'dead';

// ── Character ──────────────────────────────────────────────────────

export type Character = {
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
};

export type InventoryItem = {
  name: string;
  type: string;
  slots: number;
  description?: string;
};

// ── NPCs ───────────────────────────────────────────────────────────

export type NpcMutation = {
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
};

// ── Time ───────────────────────────────────────────────────────────

export type TimeState = {
  period: string;
  date: string;
  elapsed: number;
  hour: number;
  playerKnowsDate: boolean;
  playerKnowsTime: boolean;
  calendarSystem: string;
  deadline: { label: string; remainingScenes: number } | null;
};

// ── Quests ──────────────────────────────────────────────────────────

export type Quest = {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'failed';
  objectives: QuestObjective[];
  clues: string[];
};

export type QuestObjective = {
  id: string;
  description: string;
  completed: boolean;
};

// ── Codex ──────────────────────────────────────────────────────────

export type CodexMutation = {
  id: string;
  state: 'locked' | 'partial' | 'discovered' | 'redacted';
  discoveredAt?: number;
  via?: string;
  secrets?: string[];
};

// ── Rolls ──────────────────────────────────────────────────────────

export type RollType = 'contested_roll' | 'hazard_save' | 'encounter_roll' | 'levelup_result';

export type RollOutcome =
  | 'critical_success'
  | 'decisive_success'
  | 'narrow_success'
  | 'success'
  | 'partial_success'
  | 'narrow_failure'
  | 'failure'
  | 'decisive_failure'
  | 'critical_failure'
  | 'quiet'
  | 'alert'
  | 'hostile';

export type RollRecord = {
  scene: number;
  type: RollType;
  stat?: StatName;
  roll: number;
  modifier?: number;
  total?: number;
  dc?: number;
  outcome: RollOutcome;
};

// ── Dice ──────────────────────────────────────────────────────────

export type DieType = 'd2' | 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

// ── Computation ────────────────────────────────────────────────────

export type ContestedRollResult = {
  type: 'contested_roll';
  stat: StatName;
  roll: number;
  modifier: number;
  total: number;
  margin: number;
  outcome: RollOutcome;
  npcId: string;
  npcModifier: number;
  dc?: number;
  dieType?: DieType;
  context?: Record<string, unknown>;
};

export type HazardSaveResult = {
  type: 'hazard_save';
  stat: StatName;
  roll: number;
  modifier: number;
  total: number;
  dc: number;
  outcome: RollOutcome;
  margin?: number;
  npcId?: string;
  npcModifier?: number;
  dieType?: DieType;
  context?: Record<string, unknown>;
};

export type EncounterRollResult = {
  type: 'encounter_roll';
  roll: number;
  stat?: StatName;
  modifier?: number;
  total?: number;
  dc?: number;
  outcome?: RollOutcome;
  margin?: number;
  npcId?: string;
  npcModifier?: number;
  dieType?: DieType;
  context?: Record<string, unknown>;
};

export type LevelupResult = {
  type: 'levelup_result';
  previousLevel: number;
  newLevel: number;
  hpGain: number;
  improvement: string;
  dieType?: DieType;
  context?: Record<string, unknown>;
};

export type ComputationResult = ContestedRollResult | HazardSaveResult | EncounterRollResult | LevelupResult;

// ── State History ──────────────────────────────────────────────────

export type StateHistoryEntry = {
  timestamp: string;
  command: string;
  path: string;
  oldValue: unknown;
  newValue: unknown;
};

// ── Module States ──────────────────────────────────────────────────

export type ShipState = {
  name: string;
  systems: Record<string, { integrity: number; status: string; conditions: string[] }>;
  powerAllocations: Record<string, number>;
  repairParts: number;
  scenesSinceRepair: number;
};

export type MapState = {
  currentZone: string;
  visitedZones: string[];
  revealedZones: string[];
  doorStates: Record<string, string>;
  supplies?: { rations: number; water: number };
};

export type CrewMutation = {
  id: string;
  name: string;
  pronouns: Pronouns;
  role: string;
  morale: number;
  stress: number;
  loyalty: number;
  status: NpcStatus;
  task?: string;
};

/** Placeholder — shape to be defined when story-architect module is implemented. */
type StoryThread = { id: string; [key: string]: unknown };

/** Placeholder — shape to be defined when arc-transition is implemented. */
type CharacterProgression = Record<string, unknown>;

export type StoryArchitectState = {
  threads: StoryThread[];
  foreshadowing: StoryThread[];
  consequences: StoryThread[];
  pacing: { act: number; actProgress: number; recentBeats: string[] };
};

export type CarryForward = {
  characterProgression: CharacterProgression;
  factionStandings: Record<string, number>;
  npcDispositions: StoryThread[];
  codexDiscoveries: string[];
  worldConsequences: string[];
};

export type ArcSummary = {
  arc: number;
  theme: string;
  conclusion: string;
};

// ── Pending Rolls (dice enforcement) ─────────────────────────────

export type PendingRoll = {
  action: number;
  type: 'contest' | 'hazard';
  stat: StatName;
  npc?: string;
  dc?: number;
  skill?: string;
};

// ── Master Game State ──────────────────────────────────────────────

export type GmState = {
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
  _schemaVersion?: string;
  _compactionCount?: number;
  _pendingRolls?: PendingRoll[];
};

// ── Command Types ──────────────────────────────────────────────────

export type CommandResult<T = unknown> = {
  ok: boolean;
  command: string;
  data?: T;
  error?: { message: string; corrective: string };
  state_snapshot?: Partial<GmState> | null;
  _compactionAlert?: { detected: boolean; message: string } | null;
};

