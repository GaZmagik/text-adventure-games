import { describe, expect, test } from 'bun:test';
import { generateWorld } from './worldgen';

describe('generateWorld', () => {
  test('is deterministic for the same seed and theme', () => {
    const a = generateWorld('iron-harbor-42', 'space');
    const b = generateWorld('iron-harbor-42', 'space');
    expect(a).toEqual(b);
  });

  test('different seeds produce different room layouts', () => {
    const a = generateWorld('iron-harbor-42', 'dungeon');
    const b = generateWorld('iron-harbor-43', 'dungeon');
    expect(Object.keys(a.rooms)).not.toEqual(Object.keys(b.rooms));
  });

  test('creates valid room, faction, roster, and hook references', () => {
    const world = generateWorld('estate-test', 'horror');
    const roomIds = new Set(Object.keys(world.rooms));
    const factionIds = new Set(world.factions.factions.map(f => f.id));

    expect(roomIds.has(world.startRoom)).toBe(true);
    expect(roomIds.has(world.bossRoom)).toBe(true);
    expect(world.factions.factions.length).toBeGreaterThanOrEqual(2);
    expect(world.roster.length).toBeGreaterThan(0);
    expect(world.hooks.main.length).toBeGreaterThan(20);

    for (const room of Object.values(world.rooms)) {
      expect(room.id).toBeTruthy();
      expect(room.exits.length).toBeGreaterThan(0);
      for (const exit of room.exits) expect(roomIds.has(exit)).toBe(true);
      if (room.controllingFaction) expect(factionIds.has(room.controllingFaction)).toBe(true);
    }

    for (const npc of world.roster) {
      expect(roomIds.has(npc.currentRoom)).toBe(true);
      expect(factionIds.has(npc.faction)).toBe(true);
    }
  });
});
