import { FORBIDDEN_KEYS } from './constants';

type StateShape =
  | { kind: 'leaf' }
  | { kind: 'object'; props: Record<string, StateShape> }
  | { kind: 'array'; item: StateShape }
  | { kind: 'record'; value: StateShape }
  | { kind: 'nullable'; inner: StateShape };

type UnwrappedStateShape = Exclude<StateShape, { kind: 'nullable' }>;

const leaf = (): StateShape => ({ kind: 'leaf' });
const object = (props: Record<string, StateShape>): StateShape => ({ kind: 'object', props });
const array = (item: StateShape): StateShape => ({ kind: 'array', item });
const record = (value: StateShape): StateShape => ({ kind: 'record', value });
const nullable = (inner: StateShape): StateShape => ({ kind: 'nullable', inner });

const statBlock = object({
  STR: leaf(),
  DEX: leaf(),
  CON: leaf(),
  INT: leaf(),
  WIS: leaf(),
  CHA: leaf(),
});

const inventoryItem = object({
  name: leaf(),
  type: leaf(),
  slots: leaf(),
  description: leaf(),
});

const character = object({
  name: leaf(),
  class: leaf(),
  hp: leaf(),
  maxHp: leaf(),
  ac: leaf(),
  level: leaf(),
  xp: leaf(),
  currency: leaf(),
  currencyName: leaf(),
  stats: statBlock,
  modifiers: statBlock,
  proficiencyBonus: leaf(),
  proficiencies: array(leaf()),
  abilities: array(leaf()),
  inventory: array(inventoryItem),
  conditions: array(leaf()),
  equipment: object({
    weapon: leaf(),
    armour: leaf(),
  }),
  poiMax: leaf(),
});

const npcMutation = object({
  id: leaf(),
  name: leaf(),
  pronouns: leaf(),
  role: leaf(),
  tier: leaf(),
  level: leaf(),
  stats: statBlock,
  modifiers: statBlock,
  hp: leaf(),
  maxHp: leaf(),
  ac: leaf(),
  soak: leaf(),
  damageDice: leaf(),
  status: leaf(),
  alive: leaf(),
  trust: leaf(),
  disposition: leaf(),
  dispositionSeed: leaf(),
  currentRoom: leaf(),
  killedInScene: leaf(),
  specialAbilities: array(leaf()),
});

const codexMutation = object({
  id: leaf(),
  title: leaf(),
  category: leaf(),
  state: leaf(),
  discoveredAt: leaf(),
  via: leaf(),
  secrets: array(leaf()),
  redactedReason: leaf(),
});

const timeState = object({
  period: leaf(),
  date: leaf(),
  elapsed: leaf(),
  hour: leaf(),
  playerKnowsDate: leaf(),
  playerKnowsTime: leaf(),
  calendarSystem: leaf(),
  deadline: nullable(object({
    label: leaf(),
    remainingScenes: leaf(),
  })),
});

const questObjective = object({
  id: leaf(),
  description: leaf(),
  completed: leaf(),
});

const quest = object({
  id: leaf(),
  title: leaf(),
  status: leaf(),
  objectives: array(questObjective),
  clues: array(leaf()),
});

const rollRecord = object({
  scene: leaf(),
  type: leaf(),
  stat: leaf(),
  roll: leaf(),
  modifier: leaf(),
  total: leaf(),
  dc: leaf(),
  action: leaf(),
  npcId: leaf(),
  skill: leaf(),
  outcome: leaf(),
});

const shipState = object({
  name: leaf(),
  systems: record(object({
    integrity: leaf(),
    status: leaf(),
    conditions: array(leaf()),
  })),
  powerAllocations: record(leaf()),
  repairParts: leaf(),
  scenesSinceRepair: leaf(),
});

const crewMutation = object({
  id: leaf(),
  name: leaf(),
  pronouns: leaf(),
  role: leaf(),
  morale: leaf(),
  stress: leaf(),
  loyalty: leaf(),
  status: leaf(),
  task: leaf(),
});

const mapState = object({
  currentZone: leaf(),
  visitedZones: array(leaf()),
  revealedZones: array(leaf()),
  doorStates: record(leaf()),
  supplies: nullable(object({
    rations: leaf(),
    water: leaf(),
  })),
});

const storyArchitectState = object({
  threads: array(leaf()),
  foreshadowing: array(leaf()),
  consequences: array(leaf()),
  pacing: object({
    act: leaf(),
    actProgress: leaf(),
    recentBeats: array(leaf()),
  }),
});

const carryForward = object({
  characterProgression: leaf(),
  factionStandings: record(leaf()),
  npcDispositions: array(leaf()),
  codexDiscoveries: array(leaf()),
  worldConsequences: array(leaf()),
});

