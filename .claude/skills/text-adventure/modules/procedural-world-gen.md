# Procedural World Generation — Seed Engine

> Module for text-adventure orchestrator. Loaded for generated (not hand-authored) scenarios.

This skill defines the complete system for generating deterministic game worlds from a seed string.
Every dungeon layout, NPC personality, faction relationship, loot drop, and encounter is derived
from a single seeded pseudo-random number generator (PRNG). The same seed produces the same world
every time — sessions are shareable, forkable, and replayable.

World generation is a **pre-pass** that runs before the first scene renders. Its output — a
structured `worldData` object — is consumed by the GM layer and the NPC layer. The generator never narrates. It builds. The GM narrates from what it built.

Loaded by the text-adventure orchestrator (SKILL.md). Works alongside: ai-npc, lore-codex, star-chart modules.

---

## § CLI Commands

| Action                     | Command                                                                                | Tool              |
| -------------------------- | -------------------------------------------------------------------------------------- | ----------------- | ------------- | ---------------- | ----------- | --------------------------- | ----------------- |
| Generate world preview     | `tag world generate --seed <seed> [--theme <theme>]`                                   | Run via Bash tool |
| Apply generated world      | `tag world generate --seed <seed> [--theme <theme>] --apply`                           | Run via Bash tool |
| Move on map                | `tag map enter <zone-id>`                                                              | Run via Bash tool |
| Reveal/discover/unlock map | `tag map reveal <zone-id>` / `tag map discover <from> <to>` / `tag map unlock <route>` | Run via Bash tool |
| Inspect map zone           | `tag map inspect <zone-id>`                                                            | Run via Bash tool |
| Plan known route           | `tag map route <from> <to>`                                                            | Run via Bash tool |
| Render map                 | `tag render map --style <style>`                                                       | Run via Bash tool |
| Render world panels        | `tag render world-preview                                                              | route-planner     | faction-board | relationship-web | world-atlas | clue-board --style <style>` | Run via Bash tool |
| Set world state            | `tag state set mapState.<path> <value>`                                                | Run via Bash tool |

> **All widget output must be produced by running the `tag` CLI via Bash tool.** Do not hand-code HTML, CSS, or JS for map or seed widgets — use the commands above.

---

## Architecture Overview

```
Player enters seed string (or one is generated)
        ↓
Seed is hashed → 32-bit integer → PRNG initialised
        ↓
World generation pipeline runs (order is fixed — do not reorder):
  1. Geography     — region map, room graph, exit connections
  2. Atmosphere    — biome, lighting, ambient hazards per room
  3. Factions      — 2–4 factions, relationship matrix, territory control
  4. NPC roster    — named characters placed into rooms, linked to factions
  5. Loot tables   — item pools seeded per room, rarity weighted
  6. Encounter table — enemy types, spawn weights, escalation tiers
  7. Quest hooks   — 1 main hook + 2 side hooks derived from faction tensions
        ↓
worldData object returned — JSON-serialisable, passed into gmState
        ↓
GM renders first scene using worldData.rooms[worldData.startRoom]
```

The pipeline is idempotent. Call `generateWorld(seed)` any number of times with the same seed —
you always get the same `worldData`. This makes save states trivial: store the seed plus the
player's progress flags. Regenerate the world on resume; reapply the flags.

---

## The PRNG Engine

All randomness in the system flows through a single seeded PRNG. This guarantees determinism.

<!-- CLI implementation detail — do not hand-code -->

```js
// Mulberry32 — fast, high-quality 32-bit seeded PRNG
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hash a string seed into a 32-bit integer
function hashSeed(str) {
  let h = 0xdeadbeef;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x9e3779b9);
    h ^= h >>> 16;
  }
  return h >>> 0;
}

// Initialise from a string seed
function createPRNG(seedStr) {
  return mulberry32(hashSeed(seedStr));
}
```

**PRNG utility functions** — build these on top of the raw PRNG:

<!-- CLI implementation detail — do not hand-code -->

```js
// Integer in range [min, max] inclusive
function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// Float in range [min, max)
function randFloat(rng, min, max) {
  return rng() * (max - min) + min;
}

// Pick one item from an array
function randPick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

// Pick N unique items from an array (no repeats)
function randPickN(rng, arr, n) {
  const copy = [...arr];
  const result = [];
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = Math.floor(rng() * (copy.length - i));
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

// Weighted pick — weights array must match items array length
function randWeighted(rng, items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Shuffle an array in place (Fisher-Yates)
function randShuffle(rng, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Boolean with probability p (0–1)
function randChance(rng, p) {
  return rng() < p;
}
```

**Critical rule:** The PRNG instance is consumed sequentially. Every call to `rng()` advances the
state. The pipeline calls must always happen in the same order — geography first, encounters last —
or the world will differ between runs even with the same seed. Never call `rng()` outside the
pipeline without accounting for it.

### Arc-Based Seed Derivation

When generating a world for arc 2+, derive a new seed from the original to ensure
deterministic but distinct world generation per arc:

<!-- CLI implementation detail — do not hand-code -->

```js
function deriveArcSeed(originalSeed, arcNumber) {
  if (arcNumber <= 1) return originalSeed;
  return originalSeed + '_arc' + arcNumber;
}

// Usage:
// Arc 1: createPRNG('pale-threshold-7')        → original world
// Arc 2: createPRNG('pale-threshold-7_arc2')    → same seed family, different world
// Arc 3: createPRNG('pale-threshold-7_arc3')    → same seed family, different world
```

