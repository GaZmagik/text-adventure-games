// tag CLI — State Ship Subcommand
// Manages ship state: init, damage, repair, power, condition, parts.

import type { CommandResult, ShipState } from '../../types';
import { ok, fail, noState } from '../../lib/errors';
import { tryLoadState, saveState } from '../../lib/state-store';
import { parseArgs } from '../../lib/args';
import { recordHistory } from './index';
import { DEFAULT_SHIP_SYSTEMS } from '../../lib/constants';

const COMMAND = 'state ship';
const VALID_ACTIONS = ['init', 'damage', 'repair', 'power', 'condition', 'parts'] as const;

// ── Helpers ─────────────────────────────────────────────────────────

function integrityToStatus(integrity: number): string {
  if (integrity > 75) return 'operational';
  if (integrity > 50) return 'degraded';
  if (integrity > 25) return 'critical';
  if (integrity > 0) return 'failing';
  return 'offline';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function requireShip(ship: ShipState | undefined): ship is ShipState {
  return ship !== undefined && ship !== null;
}

function parsePositiveAmount(rawAmount: string): number | null {
  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

// ── Action handlers ─────────────────────────────────────────────────

async function handleInit(args: string[]): Promise<CommandResult> {
  const flags = parseArgs(args, [], ['name']).flags;

  if (!flags.name) {
    return fail('Missing --name flag.', 'Usage: tag state ship init --name <name>', COMMAND);
  }

  const state = await tryLoadState();
  if (!state) return noState();

  if (requireShip(state.shipState)) {
    return fail('Ship already initialised.', 'Use damage/repair/power to modify the existing ship.', COMMAND);
  }

  const systems: ShipState['systems'] = {};
  const powerAllocations: Record<string, number> = {};

  for (const sys of DEFAULT_SHIP_SYSTEMS) {
    systems[sys] = { integrity: 100, status: 'operational', conditions: [] };
    powerAllocations[sys] = Math.round(100 / DEFAULT_SHIP_SYSTEMS.length);
  }

  state.shipState = {
    name: flags.name,
    systems,
    powerAllocations,
    repairParts: 10,
    scenesSinceRepair: 0,
  };

  recordHistory(state, 'state ship init', 'shipState', null, state.shipState);
  await saveState(state);

  return ok(state.shipState, COMMAND);
}

async function handleDamage(args: string[]): Promise<CommandResult> {
  const systemId = args[0];
  if (!systemId) {
    return fail('No system id provided.', 'Usage: tag state ship damage <systemId> <amount>', COMMAND);
  }

  const rawAmount = args[1];
  if (!rawAmount) {
    return fail('No amount provided.', 'Usage: tag state ship damage <systemId> <amount>', COMMAND);
  }

  const amount = parsePositiveAmount(rawAmount);
  if (amount === null) {
    return fail(`"${rawAmount}" is not a valid positive amount.`, 'Provide a positive number greater than 0.', COMMAND);
  }

  const state = await tryLoadState();
  if (!state) return noState();

  if (!requireShip(state.shipState)) {
    return fail('Ship not initialised.', 'Run: tag state ship init --name <name>', COMMAND);
  }

  const system = state.shipState.systems[systemId];
  if (!system) {
    return fail(
      `Unknown system "${systemId}".`,
      `Valid systems: ${Object.keys(state.shipState.systems).join(', ')}`,
      COMMAND,
    );
  }

  const oldIntegrity = system.integrity;
  system.integrity = clamp(system.integrity - amount, 0, 100);
  system.status = integrityToStatus(system.integrity);

  recordHistory(state, 'state ship damage', `shipState.systems.${systemId}.integrity`, oldIntegrity, system.integrity);
  await saveState(state);

  return ok({ systemId, oldIntegrity, newIntegrity: system.integrity, status: system.status }, COMMAND);
}

async function handleRepair(args: string[]): Promise<CommandResult> {
  const systemId = args[0];
  if (!systemId) {
    return fail('No system id provided.', 'Usage: tag state ship repair <systemId> <amount>', COMMAND);
  }

  const rawAmount = args[1];
  if (!rawAmount) {
    return fail('No amount provided.', 'Usage: tag state ship repair <systemId> <amount>', COMMAND);
  }

  const amount = parsePositiveAmount(rawAmount);
  if (amount === null) {
    return fail(`"${rawAmount}" is not a valid positive amount.`, 'Provide a positive number greater than 0.', COMMAND);
  }

  const state = await tryLoadState();
  if (!state) return noState();

  if (!requireShip(state.shipState)) {
    return fail('Ship not initialised.', 'Run: tag state ship init --name <name>', COMMAND);
  }

  const system = state.shipState.systems[systemId];
  if (!system) {
    return fail(
      `Unknown system "${systemId}".`,
      `Valid systems: ${Object.keys(state.shipState.systems).join(', ')}`,
      COMMAND,
    );
  }

  const oldIntegrity = system.integrity;
  system.integrity = clamp(system.integrity + amount, 0, 100);
  system.status = integrityToStatus(system.integrity);
  state.shipState.scenesSinceRepair = 0;

  recordHistory(state, 'state ship repair', `shipState.systems.${systemId}.integrity`, oldIntegrity, system.integrity);
  await saveState(state);

  return ok({ systemId, oldIntegrity, newIntegrity: system.integrity, status: system.status }, COMMAND);
}

async function handlePower(args: string[]): Promise<CommandResult> {
  const fromId = args[0];
  const toId = args[1];
  const rawUnits = args[2];

  if (!fromId || !toId) {
    return fail('Missing system ids.', 'Usage: tag state ship power <from> <to> <units>', COMMAND);
  }

  if (!rawUnits) {
    return fail('No units provided.', 'Usage: tag state ship power <from> <to> <units>', COMMAND);
  }

  const units = parsePositiveAmount(rawUnits);
  if (units === null) {
    return fail(`"${rawUnits}" is not a valid positive amount.`, 'Provide a positive number greater than 0.', COMMAND);
  }

  const state = await tryLoadState();
  if (!state) return noState();

  if (!requireShip(state.shipState)) {
    return fail('Ship not initialised.', 'Run: tag state ship init --name <name>', COMMAND);
  }

  if (!(fromId in state.shipState.systems)) {
    return fail(
      `Unknown system "${fromId}".`,
      `Valid systems: ${Object.keys(state.shipState.systems).join(', ')}`,
      COMMAND,
    );
  }

  if (!(toId in state.shipState.systems)) {
    return fail(
      `Unknown system "${toId}".`,
      `Valid systems: ${Object.keys(state.shipState.systems).join(', ')}`,
      COMMAND,
    );
  }

  const fromPower = state.shipState.powerAllocations[fromId] ?? 0;
  if (fromPower < units) {
    return fail(
      `Insufficient power in "${fromId}". Has ${fromPower}, needs ${units}.`,
      'Reduce the units or reallocate from another system.',
      COMMAND,
    );
  }

  state.shipState.powerAllocations[fromId] = fromPower - units;
  state.shipState.powerAllocations[toId] = (state.shipState.powerAllocations[toId] ?? 0) + units;

  recordHistory(state, 'state ship power', `shipState.powerAllocations`, { from: fromId, to: toId }, units);
  await saveState(state);

  return ok(
    {
      from: fromId,
      to: toId,
      units,
      fromPower: state.shipState.powerAllocations[fromId],
      toPower: state.shipState.powerAllocations[toId],
    },
    COMMAND,
  );
}

async function handleCondition(args: string[]): Promise<CommandResult> {
  const operation = args[0];
  const systemId = args[1];
  const conditionName = args[2];

  if (!operation || (operation !== 'add' && operation !== 'remove')) {
    return fail(
      `Invalid operation "${operation ?? '(none)'}".`,
      'Usage: tag state ship condition <add|remove> <systemId> <name>',
      COMMAND,
    );
  }

  if (!systemId) {
    return fail('No system id provided.', 'Usage: tag state ship condition <add|remove> <systemId> <name>', COMMAND);
  }

  if (!conditionName) {
    return fail(
      'No condition name provided.',
      'Usage: tag state ship condition <add|remove> <systemId> <name>',
      COMMAND,
    );
  }

  const state = await tryLoadState();
  if (!state) return noState();

  if (!requireShip(state.shipState)) {
    return fail('Ship not initialised.', 'Run: tag state ship init --name <name>', COMMAND);
  }

  const system = state.shipState.systems[systemId];
  if (!system) {
    return fail(
      `Unknown system "${systemId}".`,
      `Valid systems: ${Object.keys(state.shipState.systems).join(', ')}`,
      COMMAND,
    );
  }

  if (operation === 'add') {
    if (!system.conditions.includes(conditionName)) {
      system.conditions.push(conditionName);
    }
  } else {
    const idx = system.conditions.indexOf(conditionName);
    if (idx === -1) {
      return fail(
        `Condition "${conditionName}" not found on system "${systemId}".`,
        `Current conditions: ${system.conditions.length > 0 ? system.conditions.join(', ') : 'none'}`,
        COMMAND,
      );
    }
    system.conditions.splice(idx, 1);
  }

  recordHistory(
    state,
    `state ship condition ${operation}`,
    `shipState.systems.${systemId}.conditions`,
    null,
    conditionName,
  );
  await saveState(state);

  return ok({ systemId, operation, condition: conditionName, conditions: system.conditions }, COMMAND);
}

async function handleParts(args: string[]): Promise<CommandResult> {
  const rawAmount = args[0];
  if (!rawAmount) {
    return fail('No amount provided.', 'Usage: tag state ship parts <+/-amount>', COMMAND);
  }

  const amount = Number(rawAmount);
  if (Number.isNaN(amount)) {
    return fail(`"${rawAmount}" is not a valid numeric amount.`, 'Provide a signed number like +5 or -3.', COMMAND);
  }

  const state = await tryLoadState();
  if (!state) return noState();

  if (!requireShip(state.shipState)) {
    return fail('Ship not initialised.', 'Run: tag state ship init --name <name>', COMMAND);
  }

  const oldParts = state.shipState.repairParts;
  state.shipState.repairParts = Math.max(0, state.shipState.repairParts + amount);

  recordHistory(state, 'state ship parts', 'shipState.repairParts', oldParts, state.shipState.repairParts);
  await saveState(state);

  return ok({ oldParts, newParts: state.shipState.repairParts }, COMMAND);
}

// ── Main handler ────────────────────────────────────────────────────

export async function handleShip(args: string[]): Promise<CommandResult> {
  const action = args[0];

  if (!action) {
    return fail(
      'No action provided.',
      `Valid actions: ${VALID_ACTIONS.join(', ')}. Usage: tag state ship <action> [flags]`,
      COMMAND,
    );
  }

  switch (action) {
    case 'init':
      return handleInit(args.slice(1));
    case 'damage':
      return handleDamage(args.slice(1));
    case 'repair':
      return handleRepair(args.slice(1));
    case 'power':
      return handlePower(args.slice(1));
    case 'condition':
      return handleCondition(args.slice(1));
    case 'parts':
      return handleParts(args.slice(1));
    default:
      return fail(`Unknown ship action: "${action}".`, `Valid actions: ${VALID_ACTIONS.join(', ')}`, COMMAND);
  }
}
