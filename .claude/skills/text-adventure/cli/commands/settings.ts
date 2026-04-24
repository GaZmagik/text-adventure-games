// Settings command handlers mutate persistent player-facing preferences such as prose gate mode.
import type { CommandResult } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState, saveState } from '../lib/state-store';

const VALID_PROSE_MODES = ['llm', 'manual'] as const;
type ProseMode = (typeof VALID_PROSE_MODES)[number];

function isProseMode(v: string): v is ProseMode {
  return (VALID_PROSE_MODES as readonly string[]).includes(v);
}

export async function handleSettings(args: string[]): Promise<CommandResult> {
  const subcommand = args[0];

  if (!subcommand || subcommand !== 'prose') {
    return fail(
      subcommand ? `Unknown subcommand "${subcommand}".` : 'Missing subcommand.',
      'Usage: tag settings prose [llm|manual]',
      'settings',
    );
  }

  const state = await tryLoadState();
  if (!state) return noState('settings');

  const modeArg = args[1];

  // Read current mode (no mutation)
  if (!modeArg) {
    const currentMode = state.worldFlags.proseMode === 'llm' ? 'llm' : 'manual';
    return ok(
      {
        mode: currentMode,
        usage: 'tag settings prose [llm|manual]',
        message: `Current prose review mode: ${currentMode}.`,
      },
      'settings',
    );
  }

  if (!isProseMode(modeArg)) {
    return fail(`Unknown mode "${modeArg}".`, 'Use: llm or manual', 'settings');
  }

  // modeArg is now narrowed to ProseMode
  state.worldFlags.proseMode = modeArg;
  await saveState(state);

  const messages: Record<ProseMode, string> = {
    llm: 'Prose review mode set to LLM. Run tag prose-check <path> to generate a review command.',
    manual: 'Prose review mode set to manual. Run tag prose-check <path> for a self-review checklist.',
  };

  return ok({ mode: modeArg, message: messages[modeArg] }, 'settings');
}
