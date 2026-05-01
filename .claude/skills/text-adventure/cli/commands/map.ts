// Map command handlers mutate and inspect generated map state while preserving traversal history.
import type { CommandResult, GmState, MapConnection, MapState, MapZone, StatName } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState, saveState } from '../lib/state-store';
import { recordHistory } from './state';
import { planMapRoute } from '../lib/map-routing';

const VALID_SUBCOMMANDS = ['enter', 'reveal', 'discover', 'unlock', 'inspect', 'route'] as const;

function isCommandResult<T>(obj: unknown): obj is CommandResult<T> {
  return !!obj && typeof obj === 'object' && 'ok' in (obj as Record<string, unknown>);
}

function getMapState(state: GmState, command: string): MapState | CommandResult {
  if (!state.mapState) {
    return fail(
      'No mapState available.',
      'Generate or set a map first: tag world generate --seed <seed> --apply',
      command,
    );
  }
  return state.mapState;
}

function addUnique(values: string[] | undefined, value: string): string[] {
  return values?.includes(value) ? values : [...(values ?? []), value];
}

function findZone(mapState: MapState, zoneId: string): MapZone | undefined {
  return (mapState.zones ?? []).find(zone => zone.id === zoneId);
}

function sameRoute(connection: MapConnection, from: string, to: string): boolean {
  if (connection.from === from && connection.to === to) return true;
  return connection.bidirectional !== false && connection.from === to && connection.to === from;
}

function findConnection(mapState: MapState, from: string, to: string): MapConnection | undefined {
  return (mapState.connections ?? []).find(connection => sameRoute(connection, from, to));
}

function findConnectionByToken(mapState: MapState, token: string): MapConnection | undefined {
  return (mapState.connections ?? []).find(connection => {
    const id = connection.id ?? `${connection.from}-${connection.to}`;
    return (
      id === token ||
      `${connection.from}-${connection.to}` === token ||
      `${connection.from}:${connection.to}` === token ||
      `${connection.to}-${connection.from}` === token ||
      `${connection.to}:${connection.from}` === token
    );
  });
}

function revealConnected(mapState: MapState, zoneId: string): void {
  for (const connection of mapState.connections ?? []) {
    if (connection.discovered === false) continue;
    const next =
      connection.from === zoneId
        ? connection.to
        : connection.bidirectional !== false && connection.to === zoneId
          ? connection.from
          : null;
    if (next) mapState.revealedZones = addUnique(mapState.revealedZones, next);
  }
}

function markZoneStatuses(mapState: MapState, previous: string, next: string): void {
  for (const zone of mapState.zones ?? []) {
    if (zone.id === next) {
      zone.status = 'current';
    } else if (zone.id === previous && zone.status === 'current') {
      zone.status = 'visited';
    } else if (
      mapState.visitedZones.includes(zone.id) &&
      zone.status !== 'danger' &&
      zone.status !== 'safe' &&
      zone.status !== 'locked'
    ) {
      zone.status = 'visited';
    } else if (mapState.revealedZones.includes(zone.id) && zone.status === 'unexplored') {
      zone.status = 'revealed';
    }
  }
}

async function loadMap(command: string): Promise<{ state: GmState; mapState: MapState } | CommandResult> {
  const state = await tryLoadState();
  if (!state) return noState(command);
  const mapState = getMapState(state, command);
  if (isCommandResult(mapState)) return mapState;
  return { state, mapState };
}

