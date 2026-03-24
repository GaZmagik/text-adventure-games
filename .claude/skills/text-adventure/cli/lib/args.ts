// Unified argument parser for all CLI commands.
// Handles positional args, --key value flags, and boolean flags.
//
// Flags not in booleanFlags ALWAYS consume the next token as their value.
// Flags in booleanFlags never consume a value — they set a boolean.
// A non-boolean flag at the end of args with no value is treated as boolean.

export type ParsedArgs = {
  positional: string[];
  flags: Record<string, string>;
  booleans: Set<string>;
};

export function parseArgs(args: string[], booleanFlags?: string[]): ParsedArgs {
  const boolSet = new Set(booleanFlags ?? []);
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  const booleans = new Set<string>();

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      // Support --key=value syntax
      const eqIdx = arg.indexOf('=');
      if (eqIdx > 2) {
        flags[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1);
        i++;
      } else {
        const key = arg.slice(2);
        if (boolSet.has(key)) {
          booleans.add(key);
          i++;
        } else if (i + 1 < args.length) {
          flags[key] = args[i + 1];
          i += 2;
        } else {
          // Trailing flag without value is treated as boolean true (e.g. --verbose)
          // This is intentional for boolean flags but may surprise users who forget a value.
          booleans.add(key);
          i++;
        }
      }
    } else {
      positional.push(arg);
      i++;
    }
  }

  return { positional, flags, booleans };
}
