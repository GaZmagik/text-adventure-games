import { describe, test, expect } from 'bun:test';
import { loadNames } from './names';

describe('names loader', () => {
  test('loads all four sections', () => {
    const names = loadNames();
    expect(names.realWorldGiven.length).toBeGreaterThan(30);
    expect(names.realWorldSurname.length).toBeGreaterThan(20);
    expect(names.sciFiGiven.length).toBeGreaterThan(30);
    expect(names.sciFiSurname.length).toBeGreaterThan(20);
  });

  test('no empty strings in any pool', () => {
    const names = loadNames();
    const pools = [names.realWorldGiven, names.realWorldSurname, names.sciFiGiven, names.sciFiSurname];
    for (const pool of pools) {
      for (const name of pool) {
        expect(name.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('no duplicates within a single pool', () => {
    const names = loadNames();
    const pools = [names.realWorldGiven, names.realWorldSurname, names.sciFiGiven, names.sciFiSurname];
    for (const pool of pools) {
      const unique = new Set(pool);
      expect(unique.size).toBe(pool.length);
    }
  });

  test('getRandomName returns a full name string', () => {
    const names = loadNames();
    const name = names.getRandomName('fantasy');
    expect(name).toContain(' ');
    const parts = name.split(' ');
    expect(parts.length).toBe(2);
  });

  test('sci-fi theme picks from sci-fi pool', () => {
    const names = loadNames();
    const sciFiSet = new Set([...names.sciFiGiven, ...names.sciFiSurname]);
    // Run 20 times — at least one part should come from sci-fi pool
    let foundSciFi = false;
    for (let i = 0; i < 20; i++) {
      const parts = names.getRandomName('sci-fi').split(' ');
      if (sciFiSet.has(parts[0]!) || sciFiSet.has(parts[1]!)) foundSciFi = true;
    }
    expect(foundSciFi).toBe(true);
  });

  test('fantasy theme picks from real-world pool', () => {
    const names = loadNames();
    const realSet = new Set([...names.realWorldGiven, ...names.realWorldSurname]);
    let foundReal = false;
    for (let i = 0; i < 20; i++) {
      const parts = names.getRandomName('fantasy').split(' ');
      if (realSet.has(parts[0]!) || realSet.has(parts[1]!)) foundReal = true;
    }
    expect(foundReal).toBe(true);
  });

  test('reuses the parsed name pool across repeated calls', () => {
    const first = loadNames();
    const second = loadNames();
    expect(second).toBe(first);
  });
});