The derived seed produces a world in the same "family" as the original — similar
structure, related faction names, recognisable geography — but with different room
layouts, NPC placements, and encounter distributions.

---

## The Seed Format

Seeds are human-readable strings. They can be:

- **Random words** — `"iron-cascade-7"`, `"pale-threshold"`, `"dead-frequency-echo"`
- **Coordinates** — `"sector-7G-meridian"`, `"kerata-9-dig-site-3"`
- **Phrases** — `"the-last-signal"`, `"what-the-manifest-hides"`
- **Numeric** — `"00419"`, `"1138"` (padded to avoid short-string hash collisions)

**Auto-generation** when no seed is given:

<!-- CLI implementation detail — do not hand-code -->

```js
const ADJECTIVES = [
  'iron',
  'pale',
  'dead',
  'hollow',
  'fractured',
  'silent',
  'burning',
  'veiled',
  'amber',
  'sunken',
  'lost',
  'broken',
  'final',
  'distant',
  'cold',
  'ashen',
];
const NOUNS = [
  'threshold',
  'cascade',
  'frequency',
  'meridian',
  'signal',
  'compact',
  'covenant',
  'relay',
  'archive',
  'sector',
  'vault',
  'margin',
  'descent',
];

function generateSeed(rng) {
  const adj = randPick(rng, ADJECTIVES);
  const noun = randPick(rng, NOUNS);
  const num = randInt(rng, 1, 99);
  return `${adj}-${noun}-${num}`;
}
```

Display the seed prominently in the first scene render. The player must be able to copy it to
replay or share the run. Store it in `gmState.seed`.

---

## Stage 1 — Geography

Generates the room graph: nodes (rooms) and edges (connections/exits between them).

### Room graph generation

<!-- CLI implementation detail — do not hand-code -->

```js
function generateGeography(rng, config = {}) {
  const {
    roomCount = randInt(rng, 8, 14),
    theme = 'generic', // drives room name/desc tables
    linearBias = randFloat(rng, 0.3, 0.7), // 0 = fully branching, 1 = fully linear
  } = config;

  const rooms = {};
  const ids = Array.from({ length: roomCount }, (_, i) => `room_${i}`);

  // Assign room types along a spine + branches
  const spineLength = Math.ceil(roomCount * linearBias);
  const spine = ids.slice(0, spineLength);
  const branches = ids.slice(spineLength);

  ids.forEach(id => {
    rooms[id] = {
      id,
      type: null, // set in atmosphere stage
      connections: {}, // { direction: roomId }
      npcs: [], // populated in NPC stage
      loot: [], // populated in loot stage
      encounter: null, // populated in encounter stage
      visited: false,
      revealed: false,
    };
  });

  // Connect spine rooms in sequence
  const DIRECTIONS = ['north', 'south', 'east', 'west'];
  const OPPOSITES = { north: 'south', south: 'north', east: 'west', west: 'east' };

  for (let i = 0; i < spine.length - 1; i++) {
    const dir = i % 2 === 0 ? 'north' : 'east';
    const opp = OPPOSITES[dir];
    rooms[spine[i]].connections[dir] = spine[i + 1];
    rooms[spine[i + 1]].connections[opp] = spine[i];
  }

  // Attach branch rooms to random spine rooms
  branches.forEach(branchId => {
    const parentId = randPick(rng, spine);
    const availableDirs = DIRECTIONS.filter(d => !rooms[parentId].connections[d]);
    if (availableDirs.length === 0) return;
    const dir = randPick(rng, availableDirs);
    rooms[parentId].connections[dir] = branchId;
    rooms[branchId].connections[OPPOSITES[dir]] = parentId;
  });

  // Add 1–2 cross-connections for loops (prevents linear-only maps)
  const extraLinks = randInt(rng, 1, 2);
  for (let i = 0; i < extraLinks; i++) {
    const a = randPick(rng, ids);
    const b = randPick(
      rng,
      ids.filter(id => id !== a),
    );
    const availA = DIRECTIONS.filter(d => !rooms[a].connections[d]);
    const availB = DIRECTIONS.filter(d => !rooms[b].connections[d]);
    if (availA.length && availB.length) {
      const dir = randPick(rng, availA);
      const opp = OPPOSITES[dir];
      if (!rooms[b].connections[opp]) {
        rooms[a].connections[dir] = b;
        rooms[b].connections[opp] = a;
      }
    }
  }

  return {
    rooms,
    startRoom: spine[0],
    bossRoom: spine[spine.length - 1],
    spine,
    branches,
  };
}
```

### Room type assignment (atmosphere stage feeds from this)

<!-- CLI implementation detail — do not hand-code -->

