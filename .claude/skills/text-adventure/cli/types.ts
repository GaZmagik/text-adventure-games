// tag CLI — Master Type Definitions
// Mirrors save-codex.md § Full gmState Contract

// ── Primitive Types ────────────────────────────────────────────────

/**
 * Standard six-stat block for characters and NPCs.
 * Follows classic D20 conventions (STR, DEX, CON, INT, WIS, CHA).
 */
export type StatBlock = {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
};

/** 
 * Valid stat names from the StatBlock. 
 */
export type StatName = keyof StatBlock;

/**
 * Supported pronouns for characters and NPCs.
 * @remarks
 * See gotcha-npc-pronouns-and-stats-were-not-persisted-in-saves.md for persistence history.
 */
export type Pronouns = 'she/her' | 'he/him' | 'they/them' | 'it/its';

/** 
 * NPC disposition levels affecting dialogue and interaction options. 
 */
export type DispositionState = 'hostile' | 'suspicious' | 'neutral' | 'friendly' | 'allied' | 'bonded';

/** 
 * NPC power tier, affecting HP scaling and ability complexity. 
 */
export type BestiaryTier = 'minion' | 'rival' | 'nemesis';

/** 
 * NPC status in the narrative. 
 */
export type NpcStatus = 'active' | 'injured' | 'incapacitated' | 'missing' | 'defected' | 'dead';

/** 
 * Narrative lens for the opening scene.
 */
export type OpeningLens = 'rian' | 'suri' | 'mara';

/** 
 * Whether a character was chosen from pre-gens or custom-built. 
 */
export type CharacterOrigin = 'pregen' | 'custom';

// ── Pre-Generated Character ──────────────────────────────────────

/**
 * Definition of a pre-generated character from lore-codex.
 * Used during initial game setup and character selection.
 */
export type PreGeneratedCharacter = {
  name: string;
  class: string;
  pronouns: string;
  hook: string;
  background?: string;
  stats: StatBlock;
  hp: number;
  ac: number;
  proficiencies: string[];
  /** Starting equipment list. */
  startingInventory?: Array<{ name: string; type?: string; effect?: string; description?: string }>;
  abilities?: string[];
  startingCurrency?: number;
  openingLens?: string;
  prologueVariant?: string;
};

// ── Character ──────────────────────────────────────────────────────

/**
 * The player's active character state.
 * @remarks
 * In v1.1.0+, level and XP carry forward across campaign arcs.
 */
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
  /** Pre-calculated modifiers derived from stats. */
  modifiers: StatBlock;
  proficiencyBonus: number;
  proficiencies: string[];
  abilities: string[];
  inventory: InventoryItem[];
  conditions: string[];
  /** Equipped gear affecting mechanical bonuses. */
  equipment: { weapon: string; armour: string };
  /** Maximum Points of Interest reachable in a single scene (optional limit). */
  poiMax?: number;
};

/** 
 * Individual item in character inventory. 
 */
export type InventoryItem = {
  name: string;
  type: string;
  slots: number;
  description?: string;
};

// ── NPCs ───────────────────────────────────────────────────────────

/**
 * Mutable state for an NPC in the current campaign roster.
 * @remarks
 * Roster mutations are tracked separately from base bestiary specs to preserve persistent status (injuries, trust, death).
 */
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
  /** Redundant boolean for fast filtering of deceased NPCs. */
  alive: boolean;
  /** Trust score (0-100) affecting interaction success. */
  trust: number;
  disposition: DispositionState;
  /** Seed used for consistent disposition checks across scenes. */
  dispositionSeed: number;
  currentRoom?: string;
  /** Tracking for epilogue/consequence generation. */
  killedInScene?: number;
  specialAbilities?: string[];
};

// ── Time ───────────────────────────────────────────────────────────

/**
 * Global campaign clock and calendar state.
 */
