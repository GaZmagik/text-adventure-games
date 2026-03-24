import { join, resolve } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { mkdirSync, renameSync, writeFileSync, unlinkSync } from 'node:fs';
import type { GmState } from '../types';
import { MAX_ROLL_HISTORY } from './constants';

function getStateDir(): string {
  const dir = process.env.TAG_STATE_DIR || join(homedir(), '.tag');
  const resolved = resolve(dir);
  const home = homedir();
  const tmp = tmpdir();
  if (home === '/') {
    throw new Error('TAG_STATE_DIR validation requires a non-root home directory.');
  }
  const homePrefix = home + '/';
  const tmpPrefix = tmp === '/' ? tmp : tmp + '/';
  if (!resolved.startsWith(homePrefix) && !resolved.startsWith(tmpPrefix)) {
    throw new Error('TAG_STATE_DIR must be within the home or temp directory.');
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
    throw new Error('State file not found. Run "tag state init" to create one.');
  }
  if (file.size > 10 * 1024 * 1024) throw new Error('State file exceeds 10 MB — possible corruption.');
  return file.json() as Promise<GmState>;
}

// async signature retained for caller compatibility — the body intentionally uses
// synchronous writeFileSync + renameSync for atomic rename semantics (Bun.write is
// async with no fsync guarantee, so sync I/O is the deliberate choice here).
export async function saveState(state: GmState): Promise<void> {
  const dir = getStateDir();
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  // Deep copy — don't mutate the caller's object or share nested references
  const toSave = structuredClone(state);
  if (toSave.rollHistory && toSave.rollHistory.length > MAX_ROLL_HISTORY) {
    toSave.rollHistory = toSave.rollHistory.slice(-MAX_ROLL_HISTORY);
  }
  // Sync write + rename ensures atomicity — Bun.write is async with no fsync guarantee
  const path = join(dir, 'state.json');
  const tmpPath = path + '.tmp';
  try {
    writeFileSync(tmpPath, JSON.stringify(toSave), { encoding: 'utf-8', mode: 0o600 });
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
    if (file.size > 10 * 1024 * 1024) throw new Error('State file exceeds 10 MB — possible corruption.');
    return await file.json() as GmState;
  } catch (err: unknown) {
    if (err instanceof SyntaxError) {
      console.error('Warning: state.json is corrupted and could not be parsed.');
      return null;
    }
    if (err && typeof err === 'object' && 'code' in err
        && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw err; // EACCES and other unexpected errors should surface
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
    seed: randomUUID().replace(/-/g, '').slice(0, 12),
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
