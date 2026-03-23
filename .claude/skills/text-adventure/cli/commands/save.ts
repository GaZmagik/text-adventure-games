import type { CommandResult } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { loadState, saveState, stateExists, createDefaultState } from '../lib/state-store';
import { attachChecksum, validateAndDecode } from '../lib/fnv32';

async function resolveSaveString(input: string): Promise<string> {
  if (input.startsWith('/') || input.startsWith('./') || input.endsWith('.md') || input.endsWith('.save')) {
    try {
      const file = Bun.file(input);
      const content = await file.text();
      const match = content.match(/```[\s\S]*?([\da-fA-F]{8}\.SF[12]:[\S]+)[\s\S]*?```/);
      if (match) return match[1];
      const lineMatch = content.match(/([\da-fA-F]{8}\.SF[12]:[\S]+)/);
      if (lineMatch) return lineMatch[1];
      return content.trim();
    } catch {
      return input;
    }
  }
  return input;
}

async function generate(): Promise<CommandResult> {
  if (!(await stateExists())) return noState();

  const state = await loadState();

  // Build payload — full state, SF2: uncompressed base64 (no LZ)
  const payload = {
    v: 1,
    mode: 'full',
    _version: state._version,
    scene: state.scene,
    currentRoom: state.currentRoom,
    visitedRooms: state.visitedRooms,
    character: state.character,
    worldFlags: state.worldFlags,
    seed: state.seed,
    theme: state.theme,
    visualStyle: state.visualStyle,
    modulesActive: state.modulesActive,
    rosterMutations: state.rosterMutations,
    codexMutations: state.codexMutations,
    time: state.time,
    factions: state.factions,
    quests: state.quests,
    storyArchitect: state.storyArchitect ?? null,
    shipState: state.shipState ?? null,
    crewMutations: state.crewMutations ?? null,
    mapState: state.mapState ?? null,
    systemResources: state.systemResources ?? null,
    navPlottedCourse: state.navPlottedCourse ?? null,
    arc: state.arc ?? 1,
    arcType: state.arcType ?? 'standard',
    carryForward: state.carryForward ?? null,
    arcHistory: state.arcHistory ?? [],
    rollHistory: state.rollHistory,
  };

  const json = JSON.stringify(payload);
  const code = 'SF2:' + btoa(json);
  const saveString = attachChecksum(code);

  return ok({
    saveString,
    mode: 'full',
    format: 'SF2',
    characterName: state.character?.name ?? null,
    scene: state.scene,
    byteLength: saveString.length,
  }, 'save generate');
}

async function load(args: string[]): Promise<CommandResult> {
  if (args.length < 1) {
    return fail(
      'Usage: tag save load <file.save.md | save-string>',
      'tag save load /path/to/game.save.md',
      'save load',
    );
  }

  const saveString = await resolveSaveString(args[0]);

  const decoded = validateAndDecode(saveString);

  if (!decoded.valid) {
    return fail(
      `Save validation failed: ${decoded.error}`,
      'Check the save string for corruption or truncation.',
      'save load',
    );
  }

  const payload = decoded.payload;

  // Rebuild GmState from payload
  const state = createDefaultState();
  state._version = (payload._version as number) ?? 1;
  state.scene = (payload.scene as number) ?? 0;
  state.currentRoom = (payload.currentRoom as string) ?? '';
  state.visitedRooms = (payload.visitedRooms as string[]) ?? [];
  state.character = (payload.character as typeof state.character) ?? null;
  state.worldFlags = (payload.worldFlags as typeof state.worldFlags) ?? {};
  state.seed = payload.seed as string | undefined;
  state.theme = payload.theme as string | undefined;
  state.visualStyle = payload.visualStyle as string | undefined;
  state.modulesActive = (payload.modulesActive as string[]) ?? [];
  state.rosterMutations = (payload.rosterMutations as typeof state.rosterMutations) ?? [];
  state.codexMutations = (payload.codexMutations as typeof state.codexMutations) ?? [];
  state.time = (payload.time as typeof state.time) ?? state.time;
  state.factions = (payload.factions as typeof state.factions) ?? {};
  state.quests = (payload.quests as typeof state.quests) ?? [];
  state.rollHistory = (payload.rollHistory as typeof state.rollHistory) ?? [];

  if (payload.storyArchitect) state.storyArchitect = payload.storyArchitect as typeof state.storyArchitect;
  if (payload.shipState) state.shipState = payload.shipState as typeof state.shipState;
  if (payload.crewMutations) state.crewMutations = payload.crewMutations as typeof state.crewMutations;
  if (payload.mapState) state.mapState = payload.mapState as typeof state.mapState;
  if (payload.systemResources !== undefined) state.systemResources = payload.systemResources as typeof state.systemResources;
  if (payload.navPlottedCourse !== undefined) state.navPlottedCourse = payload.navPlottedCourse as typeof state.navPlottedCourse;
  if (payload.arc) state.arc = payload.arc as number;
  if (payload.arcType) state.arcType = payload.arcType as typeof state.arcType;
  if (payload.carryForward !== undefined) state.carryForward = payload.carryForward as typeof state.carryForward;
  if (payload.arcHistory) state.arcHistory = payload.arcHistory as typeof state.arcHistory;

  await saveState(state);

  return ok({
    message: 'Save loaded successfully.',
    mode: decoded.mode,
    scene: state.scene,
    characterName: state.character?.name ?? null,
  }, 'save load');
}

async function validate(args: string[]): Promise<CommandResult> {
  if (args.length < 1) {
    return fail('Usage: tag save validate <save-string>', 'tag save validate <checksummed-string>', 'save validate');
  }

  const saveString = await resolveSaveString(args[0]);
  const decoded = validateAndDecode(saveString);
  return ok({
    valid: decoded.valid,
    mode: decoded.mode ?? null,
    error: decoded.error ?? null,
    scene: decoded.valid ? decoded.payload!.scene : null,
    characterName: decoded.valid && decoded.payload!.character
      ? (decoded.payload!.character as Record<string, unknown>).name
      : null,
  }, 'save validate');
}

export async function handleSave(args: string[]): Promise<CommandResult> {
  const sub = args[0];
  switch (sub) {
    case 'generate': return generate();
    case 'load': return load(args.slice(1));
    case 'validate': return validate(args.slice(1));
    case 'migrate':
      return fail(
        'Save migration is not yet required — only format version 1 exists.',
        'tag save validate <save-string>',
        'save migrate',
      );
    default:
      return fail(
        `Unknown save subcommand: ${sub ?? '(none)'}. Available: generate, load, validate, migrate`,
        'tag save generate',
        'save',
      );
  }
}