```js
const ROOM_TYPES = {
  // sci-fi / space theme
  space: [
    'airlock',
    'corridor',
    'bridge',
    'engineering',
    'medbay',
    'cargo_hold',
    'cryo_bay',
    'reactor_core',
    'observation_deck',
    'comms_array',
    'storage_vault',
    'lab',
    'armory',
    'quarters',
    'ventilation_shaft',
  ],
  // fantasy / dungeon theme
  dungeon: [
    'entrance_hall',
    'guard_post',
    'barracks',
    'throne_room',
    'dungeon_cell',
    'treasury',
    'ritual_chamber',
    'library',
    'armoury',
    'kitchen',
    'chapel',
    'crypt',
    'passage',
    'collapsed_tunnel',
    'hidden_alcove',
  ],
  // horror / investigation theme
  horror: [
    'foyer',
    'study',
    'basement',
    'attic',
    'servants_quarters',
    'ballroom',
    'kitchen',
    'cellar',
    'hidden_room',
    'rooftop',
    'greenhouse',
    'chapel',
    'wine_cellar',
    'observatory',
    'locked_room',
  ],
};

function assignRoomTypes(rng, rooms, theme) {
  const typePool = [...(ROOM_TYPES[theme] || ROOM_TYPES.space)];
  randShuffle(rng, typePool);
  const ids = Object.keys(rooms);
  ids.forEach((id, i) => {
    rooms[id].type = typePool[i % typePool.length];
  });
  // Boss room always gets a significant type
  const bossTypes = { space: 'reactor_core', dungeon: 'throne_room', horror: 'hidden_room' };
  // (boss room id passed in from geography output, set externally)
}
```

---

## Stage 2 — Atmosphere

Each room receives a descriptor bundle: lighting, smell, temperature, ambient sound, and a hazard
flag. These feed directly into scene widget prose generation — the GM pulls from them rather than
inventing from scratch.

<!-- CLI implementation detail — do not hand-code -->

```js
const ATMOSPHERE_TABLES = {
  lighting: {
    space: ['emergency red', 'flickering fluorescent', 'pitch black', 'cold blue', 'strobing'],
    dungeon: ['torchlit', 'moonlit through cracks', 'pitch black', 'dim lantern', 'bone-white crystal glow'],
    horror: [
      'single bare bulb',
      'moonlight through broken windows',
      'complete darkness',
      'candlelight',
      'industrial fluorescent',
    ],
  },
  smell: {
    space: ['ozone', 'burnt circuitry', 'recycled air', 'iron and blood', 'nothing — vacuum-sealed'],
    dungeon: ['damp stone', 'torch smoke', 'rot', 'incense', 'animal musk'],
    horror: ['mildew', 'old paper', 'copper', 'something sweet and wrong', 'stale air'],
  },
  temperature: {
    space: ['freezing', 'uncomfortably cold', 'air-conditioned sterile', 'warm from machinery', 'scalding near vents'],
    dungeon: ['damp cold', 'cave-cool', 'warm from torches', 'furnace-hot', 'icy draught from below'],
    horror: [
      'cold despite closed windows',
      'stuffy and stale',
      'warm and wrong',
      'inexplicably freezing',
      'normal — which feels wrong',
    ],
  },
  sound: {
    space: ['distant hull groaning', 'ventilation hum', 'complete silence', 'electrical crackling', 'distant alarm'],
    dungeon: [
      'dripping water',
      'wind through cracks',
      'distant chanting',
      'silence so deep it presses',
      'something moving in the walls',
    ],
    horror: ['house settling', 'distant music', 'something scratching', 'your own heartbeat', 'rain on glass'],
  },
  hazard: {
    space: [null, null, null, 'vacuum_breach_risk', 'radiation_leak', 'electrical_surge', 'fire_suppression_active'],
    dungeon: [null, null, null, 'pit_trap', 'tripwire', 'collapsing_ceiling', 'poison_gas'],
    horror: [null, null, null, 'unstable_floor', 'broken_glass', 'gas_leak', 'structural_collapse'],
  },
};

function generateAtmosphere(rng, rooms, theme) {
  const tables = ATMOSPHERE_TABLES;
  const t = theme in tables.lighting ? theme : 'space';

  Object.values(rooms).forEach(room => {
    room.atmosphere = {
      lighting: randPick(rng, tables.lighting[t]),
      smell: randPick(rng, tables.smell[t]),
      temperature: randPick(rng, tables.temperature[t]),
      sound: randPick(rng, tables.sound[t]),
      hazard: randPick(rng, tables.hazard[t]),
    };
  });
}
```

**GM usage:** When writing scene prose, pull two or three atmosphere properties, never all five.
The rule is: one visual, one non-visual, one optional hazard hint. Over-describing atmosphere
front-loads the scene and leaves nothing to discover.

---

## Stage 3 — Factions

Generates 2–4 competing factions with names, ideologies, territory, and a relationship matrix.
Faction tensions are the engine of quest hooks and NPC agendas.

<!-- CLI implementation detail — do not hand-code -->

