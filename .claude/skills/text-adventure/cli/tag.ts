#!/usr/bin/env bun
import { getTopLevelHelp, getCommandHelp } from './help';
import type { CommandResult } from './types';

const VERSION = '1.3.0';

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
      stateDir: process.env.TAG_STATE_DIR || '~/.tag',
    },
  };
}

function unknownCommand(cmd: string): CommandResult {
  return {
    ok: false,
    command: cmd,
    error: {
      message: `Unknown command: ${cmd}`,
      corrective: 'Valid commands: state, compute, render, save, batch, rules. Run: tag --help',
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
    output(getCommandHelp(command));
    return;
  }

  switch (command) {
    case 'state': {
      const { handleState } = await import('./commands/state');
      output(await handleState(args.slice(1)));
      break;
    }
    case 'compute': {
      const { handleCompute } = await import('./commands/compute');
      output(await handleCompute(args.slice(1)));
      break;
    }
    case 'render': {
      const { handleRender } = await import('./commands/render');
      output(await handleRender(args.slice(1)));
      break;
    }
    case 'save': {
      const { handleSave } = await import('./commands/save');
      output(await handleSave(args.slice(1)));
      break;
    }
    case 'batch': {
      const { handleBatch } = await import('./commands/batch');
      output(await handleBatch(args.slice(1)));
      break;
    }
    case 'rules': {
      const { handleRules } = await import('./commands/rules');
      output(await handleRules(args.slice(1)));
      break;
    }
    default:
      output(unknownCommand(command));
  }
}

main().catch((err: Error) => {
  output({
    ok: false,
    command: 'tag',
    error: { message: err.message, corrective: 'Run: tag --help' },
  });
  process.exit(1);
});
