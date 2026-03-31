// tag CLI — State Codex Subcommand
// Manages lore codex entries: create, unlock, advance, secret, redact.

import type { CommandResult, CodexMutation } from '../../types';
import { ok, fail, noState } from '../../lib/errors';
import { tryLoadState, saveState } from '../../lib/state-store';
import { parseArgs } from '../../lib/args';
import { recordHistory } from './index';

const COMMAND = 'state codex';
const VALID_ACTIONS = ['create', 'unlock', 'advance', 'secret', 'redact'] as const;

// ── Helpers ─────────────────────────────────────────────────────────

function findEntry(mutations: CodexMutation[], id: string): CodexMutation | undefined {
  return mutations.find(e => e.id === id);
}

// ── Action handlers ─────────────────────────────────────────────────

async function handleCreate(args: string[]): Promise<CommandResult> {
  const id = args[0];
  if (!id) {
    return fail('No id provided.', 'Usage: tag state codex create <id> --title <title> [--category <cat>]', COMMAND);
  }

  const flags = parseArgs(args.slice(1), [], ['title', 'category']).flags;

  if (!flags.title) {
    return fail('Missing --title flag.', 'Usage: tag state codex create <id> --title <title>', COMMAND);
  }

  const state = await tryLoadState();
  if (!state) return noState();

  if (findEntry(state.codexMutations, id)) {
    return fail(`Codex entry "${id}" already exists.`, 'Use a different id or modify the existing entry.', COMMAND);
  }

  const entry: CodexMutation = {
    id,
    title: flags.title,
    category: flags.category ?? 'general',
    state: 'locked',
    secrets: [],
  };

  state.codexMutations.push(entry);
  recordHistory(state, 'state codex create', `codexMutations.${id}`, null, entry);
  await saveState(state);

  return ok(entry, COMMAND);
}

async function handleUnlock(args: string[]): Promise<CommandResult> {
  const id = args[0];
  if (!id) {
    return fail('No id provided.', 'Usage: tag state codex unlock <id> --method <m> --source <s>', COMMAND);
  }

  const flags = parseArgs(args.slice(1), [], ['method', 'source']).flags;

  if (!flags.method) {
    return fail('Missing --method flag.', 'Usage: tag state codex unlock <id> --method <m> [--source <s>]', COMMAND);
  }

  const state = await tryLoadState();
  if (!state) return noState();

  const entry = findEntry(state.codexMutations, id);
  if (!entry) {
    return fail(`Codex entry "${id}" not found.`, 'Create it first with: tag state codex create <id> --title <title>', COMMAND);
  }

  if (entry.state !== 'locked') {
    return fail(
      `Entry "${id}" is "${entry.state}", not "locked". Only locked entries can be unlocked.`,
      'Use "advance" to move from partial to discovered.',
      COMMAND,
    );
  }

  const oldState = entry.state;
  entry.state = 'partial';
  entry.discoveredAt = state.scene;
  entry.via = flags.source ? `${flags.method} — ${flags.source}` : flags.method;

  recordHistory(state, 'state codex unlock', `codexMutations.${id}.state`, oldState, entry.state);
  await saveState(state);

  return ok(entry, COMMAND);
}

async function handleAdvance(args: string[]): Promise<CommandResult> {
  const id = args[0];
  if (!id) {
    return fail('No id provided.', 'Usage: tag state codex advance <id> --method <m> --source <s>', COMMAND);
  }

  const flags = parseArgs(args.slice(1), [], ['method', 'source']).flags;

  if (!flags.method) {
    return fail('Missing --method flag.', 'Usage: tag state codex advance <id> --method <m> [--source <s>]', COMMAND);
  }

  const state = await tryLoadState();
  if (!state) return noState();

  const entry = findEntry(state.codexMutations, id);
  if (!entry) {
    return fail(`Codex entry "${id}" not found.`, 'Create it first with: tag state codex create <id> --title <title>', COMMAND);
  }

  if (entry.state !== 'partial') {
    return fail(
      `Entry "${id}" is "${entry.state}", not "partial". Only partial entries can be advanced.`,
      entry.state === 'locked' ? 'Unlock it first with: tag state codex unlock <id>' : '',
      COMMAND,
    );
  }

  const oldState = entry.state;
  entry.state = 'discovered';
  if (flags.source) {
    entry.via = `${flags.method} — ${flags.source}`;
  }

  recordHistory(state, 'state codex advance', `codexMutations.${id}.state`, oldState, entry.state);
  await saveState(state);

  return ok(entry, COMMAND);
}

async function handleSecret(args: string[]): Promise<CommandResult> {
  const id = args[0];
  if (!id) {
    return fail('No id provided.', 'Usage: tag state codex secret <id> --text <text>', COMMAND);
  }

  const flags = parseArgs(args.slice(1), [], ['text']).flags;

  if (!flags.text) {
    return fail('Missing --text flag.', 'Usage: tag state codex secret <id> --text "<secret text>"', COMMAND);
  }

  const state = await tryLoadState();
  if (!state) return noState();

  const entry = findEntry(state.codexMutations, id);
  if (!entry) {
    return fail(`Codex entry "${id}" not found.`, 'Create it first with: tag state codex create <id> --title <title>', COMMAND);
  }

  if (entry.state === 'redacted') {
    return fail(`Entry "${id}" is redacted. Cannot add secrets to a redacted entry.`, '', COMMAND);
  }

  if (!entry.secrets) entry.secrets = [];
  entry.secrets.push(flags.text);

  recordHistory(state, 'state codex secret', `codexMutations.${id}.secrets`, null, flags.text);
  await saveState(state);

  return ok(entry, COMMAND);
}

async function handleRedact(args: string[]): Promise<CommandResult> {
  const id = args[0];
  if (!id) {
    return fail('No id provided.', 'Usage: tag state codex redact <id> --reason <reason>', COMMAND);
  }

  const flags = parseArgs(args.slice(1), [], ['reason']).flags;

  if (!flags.reason) {
    return fail('Missing --reason flag.', 'Usage: tag state codex redact <id> --reason "<reason>"', COMMAND);
  }

  const state = await tryLoadState();
  if (!state) return noState();

  const entry = findEntry(state.codexMutations, id);
  if (!entry) {
    return fail(`Codex entry "${id}" not found.`, 'Create it first with: tag state codex create <id> --title <title>', COMMAND);
  }

  if (entry.state === 'redacted') {
    return fail(`Entry "${id}" is already redacted.`, '', COMMAND);
  }

  const oldState = entry.state;
  entry.state = 'redacted';

  recordHistory(state, 'state codex redact', `codexMutations.${id}.state`, oldState, 'redacted');
  await saveState(state);

  return ok(entry, COMMAND);
}

// ── Main handler ────────────────────────────────────────────────────

export async function handleCodex(args: string[]): Promise<CommandResult> {
  const action = args[0];

  if (!action) {
    return fail(
      'No action provided.',
      `Valid actions: ${VALID_ACTIONS.join(', ')}. Usage: tag state codex <action> <id> [flags]`,
      COMMAND,
    );
  }

  switch (action) {
    case 'create':  return handleCreate(args.slice(1));
    case 'unlock':  return handleUnlock(args.slice(1));
    case 'advance': return handleAdvance(args.slice(1));
    case 'secret':  return handleSecret(args.slice(1));
    case 'redact':  return handleRedact(args.slice(1));
    default:
      return fail(
        `Unknown codex action: "${action}".`,
        `Valid actions: ${VALID_ACTIONS.join(', ')}`,
        COMMAND,
      );
  }
}
