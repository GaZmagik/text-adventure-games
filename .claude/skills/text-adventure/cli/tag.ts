#!/usr/bin/env bun
import { getTopLevelHelp, getCommandHelp } from './help';
import type { CommandResult } from './types';
import { VERSION } from './lib/version';

function output(result: CommandResult): void {
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
      corrective: 'Valid commands: state, compute, render, save, batch, rules, quest. Run: tag --help',
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
