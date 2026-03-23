import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync, renameSync } from 'fs';
import type { GmState } from '../types';

function getStateDir(): string {
  return process.env.TAG_STATE_DIR || join(homedir(), '.tag');
}
export function getStatePath(): string {
  return join(getStateDir(), 'state.json');
}

export async function stateExists(): Promise<boolean> {
  const file = Bun.file(getStatePath());
  return file.exists();
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
  // Cap unbounded arrays to prevent state bloat
  if (state._stateHistory && state._stateHistory.length > 100) {
    state._stateHistory = state._stateHistory.slice(-100);
  }
  if (state.rollHistory && state.rollHistory.length > 50) {
    state.rollHistory = state.rollHistory.slice(-50);
  }
  const path = getStatePath();
  const tmpPath = path + '.tmp';
  await Bun.write(tmpPath, JSON.stringify(state));
  renameSync(tmpPath, path);
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
