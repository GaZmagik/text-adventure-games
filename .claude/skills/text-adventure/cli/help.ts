import type { CommandResult } from './types';
import { ok } from './lib/errors';
import { COMMAND_HELP, WIDGET_TYPE_NAMES } from './metadata';


export function getTopLevelHelp(): CommandResult {
  return ok({
    commands: Object.values(COMMAND_HELP).map(c => ({
      command: c.command,
      description: c.description,
    })),
    widgetTypes: WIDGET_TYPE_NAMES,
    usage: 'tag <command> [subcommand] [options]',
    examples: [
      'tag state reset',
      'tag compute contest CHA merchant_01',
      'tag render scene --style terminal',
      'tag save generate',
    ],
  }, 'help');
}

export function getCommandHelp(command: string): CommandResult {
  const help = COMMAND_HELP[command as keyof typeof COMMAND_HELP];
  if (!help) {
    return {
      ok: false,
      command: 'help',
      error: {
        message: `Unknown command: ${command}`,
        corrective: `Valid commands: ${Object.keys(COMMAND_HELP).join(', ')}`,
      },
    };
  }
  return ok(help, 'help');
}
