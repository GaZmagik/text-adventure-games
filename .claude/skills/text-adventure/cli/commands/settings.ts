import type { CommandResult } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState, saveState } from '../lib/state-store';

const VALID_PROSE_MODES = ['llm', 'manual'] as const;
type ProseMode = typeof VALID_PROSE_MODES[number];

export async function handleSettings(args: string[]): Promise<CommandResult> {
  const subcommand = args[0];

  if (!subcommand || subcommand !== 'prose') {
    return fail(
      subcommand ? `Unknown subcommand "${subcommand}".` : 'Missing subcommand.',
      'Usage: tag settings prose [llm|manual]',
      'settings',
    );
  }

  const modeArg = args[1];

  // Read current mode (no mutation)
  if (!modeArg) {
    const state = await tryLoadState();
    if (!state) return noState('settings');
    const currentMode = state.worldFlags.proseMode === 'llm' ? 'llm' : 'manual';
    return ok({
      mode: currentMode,
      usage: 'tag settings prose [llm|manual]',
      message: `Current prose review mode: ${currentMode}.`,
    }, 'settings');
  }

  // Validate mode
  if (!(VALID_PROSE_MODES as readonly string[]).includes(modeArg)) {
    return fail(
      `Unknown mode "${modeArg}".`,
      'Use: llm or manual',
      'settings',
    );
  }

  const mode = modeArg as ProseMode;

  const state = await tryLoadState();
  if (!state) return noState('settings');

  state.worldFlags.proseMode = mode;
  await saveState(state);

  const messages: Record<ProseMode, string> = {
    llm: 'Prose review mode set to LLM. Run tag prose-check <path> to generate a review command.',
    manual: 'Prose review mode set to manual. Run tag prose-check <path> for a self-review checklist.',
  };

  return ok({ mode, message: messages[mode] }, 'settings');
}
