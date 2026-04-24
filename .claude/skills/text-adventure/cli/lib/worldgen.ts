// Deterministic procedural world generator for rooms, factions, NPCs, hooks, and relations.
import { fnv32 } from './fnv32';
import type {
  BestiaryTier,
  DispositionState,
  Pronouns,
  StatBlock,
  WorldData,
  WorldFaction,
  WorldHooks,
  WorldNpcProfile,
  WorldRoom,
  WorldTheme,
} from '../types';

const THEMES: readonly WorldTheme[] = ['space', 'dungeon', 'horror'];

type RoomTemplate = {
  name: string;
  type: string;
  terrain: string;
  description: string;
  icon?: string;
};

type FactionTemplate = {
  id: string;
  name: string;
  ideology: string;
};

type ThemeData = {
  mapName: string;
  roomTypes: RoomTemplate[];
  factions: FactionTemplate[];
  loot: string[];
  encounters: string[];
  atmosphere: string[];
  roles: string[];
};

const THEME_DATA: Record<WorldTheme, ThemeData> = {
  space: {
    mapName: 'Generated Station',
    roomTypes: [
      {
        name: 'Docking Ring',
        type: 'dock',
        terrain: 'metal',
        description: 'A pressurised ring of clamps, cargo rails, and standby alarms.',
        icon: 'exit',
      },
      {
        name: 'Command Deck',
        type: 'command',
        terrain: 'metal',
        description: 'A raised operations deck with dead consoles and sealed orders.',
        icon: 'objective',
      },
      {
        name: 'Hydroponics Bay',
        type: 'garden',
        terrain: 'forest',
        description: 'Rows of nutrient towers breathe through mist and emergency light.',
      },
      {
        name: 'Medical Ward',
        type: 'infirmary',
        terrain: 'metal',
        description: 'Sterile beds and sealed cabinets surround a flickering triage screen.',
        icon: 'safe',
      },
      {
        name: 'Engineering Core',
        type: 'reactor',
        terrain: 'industrial',
        description: 'Heat haze ripples above a humming spine of conduits.',
        icon: 'force',
      },
      {
        name: 'Crew Quarters',
        type: 'quarters',
        terrain: 'metal',
        description: 'Personal effects drift around bunks left in a hurry.',
        icon: 'npc',
      },
      {
        name: 'Data Vault',
        type: 'archive',
        terrain: 'metal',
        description: 'Cold server stacks pulse behind reinforced glass.',
        icon: 'clue',
      },
      {
        name: 'Cargo Hold',
        type: 'storage',
        terrain: 'industrial',
        description: 'Containers sit chained in place beneath a gantry crane.',
        icon: 'loot',
      },
      {
        name: 'Observation Spine',
        type: 'lookout',
        terrain: 'metal',
        description: 'A long blister of glass overlooks the silent black.',
      },
      {
        name: 'Escape Gantry',
        type: 'exit',
        terrain: 'metal',
        description: 'Launch rails point toward pods that may or may not still answer.',
        icon: 'exit',
      },
    ],
    factions: [
      { id: 'union', name: 'Free Dock Union', ideology: 'mutual aid and worker control' },
      { id: 'consortium', name: 'Helix Consortium', ideology: 'profit, patents, and quiet ownership' },
      { id: 'wardens', name: 'Station Wardens', ideology: 'order before liberty' },
      { id: 'signalists', name: 'The Signalists', ideology: 'obedience to transmissions from beyond the hull' },
    ],
    loot: ['access wafer', 'med gel', 'charged cell', 'blackbox shard', 'repair foam'],
    encounters: ['security drone', 'panicked technician', 'vacuum leak', 'rival scavenger', 'signal-corrupted crew'],
    atmosphere: ['ozone', 'cold metal', 'recycled air', 'distant klaxons', 'static'],
    roles: ['engineer', 'quartermaster', 'security officer', 'medic', 'data broker'],
  },
  dungeon: {
    mapName: 'Generated Dungeon',
    roomTypes: [
      {
        name: 'Broken Gate',
        type: 'entrance',
        terrain: 'stone',
        description: 'A cracked threshold descends under old warning marks.',
        icon: 'exit',
      },
      {
        name: 'Guard Hall',
        type: 'hall',
        terrain: 'stone',
        description: 'Arrow slits and shield scars line the main passage.',
      },
      {
        name: 'Flooded Crypt',
        type: 'crypt',
        terrain: 'water',
        description: 'Black water laps at half-submerged sarcophagi.',
      },
      {
        name: 'Fungal Gallery',
        type: 'cavern',
        terrain: 'swamp',
        description: 'Soft caps glow in the damp around a carved stair.',
        icon: 'stairs',
      },
      {
        name: 'Reliquary',
        type: 'treasury',
        terrain: 'stone',
        description: 'Niches hold relics behind corroded bronze mesh.',
        icon: 'loot',
      },
      {
        name: 'Scribe Cells',
        type: 'archive',
        terrain: 'stone',
        description: 'Rotten desks sag beneath tablets and chain-bound ledgers.',
        icon: 'clue',
      },
      {
        name: 'Collapsed Span',
        type: 'hazard',
        terrain: 'mountains',
        description: 'A broken bridge crosses a shaft of stale air.',
        icon: 'danger',
      },
      {
        name: 'Chapel of Ash',
        type: 'sanctum',
        terrain: 'stone',
        description: 'Ash piles gather beneath a roof painted with blind stars.',
      },
      {
        name: 'Hidden Armoury',
        type: 'armoury',
        terrain: 'stone',
        description: 'Weapon racks hide behind a false wall.',
        icon: 'locked',
      },
      {
        name: 'Throne Pit',
        type: 'boss',
        terrain: 'stone',
        description: 'A sunken dais waits under banners that refuse to rot.',
        icon: 'objective',
      },
    ],
    factions: [
      { id: 'keepers', name: 'Ashen Keepers', ideology: 'guarding forbidden rites' },
      { id: 'delvers', name: 'Lantern Delvers', ideology: 'profit through careful trespass' },
      { id: 'crown', name: 'Exiled Crown', ideology: 'restoring a buried bloodline' },
      { id: 'mireborn', name: 'Mireborn Pact', ideology: 'feeding the dungeon until it wakes' },
    ],
    loot: ['silver key', 'torch oil', 'etched idol', 'healing draught', 'rune shard'],
    encounters: ['restless guard', 'floor snare', 'hungry ooze', 'lost delver', 'mire cultist'],
    atmosphere: ['wet stone', 'old ash', 'fungal musk', 'chain echoes', 'cold draughts'],
    roles: ['gate scout', 'relic hunter', 'oathbound guard', 'scribe', 'cult envoy'],
  },
  horror: {
    mapName: 'Generated Estate',
    roomTypes: [
      {
        name: 'Rain Porch',
        type: 'entrance',
        terrain: 'stone',
        description: 'Rain hammers the porch while the door stands politely open.',
        icon: 'exit',
      },
      {
        name: 'Portrait Hall',
        type: 'hall',
        terrain: 'wood',
        description: 'Portrait eyes follow every movement from buckling frames.',
      },
      {
        name: 'Nursery',
        type: 'quarters',
        terrain: 'wood',
        description: 'A music box ticks beside toys arranged in a circle.',
        icon: 'npc',
      },
      {
        name: 'Winter Garden',
        type: 'garden',
        terrain: 'forest',
        description: 'Dead vines press against frosted glass from the inside.',
      },
      {
        name: 'Servants Stair',
        type: 'stairs',
        terrain: 'wood',
        description: 'A narrow stair bends around a darkness that absorbs sound.',
        icon: 'stairs',
      },
      {
        name: 'Locked Study',
        type: 'archive',
        terrain: 'wood',
        description: 'A writing desk waits beneath envelopes sealed in black wax.',
        icon: 'locked',
      },
      {
        name: 'Sick Room',
        type: 'infirmary',
        terrain: 'wood',
        description: 'Sheets are folded too neatly over something that is not there.',
        icon: 'safe',
      },
      {
        name: 'Wine Cellar',
        type: 'cellar',
        terrain: 'stone',
        description: 'The racks are empty except for one bottle that feels warm.',
      },
      {
        name: 'Mirror Gallery',
        type: 'hazard',
        terrain: 'metal',
        description: 'Every mirror shows the room a moment too late.',
        icon: 'danger',
      },
      {
        name: 'Sealed Attic',
        type: 'boss',
        terrain: 'wood',
        description: 'A locked hatch breathes dust into the upper corridor.',
        icon: 'objective',
      },
    ],
    factions: [
      { id: 'family', name: 'The Veyr Family', ideology: 'inheritance without end' },
      { id: 'order', name: 'The Quiet Order', ideology: 'silence as containment' },
      { id: 'staff', name: 'The Remaining Staff', ideology: 'survival through obedience' },
      { id: 'mirror', name: 'The Mirror Choir', ideology: 'replacement of the living by reflections' },
    ],
    loot: ['iron key', 'laudanum vial', 'sealed letter', 'silver hand mirror', 'salt packet'],
    encounters: ['weeping servant', 'cold spot', 'locked door rattle', 'portrait whisper', 'wrong reflection'],
    atmosphere: ['rain', 'dust', 'old perfume', 'warped floorboards', 'breath on glass'],
    roles: ['housekeeper', 'heir', 'groundskeeper', 'confessor', 'doctor'],
  },
};