export type TimeState = {
  period: string;
  date: string;
  /** Total elapsed scenes in the campaign. */
  elapsed: number;
  hour: number;
  playerKnowsDate: boolean;
  playerKnowsTime: boolean;
  calendarSystem: string;
  /** High-stakes timer that triggers scene-specific failure or event transitions. */
  deadline: { label: string; remainingScenes: number } | null;
};

// ── Quests ──────────────────────────────────────────────────────────

/**
 * Tracking for main and side objectives.
 */
export type Quest = {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'failed';
  objectives: QuestObjective[];
  clues: string[];
};

/** 
 * Individual objective within a quest chain. 
 */
export type QuestObjective = {
  id: string;
  description: string;
  completed: boolean;
};

// ── Codex ──────────────────────────────────────────────────────────

/**
 * Discoverable lore entries tracked across scenes.
 */
export type CodexMutation = {
  id: string;
  title?: string;
  category?: string;
  state: 'locked' | 'partial' | 'discovered' | 'redacted';
  discoveredAt?: number;
  via?: string;
  secrets?: string[];
  redactedReason?: string;
};

// ── Rolls ──────────────────────────────────────────────────────────

/** 
 * Types of mechanical dice checks supported by the engine. 
 */
export type RollType = 'contested_roll' | 'hazard_save' | 'encounter_roll' | 'levelup_result';

/** 
 * Categorical outcomes for dice rolls.
 */
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

/** 
 * Permanent record of a dice roll.
 */
export type RollRecord = {
  scene: number;
  type: RollType;
  stat?: StatName;
  roll: number;
  modifier?: number;
  total?: number;
  dc?: number;
  action?: number;
  npcId?: string;
  skill?: string;
  outcome: RollOutcome;
};

// ── Dice ──────────────────────────────────────────────────────────

/** 
 * Standard polyhedral die types supported by the 3D dice widget. 
 */
export type DieType = 'd2' | 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

// ── Computation ────────────────────────────────────────────────────

/** 
 * Result of a Player vs NPC stat check. 
 */
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

/** 
 * Result of a Player vs Static DC check. 
 */
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

/** 
 * Result of a non-standard encounter check. 
 */
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

/** 
 * Result of a level-up procedure.
 */
export type LevelupResult = {
  type: 'levelup_result';
  previousLevel: number;
  newLevel: number;
  hpGain: number;
  improvement: string;
  dieType?: DieType;
  context?: Record<string, unknown>;
};

/** 
 * Unified type for any mechanical check. 
 */
export type ComputationResult = ContestedRollResult | HazardSaveResult | EncounterRollResult | LevelupResult;

// ── State History ──────────────────────────────────────────────────

/**
 * Audit log of state changes for debugging and rollback.
 */
export type StateHistoryEntry = {
  timestamp: string;
  command: string;
  path: string;
  oldValue: unknown;
  newValue: unknown;
};

// ── Module States ──────────────────────────────────────────────────

/** 
 * Persistent state for ship-based campaign modules. 
 */
export type ShipState = {
  name: string;
  systems: Record<string, { integrity: number; status: string; conditions: string[] }>;
  powerAllocations: Record<string, number>;
  repairParts: number;
  scenesSinceRepair: number;
};

/** 
 * Persistent state for hex-crawl or map-based exploration modules. 
 */
export type MapState = {
  currentZone: string;
  visitedZones: string[];
  revealedZones: string[];
  doorStates: Record<string, string>;
  supplies?: { rations: number; water: number } | null;
};

/** 
 * Mutation state for a ship's crew member. 
 */
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

/**
 * State for the Story Architect module, tracking pacing and narrative beats.
 */
export type StoryArchitectState = {
  threads: StoryThread[];
  foreshadowing: StoryThread[];
  consequences: StoryThread[];
  pacing: { act: number; actProgress: number; recentBeats: string[] };
};

/**
 * Data bundle for carrying state between campaign arcs.
 * @remarks
 * See decision-campaign-arcs-use-full-levelxp-carry-forward-with-selective-reset.md.
 */