const arcSummary = object({
  arc: leaf(),
  theme: leaf(),
  conclusion: leaf(),
});

const computationResult = object({
  type: leaf(),
  stat: leaf(),
  roll: leaf(),
  modifier: leaf(),
  total: leaf(),
  margin: leaf(),
  outcome: leaf(),
  npcId: leaf(),
  npcModifier: leaf(),
  dc: leaf(),
  dieType: leaf(),
  previousLevel: leaf(),
  newLevel: leaf(),
  hpGain: leaf(),
  improvement: leaf(),
  context: leaf(),
});

const stateHistoryEntry = object({
  timestamp: leaf(),
  command: leaf(),
  path: leaf(),
  oldValue: leaf(),
  newValue: leaf(),
});

export const GM_STATE_SHAPE: StateShape = object({
  _version: leaf(),
  scene: leaf(),
  currentRoom: leaf(),
  visitedRooms: array(leaf()),
  rollHistory: array(rollRecord),
  character: nullable(character),
  worldFlags: record(leaf()),
  openingLens: leaf(),
  prologueVariant: leaf(),
  prologueComplete: leaf(),
  characterOrigin: leaf(),
  seed: leaf(),
  theme: leaf(),
  visualStyle: leaf(),
  modulesActive: array(leaf()),
  rosterMutations: array(npcMutation),
  codexMutations: array(codexMutation),
  time: timeState,
  factions: record(leaf()),
  quests: array(quest),
  storyArchitect: nullable(storyArchitectState),
  shipState: nullable(shipState),
  crewMutations: array(crewMutation),
  mapState: nullable(mapState),
  systemResources: leaf(),
  navPlottedCourse: leaf(),
  arc: leaf(),
  arcType: leaf(),
  carryForward: nullable(carryForward),
  arcHistory: array(arcSummary),
  _lastComputation: nullable(computationResult),
  _stateHistory: array(stateHistoryEntry),
  _schemaVersion: leaf(),
  _compactionCount: leaf(),
  _turnCount: leaf(),
  _modulesRead: array(leaf()),
  _proseCraftEpoch: leaf(),
  _styleReadEpoch: leaf(),
  _levelupPending: leaf(),
  _pendingRolls: array(object({
    action: leaf(),
    type: leaf(),
    stat: leaf(),
    npc: leaf(),
    dc: leaf(),
    skill: leaf(),
  })),
});

type StripResult = {
  sanitized: unknown;
  strippedPaths: string[];
};

type PathValidationResult = {
  valid: boolean;
  error?: string;
};

function unwrap(shape: StateShape): UnwrappedStateShape {
  let current = shape;
  while (current.kind === 'nullable') {
    current = current.inner;
  }
  return current as UnwrappedStateShape;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function joinPath(base: string, segment: string): string {
  return base ? `${base}.${segment}` : segment;
}

function collectUnexpectedPaths(
  value: unknown,
  shape: StateShape,
  basePath: string,
  unexpected: string[],
): void {
  const current = unwrap(shape);
  if (current.kind === 'leaf') return;

  if (current.kind === 'array') {
    if (!Array.isArray(value)) return;
    for (let i = 0; i < value.length; i++) {
      collectUnexpectedPaths(value[i], current.item, joinPath(basePath, String(i)), unexpected);
    }
    return;
  }

  // Flag arrays where an object or record is expected — catches type mismatch
  // e.g. equipment sent as string[] instead of { weapon, armour }
  if (Array.isArray(value)) {
    unexpected.push(basePath);
    return;
  }

  if (!isRecord(value)) return;

  if (current.kind === 'record') {
    for (const [key, nested] of Object.entries(value)) {
      collectUnexpectedPaths(nested, current.value, joinPath(basePath, key), unexpected);
    }
    return;
  }
  if (current.kind !== 'object') return;

  for (const [key, nested] of Object.entries(value)) {
    const next = current.props[key];
    if (!next) {
      unexpected.push(joinPath(basePath, key));
      continue;
    }
    collectUnexpectedPaths(nested, next, joinPath(basePath, key), unexpected);
  }
}

function stripUnknownKeys(
  value: unknown,
  shape: StateShape,
  basePath: string,
  strippedPaths: string[],
): unknown {
  const current = unwrap(shape);
  if (current.kind === 'leaf') return value;

  if (current.kind === 'array') {
    if (!Array.isArray(value)) return value;
    return value.map((item, index) =>
      stripUnknownKeys(item, current.item, joinPath(basePath, String(index)), strippedPaths));
  }

  if (!isRecord(value)) return value;

  if (current.kind === 'record') {
    const next: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      next[key] = stripUnknownKeys(nested, current.value, joinPath(basePath, key), strippedPaths);
    }
    return next;
  }
  if (current.kind !== 'object') return value;

  const next: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    const childShape = current.props[key];
    if (!childShape) {
      strippedPaths.push(joinPath(basePath, key));
      continue;
    }
    next[key] = stripUnknownKeys(nested, childShape, joinPath(basePath, key), strippedPaths);
  }
  return next;
}