```js
const FACTION_TEMPLATES = {
  space: [
    { id: 'corp', name: 'Meridian Corp', ideology: 'profit above survival', colour: 'blue' },
    { id: 'crew', name: 'Surviving Crew', ideology: 'get everyone home alive', colour: 'teal' },
    { id: 'infected', name: 'The Changed', ideology: 'spread and become', colour: 'coral' },
    { id: 'rogue_ai', name: 'VIGIL System', ideology: 'preserve the ship at all cost', colour: 'purple' },
  ],
  dungeon: [
    { id: 'king', name: "King's Guard", ideology: 'order through force', colour: 'blue' },
    { id: 'thieves', name: 'Broken Coin Guild', ideology: 'profit through shadow', colour: 'amber' },
    { id: 'cult', name: 'The Hollow Circle', ideology: 'the old gods demand return', colour: 'purple' },
    { id: 'refugees', name: 'Displaced Villagers', ideology: 'survive one more day', colour: 'teal' },
  ],
  horror: [
    { id: 'family', name: 'The Ashwood Family', ideology: 'the house must be preserved', colour: 'purple' },
    { id: 'cult', name: 'The Congregation', ideology: 'the ritual must complete', colour: 'coral' },
    { id: 'police', name: 'Harrow County Sheriff', ideology: 'contain the situation', colour: 'blue' },
    { id: 'survivors', name: 'Other Victims', ideology: 'escape before morning', colour: 'teal' },
  ],
};

// Relationship states between faction pairs
const RELATIONS = ['allied', 'tense', 'neutral', 'hostile', 'at_war'];
const RELATION_WEIGHTS = [1, 2, 3, 2, 1]; // weighted toward neutral and tense

function generateFactions(rng, theme, roomCount) {
  const templates = FACTION_TEMPLATES[theme] || FACTION_TEMPLATES.space;
  const factionCount = randInt(rng, 2, Math.min(4, templates.length));
  const factions = randPickN(rng, templates, factionCount).map(f => ({ ...f }));

  // Build relationship matrix (upper triangle, then mirror)
  const relations = {};
  for (let i = 0; i < factions.length; i++) {
    for (let j = i + 1; j < factions.length; j++) {
      const key = `${factions[i].id}_${factions[j].id}`;
      relations[key] = randWeighted(rng, RELATIONS, RELATION_WEIGHTS);
    }
  }

  // Assign territory — each faction controls 1–3 rooms
  const allRoomIds = []; // passed in from geography output
  factions.forEach(f => {
    f.territory = [];
    f.strength = randInt(rng, 1, 5); // 1 = nearly wiped out, 5 = dominant
    f.knows_about_player = false;
  });

  return { factions, relations };
}

// Helper: get relation between two factions
function getFactionRelation(relations, idA, idB) {
  return relations[`${idA}_${idB}`] || relations[`${idB}_${idA}`] || 'neutral';
}
```

**Faction integration with ai-npc:**
Every named NPC belongs to a faction. Their `agenda` array in the NPC definition object must
reference their faction's ideology. Their `disposition.triggers` must include the player
mentioning rival factions. Faction relations directly inform NPC trust deltas:

- Player allied with NPC's faction: +10 trust on introduction
- Player allied with NPC's enemy: −15 trust on introduction
- Player neutral: no modifier

---

## Stage 4 — NPC Roster

Generates named NPCs placed into specific rooms, each linked to a faction and given a seed-derived
personality profile. These profiles seed the ai-npc NPC definition objects.

### Name generation

<!-- CLI implementation detail — do not hand-code -->

```js
const NAME_PARTS = {
  space: {
    first: ['Maren', 'Voss', 'Dael', 'Seren', 'Kira', 'Oberon', 'Talia', 'Finn', 'Rook', 'Cass', 'Zev', 'Ilya'],
    last: ['Voss', 'Crane', 'Holt', 'Maret', 'Sorrel', 'Wren', 'Kade', 'Thrace', 'Sable', 'Oryn', 'Vane'],
  },
  dungeon: {
    first: ['Aldric', 'Senna', 'Corvyn', 'Miriel', 'Dax', 'Elara', 'Brynn', 'Oswin', 'Lira', 'Haddan', 'Tove'],
    last: ['Ashwood', 'Ironvale', 'Coldmere', 'Dunmore', 'Stonehall', 'Brackwater', 'Greyfen', 'Whitlock'],
  },
  horror: {
    first: ['Edith', 'Harold', 'Frances', 'Silas', 'Mabel', 'Eugene', 'Vera', 'Clarence', 'Dolores', 'Roy'],
    last: ['Ashwood', 'Morrow', 'Crane', 'Hollow', 'Wickes', 'Grubb', 'Pallister', 'Fenwick', 'Dread'],
  },
};

function generateName(rng, theme) {
  const parts = NAME_PARTS[theme] || NAME_PARTS.space;
  return `${randPick(rng, parts.first)} ${randPick(rng, parts.last)}`;
}
```

### Personality generation

<!-- CLI implementation detail — do not hand-code -->

```js
const PERSONALITY_TRAITS = [
  'paranoid',
  'meticulous',
  'reckless',
  'pragmatic',
  'idealistic',
  'exhausted',
  'calculating',
  'haunted',
  'loyal',
  'cynical',
  'protective',
  'secretive',
  'desperate',
  'ambitious',
  'resigned',
];
const SPEECH_PATTERNS = [
  'clipped and precise',
  'evasive and self-interrupting',
  'warm but guarded',
  'blunt to the point of rudeness',
  'overly formal',
  'rambling under stress',
  'uses technical jargon without explaining it',
  'speaks in questions',
  'long pauses before answering',
  'breathlessly fast',
];
const WANTS = [
  'to get out alive',
  'to protect someone specific',
  'to be told it was not their fault',
  'to finish what they started',
  'to find out the truth',
  'to be left alone',
  'to make someone pay',
  'to atone for a past decision',
  'to keep their secret buried',
  'to find meaning in the chaos',
];

function generateNPCProfile(rng, theme, faction) {
  const name = generateName(rng, theme);
  const trait1 = randPick(rng, PERSONALITY_TRAITS);
  let trait2 = randPick(rng, PERSONALITY_TRAITS);
  while (trait2 === trait1) trait2 = randPick(rng, PERSONALITY_TRAITS);

  // Pronouns — seeded so they are deterministic on regeneration.
  // Distribution: ~45% she/her, ~45% he/him, ~10% they/them.
  const pronouns = randWeighted(rng, ['she/her', 'he/him', 'they/them'], [9, 9, 2]);

  // Stats — seeded so contested rolls are consistent across sessions.
  // NPCs get 8–16 per attribute (broader than player range to allow
  // notably strong or weak NPCs). Level scales with faction influence.
  const stats = {
    STR: randInt(rng, 8, 16),
    DEX: randInt(rng, 8, 16),
    CON: randInt(rng, 8, 16),
    INT: randInt(rng, 8, 16),
    WIS: randInt(rng, 8, 16),
    CHA: randInt(rng, 8, 16),
  };
  const level = randInt(rng, 1, 6);

  return {
    name,
    pronouns,
    faction: faction.id,
    factionName: faction.name,
    trait: `${trait1}, ${trait2}`,
    speech: randPick(rng, SPEECH_PATTERNS),
    wants: randPick(rng, WANTS),
    stats,
    level,
    initialTrust: randInt(rng, 30, 60),
    initialDisposition: randWeighted(rng, ['hostile', 'guarded', 'neutral', 'friendly'], [1, 3, 3, 1]),
    hasSecret: randChance(rng, 0.6),
    secretCategory: randPick(rng, [
      'witnessed something they should not have',
      'is responsible for an early mistake that shaped events',
      'is not who they claim to be',
      'is working against their stated faction',
      'knows where something critical is hidden',
    ]),
  };
}
```