export type CarryForward = {
  characterProgression: CharacterProgression;
  factionStandings: Record<string, number>;
  npcDispositions: StoryThread[];
  codexDiscoveries: string[];
  worldConsequences: string[];
};

/** 
 * Summary of a completed campaign arc. 
 */
export type ArcSummary = {
  arc: number;
  theme: string;
  conclusion: string;
};

// ── Pending Rolls (dice enforcement) ─────────────────────────────

/**
 * A mechanical check declared by the GM but not yet "rolled" by the player.
 * Used by the CLI to enforce dice widget interactivity.
 */
export type PendingRoll = {
  action: number;
  type: 'contest' | 'hazard';
  stat: StatName;
  npc?: string;
  dc?: number;
  skill?: string;
};

// ── Master Game State ──────────────────────────────────────────────

/**
 * The root state object for the Text Adventure engine.
 * Serialized to state.json in the campaign directory.
 */
export type GmState = {
  _version: number;
  scene: number;
  currentRoom: string;
  visitedRooms: string[];
  rollHistory: RollRecord[];
  character: Character | null;
  worldFlags: Record<string, boolean | number | string>;
  openingLens?: OpeningLens;
  prologueVariant?: string;
  prologueComplete?: boolean;
  characterOrigin?: CharacterOrigin;
  seed?: string;
  theme?: string;
  visualStyle?: string;
  /** List of modules currently active in the campaign context. */
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
  /** Most recent computation result, used to hydrate subsequent widgets. */
  _lastComputation?: ComputationResult;
  _stateHistory: StateHistoryEntry[];
  _schemaVersion?: string;
  /** 
   * Count of transcripts processed since last compaction.
   * @remarks
   * See gotcha-compaction-preflight-must-not-diverge-from-sync-state.md.
   */
  _compactionCount?: number;
  /** Active rolls that must be completed before the next scene can be rendered. */
  _pendingRolls?: PendingRoll[];
  /** 
   * Runtime list of modules actually loaded into the GM context. 
   * Reset on compaction. 
   */
  _modulesRead?: string[];
  /** Tracking for prose validation rules freshness. */
  _proseCraftEpoch?: number;
  /** Tracking for style-reference CSS freshness. */
  _styleReadEpoch?: number;
  _turnCount?: number;
  _levelupPending?: boolean;
  _computedLevel?: number;
  /** The most recently authored scene body, used for prose verification. */
  authoredBody?: string;
  outputStyle?: string;
  pacingProfile?: 'fast' | 'normal' | 'slow';
  authoredSourceId?: string;
  /** Source lore content used for context injection. */
  _loreSource?: string;
  /** Map of lore files and their relative importance for context pruning. */
  _authoredLoreReads?: Record<string, number>;
  _lorePregen?: PreGeneratedCharacter[];
  _loreDefaults?: Record<string, string>;
};

// ── Prose Gate ────────────────────────────────────────────────────

/**
 * Verification state for a single scene file.
 * Stored in .tag/gates/ to enforce prose and mechanical standards.
 */
export type GateFile = {
  scenePath: string;
  sceneHash: string;
  mode: string;
  timestamp: number;
  deterministicErrors: string[];
  deterministicWarnings: string[];
  warningsAcknowledged: boolean;
};

// ── Command Types ──────────────────────────────────────────────────

/**
 * Standard response format for all CLI commands.
 * Consumed by the GM to update local state and display results.
 */
export type CommandResult<T = unknown> = {
  ok: boolean;
  command: string;
  /** Command-specific payload. */
  data?: T;
  /** Human-readable error and recovery instructions. */
  error?: { message: string; corrective: string };
  /** Incremental state update to be merged into the master GmState. */
  state_snapshot?: Partial<GmState> | null;
  /** Alert triggered if transcript compaction has evicted required modules. */
  _compactionAlert?: { detected: boolean; recovered: boolean; message: string; modulesRequired?: string[] } | null;
};
