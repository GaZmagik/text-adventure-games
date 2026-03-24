import { join, resolve } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { mkdirSync, existsSync, renameSync, writeFileSync, unlinkSync } from 'node:fs';
import type { GmState } from '../types';
import { MAX_ROLL_HISTORY } from './constants';

function getStateDir(): string {
  const dir = process.env.TAG_STATE_DIR || join(homedir(), '.tag');
  const resolved = resolve(dir);
  const home = homedir();
  const tmp = tmpdir();
  const homePrefix = home === '/' ? home : home + '/';
  const tmpPrefix = tmp === '/' ? tmp : tmp + '/';
  if (!resolved.startsWith(homePrefix) && !resolved.startsWith(tmpPrefix)) {
    throw new Error(`TAG_STATE_DIR must be within home or temp directory, got: ${resolved}`);
  }
  return resolved;
}
export function getStatePath(): string {
  return join(getStateDir(), 'state.json');
}

export async function loadState(): Promise<GmState> {
  const path = getStatePath();
  const file = Bun.file(path);
  if (!(await file.exists())) {
    throw new Error(`State file not found at ${path}`);
  }
  return file.json() as Promise<GmState>;
}

export async function saveState(state: GmState): Promise<void> {
  const dir = getStateDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  // Deep copy — don't mutate the caller's object or share nested references
  const toSave = structuredClone(state);
  if (toSave.rollHistory && toSave.rollHistory.length > MAX_ROLL_HISTORY) {
    toSave.rollHistory = toSave.rollHistory.slice(-MAX_ROLL_HISTORY);
  }
  // Sync write + rename ensures atomicity — Bun.write is async with no fsync guarantee
  const path = join(dir, 'state.json');
  const tmpPath = path + '.tmp';
  try {
    writeFileSync(tmpPath, JSON.stringify(toSave), 'utf-8');
    renameSync(tmpPath, path);
  } catch (err) {
    try { unlinkSync(tmpPath); } catch { /* best-effort cleanup */ }
    throw err;
  }
}

export async function tryLoadState(): Promise<GmState | null> {
  try {
    const file = Bun.file(getStatePath());
    if (!(await file.exists())) return null;
    return await file.json() as GmState;
  } catch {
    return null;
  }
}

export function createDefaultState(): GmState {
  return {
    _version: 1,
    scene: 0,
    currentRoom: '',
    visitedRooms: [],
    rollHistory: [],
    character: null,
    worldFlags: {},
    seed: Math.random().toString(36).slice(2),
    modulesActive: [],
    rosterMutations: [],
    codexMutations: [],
    time: {
      period: 'morning',
      date: 'Day 1',
      elapsed: 0,
      hour: 8,
      playerKnowsDate: false,
      playerKnowsTime: false,
      calendarSystem: 'elapsed-only',
      deadline: null,
    },
    factions: {},
    quests: [],
    _stateHistory: [],
  };
}