### Roster generation

<!-- CLI implementation detail — do not hand-code -->

```js
function generateNPCRoster(rng, rooms, factions, theme) {
  const roomIds = Object.keys(rooms);
  const namedRoomCount = Math.ceil(roomIds.length * 0.5); // ~half the rooms have NPCs
  const npcRooms = randPickN(rng, roomIds, namedRoomCount);
  const roster = [];

  npcRooms.forEach(roomId => {
    const faction = randPick(rng, factions.factions);
    const profile = generateNPCProfile(rng, theme, faction);
    profile.startRoom = roomId;
    profile.currentRoom = roomId;
    profile.alive = true;
    roster.push(profile);
    rooms[roomId].npcs.push(profile.name);
  });

  return roster;
}
```

**Conversion to ai-npc definition objects:**
`generateNPCProfile()` output is a _seed_, not a complete NPC definition. The GM must expand it
into a full ai-npc `NPC` object before rendering the dialogue widget. Use `profile.trait`,
`profile.speech`, and `profile.wants` to write `voice.pattern`. Use `profile.hasSecret` and
`profile.secretCategory` to populate `knowledge.will_lie_about`. Map `profile.faction` to
faction ideology for `agenda`. Copy `profile.pronouns` and `profile.stats` directly into the
NPC definition — these are seeded and must not be overridden, as they ensure consistency
across save/resume cycles. This separation keeps world-gen fast (pure data) and NPC depth
in the hands of the GM where craft matters.

---

## Stage 5 — Loot Tables

Each room's loot pool is seeded independently. Rarity is weighted. Items are themed to the room
type and scenario.

### Item definitions

<!-- CLI implementation detail — do not hand-code -->

```js
const ITEM_TABLES = {
  space: {
    common: [
      { id: 'medkit', name: 'Emergency medkit', type: 'consumable', effect: 'restore 1d8 HP', uses: 1 },
      { id: 'ration_pack', name: 'Ration pack', type: 'consumable', effect: '+1 CON next roll', uses: 1 },
      { id: 'data_chip', name: 'Data chip', type: 'key_item', effect: 'unknown data', uses: 0 },
      { id: 'crowbar', name: 'Engineering crowbar', type: 'tool', effect: '+2 to force rolls', uses: -1 },
      { id: 'torch', name: 'Emergency torch', type: 'tool', effect: 'reveals hidden', uses: 3 },
    ],
    uncommon: [
      { id: 'stim_injector', name: 'Stim injector', type: 'consumable', effect: '+3 DEX for 1 scene', uses: 1 },
      { id: 'keycard_b', name: 'Level-B keycard', type: 'key_item', effect: 'opens B-clearance', uses: -1 },
      { id: 'plasma_cutter', name: 'Plasma cutter', type: 'weapon', effect: '1d8+2 damage', uses: 5 },
      { id: 'envirosuit', name: 'Partial enviro-suit', type: 'armour', effect: '+2 AC, hazard resist', uses: -1 },
    ],
    rare: [
      { id: 'keycard_a', name: 'Level-A keycard', type: 'key_item', effect: 'opens any door', uses: -1 },
      { id: 'rail_pistol', name: 'Rail pistol', type: 'weapon', effect: '1d10+3 damage', uses: 10 },
      { id: 'neural_patch', name: 'Neural patch', type: 'consumable', effect: '+4 INT for session', uses: 1 },
      { id: 'distress_beacon', name: 'Distress beacon', type: 'key_item', effect: 'triggers endgame', uses: 1 },
    ],
  },
  dungeon: {
    common: [
      { id: 'torch', name: 'Torch', type: 'tool', effect: 'reveals hidden', uses: 3 },
      { id: 'bandage', name: 'Cloth bandage', type: 'consumable', effect: 'restore 1d6 HP', uses: 1 },
      { id: 'lockpick', name: 'Lockpick set', type: 'tool', effect: '+2 to pick locks', uses: 3 },
      { id: 'rope', name: '50ft rope', type: 'tool', effect: 'enables climbing', uses: -1 },
      { id: 'ration', name: 'Hard tack ration', type: 'consumable', effect: '+1 CON next roll', uses: 1 },
    ],
    uncommon: [
      { id: 'potion_heal', name: 'Healing potion', type: 'consumable', effect: 'restore 2d8 HP', uses: 1 },
      { id: 'key_iron', name: 'Iron key', type: 'key_item', effect: 'opens iron door', uses: -1 },
      { id: 'dagger', name: 'Enchanted dagger', type: 'weapon', effect: '1d6+2 damage', uses: -1 },
      { id: 'cloak', name: 'Shadow cloak', type: 'armour', effect: '+2 AC, +2 stealth', uses: -1 },
    ],
    rare: [
      { id: 'sword', name: 'Runed sword', type: 'weapon', effect: '1d10+4 damage', uses: -1 },
      { id: 'key_vault', name: 'Vault key', type: 'key_item', effect: 'opens the vault', uses: -1 },
      { id: 'tome', name: 'Forbidden tome', type: 'key_item', effect: 'reveals faction secret', uses: 1 },
      { id: 'orb', name: 'Seeing orb', type: 'consumable', effect: 'reveals map', uses: 1 },
    ],
  },
};

const RARITY_WEIGHTS = { common: 6, uncommon: 3, rare: 1 };

function generateRoomLoot(rng, roomType, theme) {
  const tables = ITEM_TABLES[theme] || ITEM_TABLES.space;
  const itemCount = randWeighted(rng, [0, 1, 2, 3], [2, 4, 3, 1]);
  const loot = [];

  for (let i = 0; i < itemCount; i++) {
    const rarity = randWeighted(
      rng,
      ['common', 'uncommon', 'rare'],
      [RARITY_WEIGHTS.common, RARITY_WEIGHTS.uncommon, RARITY_WEIGHTS.rare],
    );
    const pool = tables[rarity];
    if (pool && pool.length) {
      const item = { ...randPick(rng, pool) };
      if (!loot.find(l => l.id === item.id)) loot.push(item);
    }
  }
  return loot;
}

function generateAllLoot(rng, rooms, theme) {
  Object.values(rooms).forEach(room => {
    room.loot = generateRoomLoot(rng, room.type, theme);
  });
}
```

