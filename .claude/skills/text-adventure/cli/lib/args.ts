// Unified argument parser for all CLI commands.
// Handles positional args, --key value flags, and boolean flags.
//
// Flags not in booleanFlags ALWAYS consume the next token as their value.
// Flags in booleanFlags never consume a value — they set a boolean.
// A non-boolean flag at the end of args with no value is treated as boolean.
//
// multiWordFlags: flags whose values may span multiple shell-split tokens
// (e.g. --name "Maren Dray" arrives as ['--name', 'Maren', 'Dray']).
// When a multiWordFlag's initial value token is followed by additional
// non-flag tokens, they are joined with spaces.

type ParsedArgs = {
  positional: string[];
  flags: Record<string, string>;
  booleans: Set<string>;
};

export function parseArgs(
  args: string[],
  booleanFlags?: string[],
  multiWordFlags?: string[],
): ParsedArgs {
  const boolSet = new Set(booleanFlags ?? []);
  const multiWordSet = new Set(multiWordFlags ?? []);
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  const booleans = new Set<string>();

  let i = 0;
  while (i < args.length) {
    const arg = args[i]!;
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
          const next = args[i + 1]!;
          // For multi-word-aware flags: if the next token is a flag prefix,
          // treat this flag as boolean (it has no value).
          if (multiWordSet.size > 0 && next.startsWith('--')) {
            booleans.add(key);
            i++;
          } else {
            // Consume the immediate next token as the value
            const parts: string[] = [next];
            i += 2;
            // For multi-word flags, greedily consume subsequent non-flag tokens
            if (multiWordSet.has(key)) {
              while (i < args.length && !args[i]!.startsWith('--')) {
                parts.push(args[i]!);
                i++;
              }
            }
            flags[key] = parts.join(' ');
          }
        } else {
          // Trailing flag without value is treated as boolean true (e.g. --verbose)
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
