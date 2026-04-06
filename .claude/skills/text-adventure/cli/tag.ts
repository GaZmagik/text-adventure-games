#!/usr/bin/env bun
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';
import { getTopLevelHelp, getCommandHelp } from './help';
import type { CommandResult } from './types';
import { VERSION } from './lib/version';
import { TOP_LEVEL_COMMANDS } from './metadata';
import { JOURNAL_FILENAME } from './commands/state/sync';
import { isAllowedPath } from './lib/path-security';
import { isCompactionBlocked, writeCompactionBlock } from './lib/workflow-markers';

// Only render is hard-blocked during compaction — it produces degraded
// player-facing output without module specs. All other commands pass through
// so the GM can diagnose state, run recovery steps, and reload modules.
const COMPACTION_HARD_BLOCKED = new Set(['render']);

type CompactionAlert = {
  detected: boolean;
  recovered: boolean;
  message: string;
  modulesRequired?: string[];
};

async function checkCompactionPreflight(): Promise<CompactionAlert | null> {
  const transcriptsDir = process.env.TAG_TRANSCRIPTS_DIR || '/mnt/transcripts';
  const resolved = resolve(transcriptsDir);
  const home = homedir();
  if (!isAllowedPath(resolved)) return null;
  try {
    const entries = readdirSync(transcriptsDir);
    const count = entries.filter(e => e !== JOURNAL_FILENAME).length;

    let storedCount = 0;
    let currentScene = 0;
    try {
      const stateDir = process.env.TAG_STATE_DIR || join(home, '.tag');
      const raw = JSON.parse(readFileSync(join(stateDir, 'state.json'), 'utf-8'));
      if (typeof raw?._compactionCount === 'number') storedCount = raw._compactionCount;
      if (typeof raw?.scene === 'number') currentScene = raw.scene;
    } catch { /* no state file — storedCount stays 0 */ }

    const newCompactions = count - storedCount;
    if (newCompactions > 0) {
      // Auto-recover: run sync --apply --scene <current> to update _compactionCount
      let recovered = false;
      let modulesRequired: string[] | undefined;
      try {
        const { handleSync } = await import('./commands/state/sync');
        const syncResult = await handleSync(['--apply', '--scene', String(currentScene)]);
        recovered = syncResult.ok;

        // Get module list from context
        const { handleState } = await import('./commands/state');
        const ctxResult = await handleState(['context']);
        if (ctxResult.ok && ctxResult.data) {
          const ctxData = ctxResult.data as Record<string, unknown>;
          if (Array.isArray(ctxData.required)) {
            modulesRequired = (ctxData.required as unknown[]).filter((x): x is string => typeof x === 'string');
          }
        }
      } catch { /* recovery failed — fall back to warning */ }

      const moduleList = modulesRequired?.join(', ') ?? '(run `tag state context` for list)';
      const reason = `COMPACTION DETECTED — ${newCompactions} new compaction${newCompactions > 1 ? 's' : ''}. `
        + `Module specs evicted from context. Run \`tag compact restore\` to reload lore and modules.`;
      writeCompactionBlock(reason);
      return {
        detected: true,
        recovered,
        message: reason,
        ...(modulesRequired ? { modulesRequired } : {}),
      };
    }
  } catch (err: unknown) {
    const code = err && typeof err === 'object' && 'code' in err
      ? (err as NodeJS.ErrnoException).code
      : undefined;
    if (code !== 'ENOENT') {
      console.error(`Compaction check failed: ${code ?? 'unknown'} reading ${transcriptsDir}`);
    }
  }
  return null;
}

async function output(result: CommandResult, skipCompaction = false): Promise<void> {
  if (!skipCompaction) {
    const alert = await checkCompactionPreflight();
    if (alert) {
      result._compactionAlert = alert;
    }
  }
  console.log(JSON.stringify(result));
}

function version(): CommandResult {
  return {
    ok: true,
    command: 'version',
    data: {
      tag: VERSION,
      skill: VERSION,
      stateDir: process.env.TAG_STATE_DIR ? '(custom)' : '~/.tag',
    },
  };
}