type Rng = () => number;

function createRng(seed: string): Rng {
  let state = Number.parseInt(fnv32(seed), 16) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick<T>(rng: Rng, values: readonly T[]): T {
  return values[Math.floor(rng() * values.length)]!;
}

function shuffle<T>(rng: Rng, values: readonly T[]): T[] {
  const copy = values.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'room'
  );
}

function uniqueRoomId(base: string, used: Set<string>): string {
  let id = slug(base);
  let suffix = 2;
  while (used.has(id)) {
    id = `${slug(base)}_${suffix}`;
    suffix++;
  }
  used.add(id);
  return id;
}

function statBlock(rng: Rng): StatBlock {
  return {
    STR: randInt(rng, 8, 16),
    DEX: randInt(rng, 8, 16),
    CON: randInt(rng, 8, 16),
    INT: randInt(rng, 8, 16),
    WIS: randInt(rng, 8, 16),
    CHA: randInt(rng, 8, 16),
  };
}

function buildRooms(
  rng: Rng,
  theme: WorldTheme,
): { rooms: Record<string, WorldRoom>; startRoom: string; bossRoom: string } {
  const data = THEME_DATA[theme];
  const count = randInt(rng, 8, Math.min(10, data.roomTypes.length));
  const selected = shuffle(rng, data.roomTypes).slice(0, count);
  const startTemplate = selected.find(room => room.type === 'entrance') ?? selected[0]!;
  const bossTemplate = selected.find(room => room.type === 'boss') ?? selected[selected.length - 1]!;
  const ordered = [
    startTemplate,
    ...selected.filter(room => room !== startTemplate && room !== bossTemplate),
    bossTemplate,
  ];
  const used = new Set<string>();
  const rooms: Record<string, WorldRoom> = {};

  for (const template of ordered) {
    const id = uniqueRoomId(template.name, used);
    rooms[id] = {
      id,
      name: template.name,
      type: template.type,
      terrain: template.terrain,
      description: template.description,
      atmosphere: pick(rng, data.atmosphere),
      exits: [],
      threat:
        template.type === 'boss' || template.type === 'hazard' ? 'high' : randInt(rng, 1, 6) >= 5 ? 'medium' : 'low',
      danger: template.type === 'boss' ? 4 : template.type === 'hazard' ? 3 : randInt(rng, 0, 2),
      loot: randInt(rng, 1, 6) >= 4 ? [pick(rng, data.loot)] : [],
      encounters: randInt(rng, 1, 6) >= 4 || template.type === 'boss' ? [pick(rng, data.encounters)] : [],
      tags: [template.type, template.terrain],
      ...(template.icon ? { icon: template.icon } : {}),
    };
  }

  const ids = Object.keys(rooms);
  for (let i = 0; i < ids.length - 1; i++) {
    connectRooms(rooms, ids[i]!, ids[i + 1]!);
  }
  const extraConnections = Math.max(1, Math.floor(ids.length / 3));
  for (let i = 0; i < extraConnections; i++) {
    const from = ids[randInt(rng, 0, ids.length - 2)]!;
    const to = ids[randInt(rng, 1, ids.length - 1)]!;
    if (from !== to) connectRooms(rooms, from, to);
  }

  return { rooms, startRoom: ids[0]!, bossRoom: ids[ids.length - 1]! };
}

