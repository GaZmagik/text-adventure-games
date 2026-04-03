import { join, resolve } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { mkdirSync, renameSync, writeFileSync, unlinkSync } from 'node:fs';
import type { GmState } from '../types';
import { MAX_ROLL_HISTORY, MAX_FILE_SIZE_BYTES, SCHEMA_VERSION } from './constants';
import { validateState } from './validator';

type StateStoreContext = {
  state: GmState | null | undefined;
  dirty: boolean;
  virtualWrites: number;
  diskWrites: number;
};

type StateStoreContextStats = {
  dirty: boolean;
  virtualWrites: number;
  diskWrites: number;
};

let activeStateStoreContext: StateStoreContext | null = null;

export const STATE_STORE_RUNTIME = {
  homedir,
  tmpdir,
  mkdirSync,
  renameSync,
  writeFileSync,
  unlinkSync,
};

/** Lightweight runtime check that a parsed JSON value has the basic shape of a GmState object. */
function isPlausibleGmState(raw: unknown): raw is Record<string, unknown> {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw);
}

function getStateDir(): string {
  const dir = process.env.TAG_STATE_DIR || join(STATE_STORE_RUNTIME.homedir(), '.tag');
  const resolved = resolve(dir);
  const home = STATE_STORE_RUNTIME.homedir();
  const tmp = STATE_STORE_RUNTIME.tmpdir();
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
export function getSyncMarkerPath(): string {
  return join(getStateDir(), '.last-sync');
}

function cloneState(state: GmState | null): GmState | null {
  return state ? structuredClone(state) : null;
}

async function loadStateFromDisk(): Promise<GmState> {
  const path = getStatePath();
  const file = Bun.file(path);
  if (!(await file.exists())) {
    throw new Error('State file not found. Run "tag state reset" to create one.');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) throw new Error('State file exceeds 10 MB — possible corruption.');
  const raw: unknown = await file.json();
  if (!isPlausibleGmState(raw)) {
    throw new Error('State file does not contain a valid object.');
  }
  const validation = validateState(raw);
  if (!validation.valid) {
    throw new Error(`State file is structurally invalid: ${validation.errors.join('; ')}`);
  }
  return raw as GmState;
}

async function tryLoadStateFromDisk(): Promise<Record<string, unknown> | null> {
  try {
    const file = Bun.file(getStatePath());
    if (!(await file.exists())) return null;
    if (file.size > MAX_FILE_SIZE_BYTES) throw new Error('State file exceeds 10 MB — possible corruption.');
    const raw: unknown = await file.json();
    if (!isPlausibleGmState(raw)) return null;
    return raw;
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

function saveStateToDisk(state: GmState): void {
  const dir = getStateDir();
  STATE_STORE_RUNTIME.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const toSave = structuredClone(state);
  if (toSave.rollHistory && toSave.rollHistory.length > MAX_ROLL_HISTORY) {
    toSave.rollHistory = toSave.rollHistory.slice(-MAX_ROLL_HISTORY);
  }
  const path = join(dir, 'state.json');
  const tmpPath = path + '.tmp';
  try {
    STATE_STORE_RUNTIME.writeFileSync(tmpPath, JSON.stringify(toSave), { encoding: 'utf-8', mode: 0o600 });
    STATE_STORE_RUNTIME.renameSync(tmpPath, path);
  } catch (err) {
    try { STATE_STORE_RUNTIME.unlinkSync(tmpPath); } catch { /* best-effort cleanup */ }
    throw err;
  }
}

export async function withStateStoreContext<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; stats: StateStoreContextStats }> {
  if (activeStateStoreContext) {
    throw new Error('Nested state-store contexts are not supported.');
  }

  activeStateStoreContext = {
    state: undefined,
    dirty: false,
    virtualWrites: 0,
    diskWrites: 0,
  };

  try {
    const result = await fn();
    return {
      result,
      stats: {
        dirty: activeStateStoreContext.dirty,
        virtualWrites: activeStateStoreContext.virtualWrites,
        diskWrites: activeStateStoreContext.diskWrites,
      },
    };
  } finally {
    if (activeStateStoreContext?.dirty) {
      console.error(
        'Warning: state-store context dropped with unsaved changes '
        + `(${activeStateStoreContext.virtualWrites} virtual write(s), `
        + `${activeStateStoreContext.diskWrites} disk write(s)). `
        + 'State may have been lost due to an unexpected exception.',
      );
    }
    activeStateStoreContext = null;
  }
}

export async function flushStateStoreContext(): Promise<GmState | null> {
  if (!activeStateStoreContext) {
    throw new Error('No active state-store context to flush.');
  }
  if (activeStateStoreContext.dirty && activeStateStoreContext.state) {
    saveStateToDisk(activeStateStoreContext.state);
    activeStateStoreContext.diskWrites += 1;
    activeStateStoreContext.dirty = false;
  }
  return cloneState(activeStateStoreContext.state ?? null);
}

/** @internal — test-only; prefer tryLoadState() in production code */
export async function loadState(): Promise<GmState> {
  if (activeStateStoreContext) {
    if (activeStateStoreContext.state === undefined) {
      activeStateStoreContext.state = await loadStateFromDisk();
    }
    if (!activeStateStoreContext.state) throw new Error('State file not found. Run "tag state reset" to create one.');
    return cloneState(activeStateStoreContext.state)!;
  }
  return loadStateFromDisk();
}

// async signature retained for caller compatibility — the body intentionally uses
// synchronous writeFileSync + renameSync for atomic rename semantics (Bun.write is
// async with no fsync guarantee, so sync I/O is the deliberate choice here).
export async function saveState(state: GmState): Promise<void> {
  if (activeStateStoreContext) {
    const validation = validateState(state);
    if (!validation.valid) {
      throw new Error(`State is structurally invalid: ${validation.errors.join('; ')}`);
    }
    activeStateStoreContext.state = structuredClone(state);
    activeStateStoreContext.dirty = true;
    activeStateStoreContext.virtualWrites += 1;
    return;
  }
  saveStateToDisk(state);
}

// tryLoadState returns GmState | null. The underlying tryLoadStateFromDisk returns
// Record<string, unknown> | null, so we validate and warn but still return the state.
// Commands that mutate state run validateState at their own level before persisting.
// Returning even invalid state is intentional — commands like `state validate`,
// `save generate`, and `export generate` need to inspect and strip/fix the state.
export async function tryLoadState(): Promise<GmState | null> {
  if (activeStateStoreContext) {
    if (activeStateStoreContext.state === undefined) {
      const raw = await tryLoadStateFromDisk();
      if (raw !== null) {
        const validation = validateState(raw);
        if (!validation.valid) {
          console.error(`Warning: state.json failed validation: ${validation.errors.join('; ')}`);
        }
        activeStateStoreContext.state = raw as GmState;
      } else {
        activeStateStoreContext.state = null;
      }
    }
    return cloneState(activeStateStoreContext.state ?? null);
  }
  const raw = await tryLoadStateFromDisk();
  if (raw === null) return null;
  const validation = validateState(raw);
  if (!validation.valid) {
    console.error(`Warning: state.json failed validation: ${validation.errors.join('; ')}`);
  }
  return raw as GmState;
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
    prologueComplete: false,
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
    _schemaVersion: SCHEMA_VERSION,
  };
}