function unknownCommand(cmd: string): CommandResult {
  return {
    ok: false,
    command: cmd,
    error: {
      message: `Unknown command: ${cmd}`,
      corrective: `Valid commands: ${TOP_LEVEL_COMMANDS.join(', ')}. Run: tag --help`,
    },
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    await output(getTopLevelHelp(), true);
    return;
  }

  if (args[0] === 'version' || args[0] === '--version') {
    await output(version());
    return;
  }

  const command = args[0];

  if (args[1] === '--help') {
    await output(getCommandHelp(command!), true);
    return;
  }

  // Compaction block gate — only render is hard-blocked (produces degraded
  // player-facing output without module specs). All other commands pass
  // through so the GM can run diagnostics, recovery steps, and module reloads.
  if (COMPACTION_HARD_BLOCKED.has(command!) && isCompactionBlocked()) {
    await output({
      ok: false,
      command: command!,
      error: {
        message: 'BLOCKED — compaction detected. Rendering is suspended until module specs are restored.',
        corrective: 'Run `tag compact restore` then `tag batch --commands "<recoveryBatch from restore output>"` to reload modules, then resume.',
      },
    }, true);
    process.exit(1);
    return;
  }

  let result: CommandResult;

  switch (command) {
    case 'module': {
      const { handleModule } = await import('./commands/module');
      result = await handleModule(args.slice(1));
      break;
    }
    case 'help': {
      const { handleHelp } = await import('./commands/help');
      result = await handleHelp(args.slice(1));
      break;
    }
    case 'state': {
      const { handleState } = await import('./commands/state');
      result = await handleState(args.slice(1));
      break;
    }
    case 'compute': {
      const { handleCompute } = await import('./commands/compute');
      result = await handleCompute(args.slice(1));
      break;
    }
    case 'render': {
      const { handleRender } = await import('./commands/render');
      result = await handleRender(args.slice(1));
      break;
    }
    case 'save': {
      const { handleSave } = await import('./commands/save');
      result = await handleSave(args.slice(1));
      break;
    }
    case 'batch': {
      const { handleBatch } = await import('./commands/batch');
      result = await handleBatch(args.slice(1));
      break;
    }
    case 'rules': {
      const { handleRules } = await import('./commands/rules');
      result = await handleRules(args.slice(1));
      break;
    }
    case 'quest': {
      const { handleQuest } = await import('./commands/quest');
      result = await handleQuest(args.slice(1));
      break;
    }
    case 'export': {
      const { handleExport } = await import('./commands/export');
      result = await handleExport(args.slice(1));
      break;
    }
    case 'verify': {
      const { handleVerify } = await import('./commands/verify');
      result = await handleVerify(args.slice(1));
      break;
    }
    case 'build-css': {
      const { handleBuildCss } = await import('./commands/build-css');
      result = await handleBuildCss(args.slice(1));
      break;
    }
    case 'setup': {
      const { handleSetup } = await import('./commands/setup');
      result = await handleSetup(args.slice(1));
      break;
    }
    case 'style': {
      const { handleStyle } = await import('./commands/style');
      result = await handleStyle(args.slice(1));
      break;
    }
    case 'scenario': {
      const { handleScenario } = await import('./commands/scenario');
      result = await handleScenario(args.slice(1));
      break;
    }
    case 'lore': {
      const { handleLore } = await import('./commands/lore');
      result = await handleLore(args.slice(1));
      break;
    }
    case 'compact': {
      const { handleCompact } = await import('./commands/compact');
      result = await handleCompact(args.slice(1));
      break;
    }
    case 'settings': {
      const { handleSettings } = await import('./commands/settings');
      result = await handleSettings(args.slice(1));
      break;
    }
    case 'prose-check': {
      const { handleProseCheck } = await import('./commands/prose-check');
      result = await handleProseCheck(args.slice(1));
      break;
    }
    case 'prose-gate': {
      const { handleProseGate } = await import('./commands/prose-gate');
      result = await handleProseGate(args.slice(1));
      break;
    }
    default:
      result = unknownCommand(command!);
  }

  await output(result, command === 'compact');
  if (!result.ok) process.exit(1);
}

main().catch(async (err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  await output({
    ok: false,
    command: 'tag',
    error: { message, corrective: 'Check command syntax: tag <command> [args]' },
  });
  process.exit(1);
});

// Signal handling (SIGTERM/SIGINT) intentionally omitted.
// All file writes use atomic tmp+rename (see state-store.ts saveState),
// so interruption during a write leaves state.json intact.