async function handleEnter(args: string[]): Promise<CommandResult> {
  const zoneId = args[0];
  if (!zoneId) {
    return fail('No zone id provided.', 'Usage: tag map enter <zone-id>', 'map enter');
  }

  const loaded = await loadMap('map enter');
  if ('ok' in loaded) return loaded;
  const { state, mapState } = loaded;
  const zone = findZone(mapState, zoneId);
  if (!zone) {
    return fail(
      `Zone "${zoneId}" not found.`,
      'Check visible zones with: tag map inspect <zone-id> or tag state get mapState.zones',
      'map enter',
    );
  }
  if (!mapState.revealedZones.includes(zoneId) && zone.status === 'unexplored') {
    return fail(
      `Zone "${zoneId}" has not been revealed.`,
      'Reveal or discover it first: tag map reveal <zone-id>',
      'map enter',
    );
  }

  const previous = mapState.currentZone;
  if (zoneId !== previous) {
    const connection = findConnection(mapState, previous, zoneId);
    if (!connection || connection.discovered === false) {
      return fail(
        `No discovered route from "${previous}" to "${zoneId}".`,
        'Discover the route first: tag map discover <from> <to>',
        'map enter',
      );
    }
    if (connection.locked || connection.status === 'locked') {
      return fail(
        `Route to "${zoneId}" is locked.`,
        'Unlock it first: tag map unlock <connection-id-or-from-to>',
        'map enter',
      );
    }
  }

  mapState.currentZone = zoneId;
  mapState.visitedZones = addUnique(mapState.visitedZones, zoneId);
  mapState.revealedZones = addUnique(mapState.revealedZones, zoneId);
  revealConnected(mapState, zoneId);
  markZoneStatuses(mapState, previous, zoneId);
  mapState.travelLog = [...(mapState.travelLog ?? []), { from: previous, to: zoneId, scene: state.scene }];
  state.currentRoom = zoneId;
  state.visitedRooms = addUnique(state.visitedRooms, zoneId);

  // Trigger hazards
  const connection = findConnection(mapState, previous, zoneId);
  const triggeredHazards = [...(connection?.hazards ?? []), ...(zone.hazards ?? [])];
  for (const h of triggeredHazards) {
    state._pendingRolls = [
      ...(state._pendingRolls ?? []),
      {
        action: `${h.id}:${state.scene}`,
        type: 'hazard',
        stat: h.stat || 'DEX',
        dc: h.dc,
      },
    ];
  }

  // Trigger encounters
  let encounterTriggered = false;
  if (connection?.encounterChance && Math.random() < connection.encounterChance) {
    encounterTriggered = true;
    // Note: In a full implementation, this might add an encounter-type pending roll or NPC
  }

  recordHistory(state, 'map enter', 'mapState.currentZone', previous, zoneId);
  await saveState(state);

  return ok(
    {
      from: previous,
      to: zoneId,
      currentRoom: state.currentRoom,
      visitedZones: mapState.visitedZones,
      revealedZones: mapState.revealedZones,
      encounterTriggered,
      hazardCount: triggeredHazards.length,
    },
    'map enter',
  );
}

async function handleReveal(args: string[]): Promise<CommandResult> {
  const zoneId = args[0];
  if (!zoneId) return fail('No zone id provided.', 'Usage: tag map reveal <zone-id>', 'map reveal');

  const loaded = await loadMap('map reveal');
  if ('ok' in loaded) return loaded;
  const { state, mapState } = loaded;
  const zone = findZone(mapState, zoneId);
  if (!zone)
    return fail(`Zone "${zoneId}" not found.`, 'Check zone ids with: tag state get mapState.zones', 'map reveal');

  const oldRevealed = mapState.revealedZones.slice();
  mapState.revealedZones = addUnique(mapState.revealedZones, zoneId);
  if (zone.status === 'unexplored') zone.status = 'revealed';

  recordHistory(state, 'map reveal', 'mapState.revealedZones', oldRevealed, mapState.revealedZones);
  await saveState(state);
  return ok({ zoneId, revealedZones: mapState.revealedZones }, 'map reveal');
}

async function handleDiscover(args: string[]): Promise<CommandResult> {
  const from = args[0];
  const to = args[1];
  if (!from || !to) return fail('Missing route endpoints.', 'Usage: tag map discover <from> <to>', 'map discover');

  const loaded = await loadMap('map discover');
  if ('ok' in loaded) return loaded;
  const { state, mapState } = loaded;
  const connection = findConnection(mapState, from, to);
  if (!connection)
    return fail(
      `No route found between "${from}" and "${to}".`,
      'Check routes with: tag state get mapState.connections',
      'map discover',
    );
  if (!findZone(mapState, from) || !findZone(mapState, to)) {
    return fail(
      'Route endpoints must both be valid zones.',
      'Check zone ids with: tag state get mapState.zones',
      'map discover',
    );
  }

  const oldConnection = structuredClone(connection);
  connection.discovered = true;
  mapState.revealedZones = addUnique(mapState.revealedZones, from);
  mapState.revealedZones = addUnique(mapState.revealedZones, to);
  const toZone = findZone(mapState, to);
  if (toZone && toZone.status === 'unexplored') toZone.status = 'revealed';

  recordHistory(
    state,
    'map discover',
    `mapState.connections.${connection.id ?? `${from}-${to}`}.discovered`,
    oldConnection,
    connection,
  );
  await saveState(state);
  return ok({ from, to, discovered: true, revealedZones: mapState.revealedZones }, 'map discover');
}

