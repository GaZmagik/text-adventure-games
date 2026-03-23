import type { CommandResult } from '../types';
import { fail } from '../lib/errors';

export async function handleSave(args: string[]): Promise<CommandResult> {
  return fail('Not yet implemented.', 'tag --help', 'save');
}
