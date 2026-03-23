import type { CommandResult } from '../types';
import { fail } from '../lib/errors';

export async function handleCompute(args: string[]): Promise<CommandResult> {
  return fail('Not yet implemented.', 'tag --help', 'compute');
}
