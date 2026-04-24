// Style activation returns the active theme contract and stamps style freshness into state.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { CommandResult } from '../types';
import { ok, fail, noState } from '../lib/errors';
import { tryLoadState, saveState } from '../lib/state-store';
import { parseArgs } from '../lib/args';
import { extractCompactContract } from '../lib/contracts';

const STYLES_DIR = join(import.meta.dir, '..', '..', 'styles');
const STYLE_REFERENCE = 'style-reference.md';

export async function handleStyle(args: string[]): Promise<CommandResult> {
  const parsed = parseArgs(args, ['full']);
  const subcommand = parsed.positional[0];
  const full = parsed.booleans.has('full');
  if (!subcommand) {
    return fail('Missing subcommand.', 'Usage: tag style activate [--full]', 'style');
  }
  if (subcommand !== 'activate') {
    return fail(`Unknown subcommand "${subcommand}".`, 'Available: activate', 'style');
  }

  const state = await tryLoadState();
  if (!state) return noState();

  const styleName = state.visualStyle;
  if (!styleName) {
    return fail(
      'No visual style set in state.',
      'Set a visual style first via `tag setup apply` or `tag state set visualStyle <name>`.',
      'style',
    );
  }

  const knownStyles = listStyles();
  if (!knownStyles.includes(styleName)) {
    return fail(`Unknown style: "${styleName}".`, `Available styles: ${knownStyles.join(', ')}`, 'style');
  }

  const stylePath = join(STYLES_DIR, `${styleName}.md`);
  const referencePath = join(STYLES_DIR, STYLE_REFERENCE);
  if (!existsSync(referencePath)) {
    return fail(
      `Style reference not found: styles/${STYLE_REFERENCE}`,
      'The style-reference.md file is required for structural patterns.',
      'style',
    );
  }

  const styleContent = await Bun.file(stylePath).text();
  const referenceContent = await Bun.file(referencePath).text();

  state._styleReadEpoch = state._compactionCount ?? 0;
  await saveState(state);

  return ok(
    {
      style: styleName,
      stylePath,
      referencePath,
      styleChars: styleContent.length,
      referenceChars: referenceContent.length,
      styleContract: extractCompactContract(styleName, 'style', styleContent),
      referenceContract: extractCompactContract(
        STYLE_REFERENCE.replace(/\.md$/, ''),
        'style-reference',
        referenceContent,
      ),
      compact: !full,
      freshnessEpoch: state._styleReadEpoch,
      instruction: full
        ? `Full style markdown is included in data.styleContent and data.referenceContent. To re-read from disk, use 'cat ${stylePath}' and 'cat ${referencePath}'.`
        : `Compact style contracts returned. Use 'tag style activate --full' or cat ${stylePath} and ${referencePath} for full guidance.`,
      ...(full ? { styleContent, referenceContent } : {}),
    },
    'style',
  );
}

function listStyles(): string[] {
  try {
    return readdirSync(STYLES_DIR)
      .filter(f => f.endsWith('.md') && f !== STYLE_REFERENCE)
      .map(f => f.replace(/\.md$/, ''));
  } catch {
    return [];
  }
}