function connectRooms(rooms: Record<string, WorldRoom>, a: string, b: string): void {
  if (!rooms[a] || !rooms[b]) return;
  if (!rooms[a].exits.includes(b)) rooms[a].exits.push(b);
  if (!rooms[b].exits.includes(a)) rooms[b].exits.push(a);
}

function buildFactions(
  rng: Rng,
  theme: WorldTheme,
  roomIds: string[],
): { factions: WorldFaction[]; relations: Record<string, string> } {
  const data = THEME_DATA[theme];
  const count = randInt(rng, 2, Math.min(4, data.factions.length));
  const selected = shuffle(rng, data.factions).slice(0, count);
  const factions: WorldFaction[] = selected.map(template => ({
    ...template,
    territory: [],
    disposition: 0,
  }));

  const availableRooms = shuffle(rng, roomIds);
  for (const faction of factions) {
    const territoryCount = randInt(rng, 1, Math.max(1, Math.ceil(roomIds.length / factions.length)));
    faction.territory = availableRooms.splice(0, territoryCount);
  }

  const relations: Record<string, string> = {};
  const states = ['allied', 'neutral', 'rival', 'hostile'];
  for (let i = 0; i < factions.length; i++) {
    for (let j = i + 1; j < factions.length; j++) {
      relations[`${factions[i]!.id}_${factions[j]!.id}`] = pick(rng, states);
    }
  }

  return { factions, relations };
}

