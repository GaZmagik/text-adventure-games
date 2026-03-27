#!/usr/bin/env bun
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { getTopLevelHelp, getCommandHelp } from './help';
import type { CommandResult } from './types';
import { VERSION } from './lib/version';
import { TOP_LEVEL_COMMANDS } from './metadata';
import { JOURNAL_FILENAME } from './commands/state/sync';

function checkCompactionPreflight(): { detected: boolean; message: string } | null {
  const transcriptsDir = process.env.TAG_TRANSCRIPTS_DIR || '/mnt/transcripts';
  const resolved = resolve(transcriptsDir);
  const home = homedir();
  const tmp = tmpdir();
  const homePrefix = home === '/' ? home : home + '/';
  const tmpPrefix = tmp === '/' ? tmp : tmp + '/';
  if (![homePrefix, tmpPrefix, '/mnt/'].some(p => resolved.startsWith(p))) return null;
  try {
    const entries = readdirSync(transcriptsDir);
    const count = entries.filter(e => e !== JOURNAL_FILENAME).length;

    // Load stored compaction count to avoid permanent alerts after recovery
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
      return {
        detected: true,
        message: `COMPACTION ALERT: ${newCompactions} new compaction${newCompactions > 1 ? 's' : ''} detected in /mnt/transcripts/. `
          + `Context may be lost. Run \`tag state sync --apply --scene ${currentScene}\` then \`tag state context\` and re-read all listed modules.`,
      };
    }
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      console.error(`Compaction check failed: ${code ?? 'unknown'} reading ${transcriptsDir}`);
    }
  }
  return null;
}

function output(result: CommandResult): void {
  const alert = checkCompactionPreflight();
  if (alert) {
    result._compactionAlert = alert;
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

  if (args.length === 0 || args[0] === '--help' || args[0] === 'help') {
    output(getTopLevelHelp());
    return;
  }

  if (args[0] === 'version' || args[0] === '--version') {
    output(version());
    return;
  }

  const command = args[0];

  if (args[1] === '--help') {
    output(getCommandHelp(command!));
    return;
  }

  let result: CommandResult;

  switch (command) {
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
    default:
      result = unknownCommand(command!);
  }

  output(result);
  if (!result.ok) process.exit(1);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  output({
    ok: false,
    command: 'tag',
    error: { message, corrective: 'Check command syntax: tag <command> [args]' },
  });
  process.exit(1);
});

// Signal handling (SIGTERM/SIGINT) intentionally omitted.
// All file writes use atomic tmp+rename (see state-store.ts saveState),
// so interruption during a write leaves state.json intact.
