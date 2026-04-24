import { describe, expect, test } from 'bun:test';
import { createDefaultState } from './state-store';
import { generateWorld } from './worldgen';
import { applyWorldSeedPayload, buildWorldSeedPayload, worldToMapState } from './map-adapter';
import { validateState } from './validator';

describe('worldToMapState', () => {
  test('converts generated rooms into rich zones and connections', () => {
    const world = generateWorld('adapter-test', 'space');
    const mapState = worldToMapState(world);

    expect(mapState.currentZone).toBe(world.startRoom);
    expect(mapState.visitedZones).toContain(world.startRoom);
    expect(mapState.revealedZones).toContain(world.startRoom);
    expect(mapState.zones).toHaveLength(Object.keys(world.rooms).length);
    expect(mapState.connections!.length).toBeGreaterThan(0);

    const startZone = mapState.zones!.find(zone => zone.id === world.startRoom)!;
    expect(startZone.status).toBe('current');
    expect(startZone.description).toBe(world.rooms[world.startRoom]!.description);
  });

  test('reveals the start room and its immediate exits only', () => {
    const world = generateWorld('visibility-test', 'dungeon');
    const mapState = worldToMapState(world);
    const expected = new Set([world.startRoom, ...world.rooms[world.startRoom]!.exits]);

    for (const zoneId of mapState.revealedZones) {
      expect(expected.has(zoneId)).toBe(true);
    }
  });
});

describe('applyWorldSeedPayload', () => {
  test('writes generated world, map, roster, codex, factions, and quests into state', () => {
    const state = createDefaultState();
    const world = generateWorld('apply-test', 'horror');
    const payload = buildWorldSeedPayload(world);

    applyWorldSeedPayload(state, payload);

    expect(state.worldData?.seed).toBe('apply-test');
    expect(state.mapState?.currentZone).toBe(world.startRoom);
    expect(state.currentRoom).toBe(world.startRoom);
    expect(state.rosterMutations.length).toBe(world.roster.length);
    expect(state.codexMutations.some(entry => entry.via === 'worldgen')).toBe(true);
    expect(state.quests.some(quest => quest.id === 'world_main')).toBe(true);
    expect(validateState(state).valid).toBe(true);
  });
});
