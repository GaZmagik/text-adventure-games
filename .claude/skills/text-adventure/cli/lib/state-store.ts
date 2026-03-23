import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync } from 'fs';
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
  await Bun.write(getStatePath(), JSON.stringify(state, null, 2));
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