function assignTerritory(rooms: Record<string, WorldRoom>, factions: WorldFaction[]): void {
  for (const faction of factions) {
    for (const roomId of faction.territory) {
      if (rooms[roomId]) rooms[roomId].controllingFaction = faction.id;
    }
  }
}

function buildRoster(
  rng: Rng,
  theme: WorldTheme,
  rooms: Record<string, WorldRoom>,
  factions: WorldFaction[],
): WorldNpcProfile[] {
  const data = THEME_DATA[theme];
  const roomIds = Object.keys(rooms);
  const names = [
    'Maren Voss',
    'Ilyra Thane',
    'Corin Vale',
    'Sera Kint',
    'Bastian Rook',
    'Nia Vey',
    'Orren Slate',
    'Tamsin Crow',
    'Jalen Myr',
    'Vera Sable',
  ];
  const pronouns: readonly Pronouns[] = ['she/her', 'he/him', 'they/them', 'it/its'];
  const tiers: readonly BestiaryTier[] = ['minion', 'rival', 'nemesis'];
  const dispositions: readonly DispositionState[] = ['hostile', 'suspicious', 'neutral', 'friendly'];
  const count = Math.min(randInt(rng, 3, 5), roomIds.length);

  return shuffle(rng, names)
    .slice(0, count)
    .map((name, index) => {
      const faction = pick(rng, factions);
      const startRoom = roomIds[(index * 2 + randInt(rng, 0, roomIds.length - 1)) % roomIds.length]!;
      return {
        id: `npc_${slug(name)}`,
        name,
        pronouns: pick(rng, pronouns),
        role: pick(rng, data.roles),
        faction: faction.id,
        factionName: faction.name,
        startRoom,
        currentRoom: startRoom,
        tier: index === 0 ? 'rival' : pick(rng, tiers),
        stats: statBlock(rng),
        trust: randInt(rng, 20, 60),
        disposition: pick(rng, dispositions),
        agenda: [
          `Advance ${faction.name}'s interest in ${rooms[startRoom]?.name ?? startRoom}.`,
          `Keep ${pick(rng, data.loot)} out of rival hands.`,
        ],
        secret: pick(rng, [
          'is concealing a debt',
          'knows a hidden route',
          'has lied about their faction loyalty',
          'recognises the main threat',
        ]),
      };
    });
}

function buildHooks(
  rng: Rng,
  factions: WorldFaction[],
  roster: WorldNpcProfile[],
  rooms: Record<string, WorldRoom>,
): WorldHooks {
  const roomList = Object.values(rooms);
  const factionA = factions[0]!;
  const factionB = factions[1] ?? factions[0]!;
  const npc = roster[0];
  const targetRoom = roomList[roomList.length - 1]!;
  const sideRoom = pick(rng, roomList);

  return {
    main: `${factionA.name} and ${factionB.name} both need what is hidden in ${targetRoom.name}. Decide who reaches it first, or make sure nobody does.`,
    side: [
      `${npc?.name ?? 'A local contact'} needs proof from ${sideRoom.name} before a rival finds it.`,
      `A cache tied to ${factionA.name} is missing somewhere near ${pick(rng, roomList).name}.`,
    ],
    factionA: factionA.id,
    factionB: factionB.id,
  };
}

export function isWorldTheme(value: string): value is WorldTheme {
  return (THEMES as readonly string[]).includes(value);
}

export function generateWorld(seed: string, themeOverride?: WorldTheme): WorldData {
  const rng = createRng(`${seed}:${themeOverride ?? 'auto'}`);
  const theme = themeOverride ?? pick(rng, THEMES);
  const { rooms, startRoom, bossRoom } = buildRooms(rng, theme);
  const factionData = buildFactions(rng, theme, Object.keys(rooms));
  assignTerritory(rooms, factionData.factions);
  const roster = buildRoster(rng, theme, rooms, factionData.factions);
  const hooks = buildHooks(rng, factionData.factions, roster, rooms);

  return {
    seed,
    theme,
    mapName: THEME_DATA[theme].mapName,
    rooms,
    startRoom,
    bossRoom,
    factions: factionData,
    roster,
    hooks,
    meta: {
      roomCount: Object.keys(rooms).length,
      npcCount: roster.length,
      generatedAt: 0,
      generatorVersion: 1,
    },
  };
}