---

## Stage 6 — Encounter Tables

Each room has a weighted encounter definition. Encounters are not inevitable — they are rolled
against during play. The table gives the GM the enemy type, threat level, and narrative framing.

<!-- CLI implementation detail — do not hand-code -->

```js
const ENCOUNTER_TABLES = {
  space: [
    { id: 'none', weight: 4, type: 'empty', name: null, threat: 0 },
    { id: 'patrol', weight: 2, type: 'combat', name: 'Security drones', threat: 1, hp: 8, ac: 12, damage: '1d6' },
    {
      id: 'infected_crew',
      weight: 2,
      type: 'combat',
      name: 'Infected crew member',
      threat: 2,
      hp: 14,
      ac: 10,
      damage: '1d8',
    },
    { id: 'survivor', weight: 1, type: 'social', name: 'Hiding survivor', threat: 0 },
    { id: 'hazard', weight: 2, type: 'hazard', name: 'Environmental hazard', threat: 1 },
    {
      id: 'elite_infected',
      weight: 1,
      type: 'combat',
      name: 'Apex infected',
      threat: 3,
      hp: 28,
      ac: 14,
      damage: '2d6',
    },
  ],
  dungeon: [
    { id: 'none', weight: 3, type: 'empty', name: null, threat: 0 },
    { id: 'guard', weight: 2, type: 'combat', name: 'Guard patrol', threat: 1, hp: 10, ac: 13, damage: '1d8' },
    { id: 'ambush', weight: 2, type: 'combat', name: 'Cultist ambush', threat: 2, hp: 12, ac: 11, damage: '1d6+1' },
    { id: 'trap', weight: 2, type: 'hazard', name: 'Mechanical trap', threat: 1 },
    { id: 'wanderer', weight: 1, type: 'social', name: 'Lost wanderer', threat: 0 },
    { id: 'boss_minion', weight: 1, type: 'combat', name: 'Elite guard', threat: 3, hp: 24, ac: 15, damage: '1d10+2' },
  ],
};

function generateEncounterTable(rng, rooms, theme) {
  const table = ENCOUNTER_TABLES[theme] || ENCOUNTER_TABLES.space;
  const weights = table.map(e => e.weight);

  Object.values(rooms).forEach(room => {
    const encounter = { ...randWeighted(rng, table, weights) };
    if (encounter.type === 'combat') {
      // Vary HP slightly per room instance so not every enemy is identical
      encounter.currentHp = encounter.hp + randInt(rng, -2, 2);
      encounter.currentHp = Math.max(1, encounter.currentHp);
    }
    room.encounter = encounter.type === 'empty' ? null : encounter;
  });
}
```

**Encounter escalation tiers:**

| Tier        | Trigger                                   | Effect                                     |
| ----------- | ----------------------------------------- | ------------------------------------------ |
| 1 — Quiet   | Default state                             | Encounter weights as generated             |
| 2 — Alert   | Alarm triggered / combat in adjacent room | Threat+1 on all encounters, patrols double |
| 3 — Hostile | Player openly hostile to dominant faction | All social encounters become combat        |
| 4 — Endgame | Main quest nearing resolution             | Boss-tier encounter spawns in boss room    |

Store the current tier in `gmState.worldFlags.escalationTier`. Re-roll encounter outcomes using
the same room seed but with a tier modifier when the tier increases.

---

## Stage 7 — Quest Hooks