async function handleUnlock(args: string[]): Promise<CommandResult> {
  const token = args[0];
  if (!token)
    return fail(
      'No route id provided.',
      'Usage: tag map unlock <connection-id> OR tag map unlock <from> <to>',
      'map unlock',
    );

  const loaded = await loadMap('map unlock');
  if ('ok' in loaded) return loaded;
  const { state, mapState } = loaded;
  const connection = args[1] ? findConnection(mapState, token, args[1]) : findConnectionByToken(mapState, token);
  if (!connection)
    return fail(
      `Route "${args[1] ? `${token} ${args[1]}` : token}" not found.`,
      'Check routes with: tag state get mapState.connections',
      'map unlock',
    );

  const oldConnection = structuredClone(connection);
  connection.locked = false;
  connection.status = 'open';
  connection.discovered = true;
  const key = `${connection.from}:${connection.to}`;
  const reverse = `${connection.to}:${connection.from}`;
  mapState.doorStates[key] = 'open';
  if (mapState.doorStates[reverse]) mapState.doorStates[reverse] = 'open';

  recordHistory(state, 'map unlock', `mapState.connections.${connection.id ?? key}`, oldConnection, connection);
  await saveState(state);
  return ok({ id: connection.id ?? key, from: connection.from, to: connection.to, status: 'open' }, 'map unlock');
}

async function handleInspect(args: string[]): Promise<CommandResult> {
  const zoneId = args[0];
  if (!zoneId) return fail('No zone id provided.', 'Usage: tag map inspect <zone-id>', 'map inspect');

  const loaded = await loadMap('map inspect');
  if ('ok' in loaded) return loaded;
  const { state, mapState } = loaded;
  const zone = findZone(mapState, zoneId);
  if (!zone)
    return fail(`Zone "${zoneId}" not found.`, 'Check zone ids with: tag state get mapState.zones', 'map inspect');

  const connections = (mapState.connections ?? []).filter(
    connection => connection.from === zoneId || connection.to === zoneId,
  );
  return ok(
    {
      zone,
      room: state.worldData?.rooms?.[zoneId] ?? null,
      connections,
      current: mapState.currentZone === zoneId,
    },
    'map inspect',
  );
}

async function handleRoute(args: string[]): Promise<CommandResult> {
  const from = args[0];
  const to = args[1];
  if (!from || !to) return fail('Missing route endpoints.', 'Usage: tag map route <from> <to>', 'map route');

  const loaded = await loadMap('map route');
  if ('ok' in loaded) return loaded;
  const { mapState } = loaded;
  return ok(planMapRoute(mapState, from, to), 'map route');
}

export async function handleMap(args: string[]): Promise<CommandResult> {
  const subcommand = args[0];
  if (!subcommand) {
    return fail(
      'No subcommand provided.',
      `Valid subcommands: ${VALID_SUBCOMMANDS.join(', ')}. Run: tag map --help`,
      'map',
    );
  }

  switch (subcommand) {
    case 'enter':
      return handleEnter(args.slice(1));
    case 'reveal':
      return handleReveal(args.slice(1));
    case 'discover':
      return handleDiscover(args.slice(1));
    case 'unlock':
      return handleUnlock(args.slice(1));
    case 'inspect':
      return handleInspect(args.slice(1));
    case 'route':
      return handleRoute(args.slice(1));
    default:
      return fail(`Unknown subcommand: "${subcommand}".`, `Valid subcommands: ${VALID_SUBCOMMANDS.join(', ')}`, 'map');
  }
}