export function collectUnexpectedStatePaths(state: unknown): string[] {
  const unexpected: string[] = [];
  collectUnexpectedPaths(state, GM_STATE_SHAPE, '', unexpected);
  return unexpected;
}

export function stripUnknownStateKeys(state: unknown): StripResult {
  const strippedPaths: string[] = [];
  return {
    sanitized: stripUnknownKeys(state, GM_STATE_SHAPE, '', strippedPaths),
    strippedPaths,
  };
}

/** Produce a human-readable description of the expected shape at a dot-path. */
export function describeStateShape(path: string): string {
  let current: StateShape = GM_STATE_SHAPE;

  if (path) {
    const parts = path.split('.');
    for (const part of parts) {
      const inner = unwrap(current);
      if (inner.kind === 'leaf') return `Error: "${path}" is a leaf — no nested structure.`;
      if (inner.kind === 'array') {
        if (!/^\d+$/.test(part)) return `Error: "${part}" must be a numeric index in "${path}".`;
        current = inner.item;
        continue;
      }
      if (inner.kind === 'record') { current = inner.value; continue; }
      if (inner.kind === 'object') {
        const next = inner.props[part];
        if (!next) return `Error: Unknown key "${part}" in "${path}". Valid keys: ${Object.keys(inner.props).join(', ')}`;
        current = next;
        continue;
      }
      return `Error: Cannot navigate "${path}".`;
    }
  }

  return formatShape(unwrap(current), 0);
}

function formatShape(shape: UnwrappedStateShape, indent: number): string {
  const pad = '  '.repeat(indent);
  if (shape.kind === 'leaf') return 'value';
  if (shape.kind === 'array') {
    const inner = unwrap(shape.item);
    if (inner.kind === 'leaf') return 'value[]';
    return `[\n${formatShape(inner, indent + 1)}\n${pad}]`;
  }
  if (shape.kind === 'record') {
    const inner = unwrap(shape.value);
    if (inner.kind === 'leaf') return 'Record<string, value>';
    return `Record<string, {\n${formatShape(inner, indent + 1)}\n${pad}}>`;
  }
  if (shape.kind === 'object') {
    const lines = Object.entries(shape.props).map(([key, child]) => {
      const inner = unwrap(child);
      const isNullable = child.kind === 'nullable';
      const desc = formatShape(inner, indent + 1);
      const opt = isNullable ? '?' : '';
      if (desc.includes('\n')) {
        return `${pad}  ${key}${opt}: ${desc}`;
      }
      return `${pad}  ${key}${opt}: ${desc}`;
    });
    return `{\n${lines.join('\n')}\n${pad}}`;
  }
  return 'unknown';
}

export function validateStatePath(path: string): PathValidationResult {
  const trimmed = path.trim();
  if (!trimmed) {
    return { valid: false, error: 'Path must not be empty.' };
  }

  const parts = trimmed.split('.');
  let current: StateShape = GM_STATE_SHAPE;
  let consumed = '';

  for (const part of parts) {
    if (!part) {
      return { valid: false, error: `Path "${path}" contains an empty segment.` };
    }
    if (FORBIDDEN_KEYS.has(part)) {
      return { valid: false, error: `Forbidden path segment: "${part}"` };
    }

    current = unwrap(current);

    if (current.kind === 'leaf') {
      return {
        valid: false,
        error: `Path "${path}" extends beyond "${consumed}".`,
      };
    }

    if (current.kind === 'array') {
      if (!/^\d+$/.test(part)) {
        return {
          valid: false,
          error: `Path "${path}" must use a numeric index after "${consumed}".`,
        };
      }
      current = current.item;
      consumed = joinPath(consumed, part);
      continue;
    }

    if (current.kind === 'record') {
      current = current.value;
      consumed = joinPath(consumed, part);
      continue;
    }

    const next = current.props[part];
    if (!next) {
      const scope = consumed || '<root>';
      return {
        valid: false,
        error: `Unknown path segment "${part}" under "${scope}".`,
      };
    }

    current = next;
    consumed = joinPath(consumed, part);
  }

  return { valid: true };
}