Three hooks are generated: one main hook and two side hooks. All are derived from faction tensions
so they feel embedded in the world rather than bolted on.

<!-- CLI implementation detail — do not hand-code -->

```js
const HOOK_FRAMES = {
  main: [
    'The {factionA} are about to do something irreversible. You are the only one positioned to stop them — or help them.',
    'Something {factionA} and {factionB} both want is in this location. Neither knows the other is looking.',
    'A {factionA} member has gone rogue. They know something that could destroy everything.',
    'The only exit requires the cooperation of {factionA} and {factionB}, who currently want each other dead.',
  ],
  side: [
    '{npcName} from {factionA} will pay well for intelligence on {factionB}. The question is what you do with that leverage.',
    'Something in {roomType} does not match what any faction believes is true about this place.',
    '{npcName} needs to reach {roomType} before someone from {factionA} does. They cannot do it alone.',
    'A cache belonging to {factionA} is hidden in {roomType}. {factionB} would very much like to know about it.',
    '{npcName} has a secret that would shift the balance between {factionA} and {factionB} — permanently.',
  ],
};

function renderHookTemplate(template, data) {
  return template
    .replace('{factionA}', data.factionA)
    .replace('{factionB}', data.factionB)
    .replace('{npcName}', data.npcName)
    .replace('{roomType}', data.roomType);
}

function generateQuestHooks(rng, factions, roster, rooms) {
  const factionList = factions.factions;
  const hostilePairs = [];
  const tensPairs = [];

  // Find factions in conflict — these generate the most dramatic hooks
  factionList.forEach((fa, i) => {
    factionList.slice(i + 1).forEach(fb => {
      const rel = getFactionRelation(factions.relations, fa.id, fb.id);
      if (rel === 'at_war' || rel === 'hostile') hostilePairs.push([fa, fb]);
      if (rel === 'tense') tensPairs.push([fa, fb]);
    });
  });

  const primaryPair = hostilePairs.length
    ? randPick(rng, hostilePairs)
    : tensPairs.length
      ? randPick(rng, tensPairs)
      : [factionList[0], factionList[1]];

  const roomList = Object.values(rooms);
  const hookData = {
    factionA: primaryPair[0].name,
    factionB: primaryPair[1].name,
    npcName: roster.length ? randPick(rng, roster).name : 'an unknown figure',
    roomType: randPick(rng, roomList).type?.replace(/_/g, ' ') || 'a sealed chamber',
  };

  const mainHookTemplate = randPick(rng, HOOK_FRAMES.main);
  const sideHook1Template = randPick(rng, HOOK_FRAMES.side);
  let sideHook2Template = randPick(rng, HOOK_FRAMES.side);
  while (sideHook2Template === sideHook1Template) {
    sideHook2Template = randPick(rng, HOOK_FRAMES.side);
  }

  return {
    main: renderHookTemplate(mainHookTemplate, hookData),
    side: [
      renderHookTemplate(sideHook1Template, {
        ...hookData,
        npcName: roster.length > 1 ? randPick(rng, roster).name : hookData.npcName,
      }),
      renderHookTemplate(sideHook2Template, {
        ...hookData,
        roomType: randPick(rng, roomList).type?.replace(/_/g, ' ') || hookData.roomType,
      }),
    ],
  };
}
```

---

## The Master Pipeline

Assemble all stages into a single `generateWorld()` call.

### Arc Context — carryForward Integration

When generating a world for arc 2+, the pipeline receives a `carryForward` object
from the save-codex. This influences generation:

- **Faction placement:** Carried faction standings affect starting territory and
  disposition. A faction the player allied with in arc 1 controls more territory in
  arc 2. A hostile faction is more entrenched and aggressive.
- **NPC placement:** Alive NPCs with strong dispositions (trust > 70 or < 30) from
  the previous arc appear in the new world. Their roles may change (a former ally
  becomes a faction leader; a former enemy operates in the shadows).
- **Quest seeding:** The new arc's main quest hook derives from the previous arc's
  `worldConsequences`. If the player exposed a conspiracy, the new arc deals with
  the fallout. If they covered it up, the conspiracy grows.
- **Geography continuity:** If the same sector/region is used, familiar locations
  may reappear (with changes reflecting time passage and consequences).

If `carryForward` is null (arc 1 or fresh start), the pipeline runs without
modifications — standard procedural generation from seed alone.

<!-- CLI implementation detail — do not hand-code -->

```js
function generateWorld(seedStr, themeOverride) {
  const rng = createPRNG(seedStr);

  // Theme — either supplied or derived from seed
  const themes = ['space', 'dungeon', 'horror'];
  const theme = themeOverride || randPick(rng, themes);

  // Stage 1 — Geography
  const geo = generateGeography(rng, { theme });
  const { rooms, startRoom, bossRoom } = geo;

  // Stage 2 — Atmosphere
  generateAtmosphere(rng, rooms, theme);

  // Stage 3 — Factions
  const factions = generateFactions(rng, theme, Object.keys(rooms).length);

  // Assign faction territories to rooms
  const roomIds = Object.keys(rooms);
  factions.factions.forEach(f => {
    const count = randInt(rng, 1, Math.ceil(roomIds.length / factions.factions.length));
    f.territory = randPickN(rng, roomIds, count);
    f.territory.forEach(rid => {
      if (rooms[rid]) rooms[rid].controllingFaction = f.id;
    });
  });

  // Stage 4 — NPC Roster
  const roster = generateNPCRoster(rng, rooms, factions, theme);

  // Stage 5 — Loot
  generateAllLoot(rng, rooms, theme);

  // Stage 6 — Encounters
  generateEncounterTable(rng, rooms, theme);

  // Stage 7 — Quest Hooks
  const hooks = generateQuestHooks(rng, factions, roster, rooms);

  return {
    seed: seedStr,
    theme,
    rooms,
    startRoom,
    bossRoom,
    factions,
    roster,
    hooks,
    meta: {
      roomCount: Object.keys(rooms).length,
      npcCount: roster.length,
      generatedAt: Date.now(),
    },
  };
}
```

