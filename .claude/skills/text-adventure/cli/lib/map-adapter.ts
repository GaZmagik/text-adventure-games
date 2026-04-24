// Map adapter converts deterministic worldgen output into persistent gameplay state slices.
import type {
  CodexMutation,
  GmState,
  MapConnection,
  MapState,
  MapType,
  MapZone,
  NpcMutation,
  Quest,
  StatBlock,
  WorldData,
  WorldRoom,
} from '../types';

type WorldSeedPayload = {
  worldData: WorldData;
  mapState: MapState;
  factions: Record<string, number>;
  rosterMutations: NpcMutation[];
  codexMutations: CodexMutation[];
  quests: Quest[];
};

function modifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function modifiers(stats: StatBlock): StatBlock {
  return {
    STR: modifier(stats.STR),
    DEX: modifier(stats.DEX),
    CON: modifier(stats.CON),
    INT: modifier(stats.INT),
    WIS: modifier(stats.WIS),
    CHA: modifier(stats.CHA),
  };
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function mapTypeForTheme(theme: WorldData['theme']): MapType {
  if (theme === 'space') return 'settlement';
  return 'dungeon';
}

function connectionId(a: string, b: string): string {
  return `${a}-${b}`;
}

function threatStatus(room: WorldRoom, isStart: boolean): NonNullable<MapZone['status']> {
  if (isStart) return 'current';
  if (room.type === 'infirmary' || room.icon === 'safe') return 'safe';
  if (room.type === 'boss' || room.type === 'hazard' || room.threat === 'high') return 'danger';
  if (room.icon === 'locked') return 'locked';
  return 'revealed';
}

function iconForRoom(room: WorldRoom): string | undefined {
  if (room.icon) return room.icon;
  if (room.type === 'boss') return 'objective';
  if (room.type === 'exit' || room.type === 'entrance') return 'exit';
  if (room.type === 'archive') return 'clue';
  if (room.type === 'treasury' || room.type === 'storage') return 'loot';
  if (room.type === 'quarters') return 'npc';
  if (room.threat === 'high') return 'danger';
  return undefined;
}

function buildLayout(worldData: WorldData): Record<string, { x: number; y: number; width: number; height: number }> {
  const rooms = worldData.rooms;
  const ids = Object.keys(rooms);
  const depths = new Map<string, number>();
  const queue = [worldData.startRoom];
  depths.set(worldData.startRoom, 0);

  while (queue.length) {
    const current = queue.shift()!;
    const depth = depths.get(current) ?? 0;
    for (const next of rooms[current]?.exits ?? []) {
      if (!depths.has(next)) {
        depths.set(next, depth + 1);
        queue.push(next);
      }
    }
  }

  const byDepth = new Map<number, string[]>();
  for (const id of ids) {
    const depth = depths.get(id) ?? 0;
    const bucket = byDepth.get(depth) ?? [];
    bucket.push(id);
    byDepth.set(depth, bucket);
  }

  const maxDepth = Math.max(...[...byDepth.keys(), 0]);
  const layout: Record<string, { x: number; y: number; width: number; height: number }> = {};
  for (const [depth, bucket] of byDepth.entries()) {
    const x = Math.round(34 + (depth / Math.max(1, maxDepth)) * 536);
    const yStep = 270 / Math.max(1, bucket.length);
    bucket.forEach((id, index) => {
      layout[id] = {
        x,
        y: Math.round(42 + index * yStep),
        width: worldData.theme === 'space' ? 108 : 96,
        height: worldData.theme === 'space' ? 48 : 56,
      };
    });
  }
  return layout;
}

export function worldToMapState(worldData: WorldData): MapState {
  const layout = buildLayout(worldData);
  const start = worldData.startRoom;
  const immediate = new Set(worldData.rooms[start]?.exits ?? []);
  const revealed = unique([start, ...immediate]);
  const zones: MapZone[] = Object.values(worldData.rooms).map(room => {
    const visible = room.id === start || immediate.has(room.id);
    const position = layout[room.id] ?? { x: 40, y: 40, width: 96, height: 56 };
    const icon = iconForRoom(room);
    return {
      id: room.id,
      name: room.name,
      type: room.type,
      terrain: room.terrain ?? null,
      x: position.x,
      y: position.y,
      width: position.width,
      height: position.height,
      status: visible ? threatStatus(room, room.id === start) : 'unexplored',
      faction: room.controllingFaction ?? null,
      description: room.description,
      encounters: room.encounters,
      loot: room.loot,
      connections: room.exits,
      ...(room.threat !== undefined ? { threat: room.threat } : {}),
      ...(icon ? { icon } : {}),
    };
  });

  const seen = new Set<string>();
  const connections: MapConnection[] = [];
  for (const room of Object.values(worldData.rooms)) {
    for (const target of room.exits) {
      const sorted = [room.id, target].sort();
      const key = sorted.join(':');
      if (seen.has(key)) continue;
      seen.add(key);
      const discovered = room.id === start || target === start || (immediate.has(room.id) && immediate.has(target));
      const targetRoom = worldData.rooms[target];
      const locked =
        room.type === 'boss' || targetRoom?.type === 'boss'
          ? false
          : room.icon === 'locked' || targetRoom?.icon === 'locked';
      connections.push({
        id: connectionId(room.id, target),
        from: room.id,
        to: target,
        type: locked ? 'door' : room.type === 'stairs' || targetRoom?.type === 'stairs' ? 'stairs' : 'path',
        bidirectional: true,
        discovered,
        locked,
        status: locked ? 'locked' : 'open',
        travelTime: worldData.theme === 'space' ? '1 shift' : '1 turn',
      });
    }
  }

  return {
    activeMapType: mapTypeForTheme(worldData.theme),
    mapId: `world-${worldData.seed}`,
    mapName: worldData.mapName,
    zones,
    connections,
    doors: connections
      .filter(connection => connection.type === 'door')
      .map(connection => ({
        between: [connection.from, connection.to],
        type: 'door',
        status: connection.locked ? 'locked' : 'open',
      })),
    currentZone: start,
    visitedZones: [start],
    revealedZones: revealed,
    doorStates: Object.fromEntries(
      connections
        .filter(connection => connection.type === 'door')
        .map(connection => [`${connection.from}:${connection.to}`, connection.locked ? 'locked' : 'open']),
    ),
    supplies: worldData.theme === 'space' ? null : { rations: 10, water: 10 },
    travelLog: [],
  };
}

export function buildWorldSeedPayload(worldData: WorldData): WorldSeedPayload {
  const mapState = worldToMapState(worldData);
  const factions = Object.fromEntries(worldData.factions.factions.map(faction => [faction.id, 0]));
  const rosterMutations: NpcMutation[] = worldData.roster.map(profile => {
    const mods = modifiers(profile.stats);
    const level = profile.tier === 'nemesis' ? 4 : profile.tier === 'rival' ? 2 : 1;
    const maxHp = profile.tier === 'nemesis' ? 28 : profile.tier === 'rival' ? 16 : 8;
    return {
      id: profile.id,
      name: profile.name,
      pronouns: profile.pronouns,
      role: profile.role,
      tier: profile.tier,
      level,
      stats: profile.stats,
      modifiers: mods,
      hp: maxHp,
      maxHp,
      ac: 10 + Math.max(0, mods.DEX),
      soak: profile.tier === 'nemesis' ? 2 : 0,
      damageDice: profile.tier === 'nemesis' ? '2d6' : profile.tier === 'rival' ? '1d8' : '1d6',
      status: 'active',
      alive: true,
      trust: profile.trust,
      disposition: profile.disposition,
      dispositionSeed: profile.trust / 100,
      currentRoom: profile.currentRoom,
      specialAbilities: [],
    };
  });

  const codexMutations: CodexMutation[] = [
    ...worldData.factions.factions.map(faction => ({
      id: `faction_${faction.id}`,
      title: faction.name,
      category: 'faction',
      state: 'locked' as const,
      via: 'worldgen',
      secrets: [`Ideology: ${faction.ideology}`],
    })),
    ...Object.values(worldData.rooms).map(room => ({
      id: `location_${room.id}`,
      title: room.name,
      category: 'location',
      state: room.id === worldData.startRoom ? ('partial' as const) : ('locked' as const),
      via: 'worldgen',
      secrets: [room.description],
    })),
    ...worldData.roster.map(profile => ({
      id: `character_${profile.id}`,
      title: profile.name,
      category: 'character',
      state: 'locked' as const,
      via: 'worldgen',
      secrets: [profile.secret],
    })),
  ];

  const quests: Quest[] = [
    {
      id: 'world_main',
      title: 'Resolve the generated crisis',
      status: 'active',
      type: 'main',
      summary: worldData.hooks.main,
      objectives: [
        {
          id: 'reach_boss_room',
          description: `Reach ${worldData.rooms[worldData.bossRoom]?.name ?? worldData.bossRoom}.`,
          completed: false,
          locationId: worldData.bossRoom,
        },
        {
          id: 'choose_faction_outcome',
          description: 'Decide which faction, if any, controls the outcome.',
          completed: false,
        },
      ],
      clues: [{ id: 'main_hook', text: worldData.hooks.main, important: true }],
      relatedFactionIds: [worldData.hooks.factionA, worldData.hooks.factionB],
      relatedLocationIds: [worldData.bossRoom],
    },
    ...worldData.hooks.side.map((hook, index) => ({
      id: `world_side_${index + 1}`,
      title: `Generated lead ${index + 1}`,
      status: 'active' as const,
      type: 'side' as const,
      summary: hook,
      objectives: [{ id: 'follow_lead', description: hook, completed: false }],
      clues: [],
    })),
  ];

  return { worldData, mapState, factions, rosterMutations, codexMutations, quests };
}

function upsertById<T extends { id: string }>(existing: T[], generated: T[]): T[] {
  const generatedIds = new Set(generated.map(item => item.id));
  return [...existing.filter(item => !generatedIds.has(item.id)), ...generated];
}

export function applyWorldSeedPayload(state: GmState, payload: WorldSeedPayload): void {
  state.worldData = payload.worldData;
  state.seed = payload.worldData.seed;
  state.theme = payload.worldData.theme;
  state.currentRoom = payload.worldData.startRoom;
  state.visitedRooms = unique([...(state.visitedRooms ?? []), payload.worldData.startRoom]);
  state.mapState = payload.mapState;
  state.factions = { ...state.factions, ...payload.factions };
  state.rosterMutations = upsertById(state.rosterMutations, payload.rosterMutations);
  state.codexMutations = upsertById(
    state.codexMutations.filter(entry => entry.via !== 'worldgen'),
    payload.codexMutations,
  );
  state.quests = upsertById(
    state.quests.filter(quest => !quest.id.startsWith('world_')),
    payload.quests,
  );
  state.worldFlags['worldgen:seed'] = payload.worldData.seed;
  state.worldFlags['worldgen:theme'] = payload.worldData.theme;
}