---

## Seed Widget — Player-Facing Interface

Render the seed entry widget before the first scene by running the `tag` CLI via Bash tool. The player enters a seed (or accepts a generated one) and sees a brief world preview before committing to begin.

To render the seed widget, run this CLI command via Bash tool:

```
tag render scene --style seed-entry
```

The widget allows the player to enter or roll a seed, select a theme (space/dungeon/horror), preview the world parameters, and begin the adventure. The seed must be displayed prominently so the player can copy it to replay or share the run. Store it in `gmState.seed`.

---

## Integration with the Orchestrator

When all modules are loaded together, observe these integration contracts:

**`worldData` lives in `gmState`:**

```js
gmState.worldData = generateWorld(seed, theme);
gmState.seed = seed;
```

**Scene rendering pulls from `worldData`:**

```js
const room = gmState.worldData.rooms[gmState.currentRoom];
// room.atmosphere → scene prose
// room.npcs       → NPC presence
// room.loot       → available items
// room.encounter  → combat/hazard trigger
// room.connections → exits listed in scene footer
```

**Map rendering uses `worldData.rooms`:**
The room graph (connections object) defines the map topology. Each room's `visited` and `revealed`
flags drive the progressive disclosure logic defined in the orchestrator map rules. Render the map
by running `tag render map --style <style>` via Bash tool.

**World panels read generated state directly:**
Use the dedicated web component widgets when the player needs generated-world context:

- `tag render world-preview --style <style> --data '{"seed":"<seed>","theme":"space"}'`
- `tag render faction-board --style <style>`
- `tag render relationship-web --style <style>`
- `tag render world-atlas --style <style>`
- `tag render clue-board --style <style>`

These widgets read `worldData`, `mapState`, `codexMutations`, `factions`, and `quests`; do not
hand-code equivalent HTML.

**NPC profiles expand into ai-npc definitions:**

```js
const profile = gmState.worldData.roster.find(n => n.currentRoom === gmState.currentRoom);
// profile.name, .trait, .speech, .wants → expand into full NPC definition object
// profile.faction → drives agenda array and disposition triggers
// profile.hasSecret, .secretCategory → drives knowledge.will_lie_about
```

**Quest hooks surface in Act 1:**

```js
gmState.worldData.hooks.main; // rendered in scene 2, after the world is partially established
gmState.worldData.hooks.side; // surfaced via NPC dialogue or room discoveries in Act 2
```

**Escalation tier propagates to encounter table:**
When `gmState.worldFlags.escalationTier` increments, re-evaluate encounters in unvisited rooms
by running `generateEncounterTable()` with the same room-level seed but adding the tier as a
weight modifier to more dangerous encounter types.

---

## Saving and Resuming — Persisted World Data

The CLI now persists full `gmState.worldData` when `tag world generate --apply` is used. This is
intentional: map commands, NPC inspection, codex seeding, and generated quest hooks can all read the
same concrete world object without requiring the GM to regenerate it manually.

Because `generateWorld()` is still deterministic, a future compact-save format may store only seed,
theme, and deltas. For this skill version, the canonical local state includes the full generated
world:

```js
const persistedState = {
  seed: gmState.seed,
  theme: gmState.worldData.theme,
  worldData: gmState.worldData,
  mapState: gmState.mapState,
  scene: gmState.scene,
  character: gmState.character,
  visitedRooms: gmState.visitedRooms,
  currentRoom: gmState.currentRoom,
  worldFlags: gmState.worldFlags, // doors opened, NPCs dead, loot taken, etc.
  rosterMutations: gmState.rosterMutations,
  codexMutations: gmState.codexMutations,
  quests: gmState.quests,
};
```

The save code is a base64 string the player can copy from the scene footer and paste to resume.
No server. No storage API. Save and load operations are handled by running `tag save` and
`tag state` commands via Bash tool.

---

## Anti-Patterns (never do these)

- Never call `rng()` outside the pipeline stages — it shifts the sequence and corrupts the world.
- Never reorder the pipeline stages — geography must always precede atmosphere, factions, NPCs,
  loot, encounters, and hooks, in that order.
- Never fabricate world details that contradict `worldData` — if the PRNG says there are two
  factions, there are two factions. The GM narrates from the data; they don't override it.
- Never generate a new PRNG instance mid-session — one instance per `generateWorld()` call.
- Never expose raw room IDs (`room_0`, `room_3`) to the player — translate to location names first.
- Never place quest hook text verbatim in scene prose — the hook is a structural seed for the GM,
  not player-facing copy.
- Never paste the full `worldData` into a `sendPrompt()` string — it can exceed limits. Persist it
  in CLI state and inspect it with `tag state get worldData` or `tag map inspect <zone-id>`.
- Never assume two different theme/seed combinations produce the same faction set — always
  read from `worldData.factions` rather than guessing from theme name.
