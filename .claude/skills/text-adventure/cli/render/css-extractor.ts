// Extracts CSS from a style .md file.
// Prefers blocks marked with /* @extract */ — if any exist, ONLY those are used.
// Falls back to extracting ALL blocks when no marked blocks are found.
// This prevents documentation CSS examples from being duplicated alongside
// the Complete CSS Block that already contains everything.

// ── CSS sanitisation — single-pass combined regex + replacer ─────────

const CSS_SANITISE_RE = new RegExp(
  [
    '<\\/style',                                                    // </style breakout
    '@import\\s+(?:url\\s*\\([^)]*\\)|"[^"]*"|\'[^\']*\')\\s*;?', // @import directives
    'url\\s*\\(\\s*([\'"]?)\\w+:',                                 // url(proto:…)
    'url\\s*\\(\\s*([\'"]?)//',                                    // url(//…)
    'expression\\s*\\(',                                            // IE expression()
    '-moz-binding\\s*:',                                            // -moz-binding
  ].join('|'),
  'gi',
);

function cssReplacer(match: string): string {
  const lower = match.toLowerCase();
  if (lower.startsWith('</style'))       return '<\\/style';
  if (lower.startsWith('@import'))       return '/* @import stripped */';
  if (lower.startsWith('expression'))    return '/* expression blocked */(';
  if (lower.startsWith('-moz-binding'))  return '/* binding blocked */:';
  // url() variants — preserve the opening quote character from the match
  if (lower.startsWith('url')) {
    const quoteMatch = match.match(/url\s*\(\s*(['"]?)/i);
    const quote = quoteMatch?.[1] ?? '';
    return match.includes('//') ? `url(${quote}/*blocked*/` : `url(${quote}/*blocked*/:`;
  }
  return match;
}

// Cache is process-scoped — fine for single CLI invocations. Does not invalidate on file change.
const cssCache = new Map<string, string>();

export async function extractAllCss(filePath: string, scopes?: readonly string[]): Promise<string> {
  const cacheKey = filePath + ':' + (scopes?.join(',') ?? '*');
  if (cssCache.has(cacheKey)) return cssCache.get(cacheKey) ?? '';
  try {
    const file = Bun.file(filePath);
    if (!(await file.exists())) return '';

    const content = await file.text();
    const markedBlocks: string[] = [];
    const allBlocks: string[] = [];

    const regex = /```css\s*\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const block = match[1]!.trim();
      allBlocks.push(block);

      const scopeMatch = block.match(/^\/\* @extract(?::([\w-]+))? \*\//);
      if (scopeMatch) {
        const scope = scopeMatch[1] ?? null; // null = unlabelled
        // When scopes filter is active: include unlabelled, 'shared', or matching scopes
        if (!scopes || scope === null || scope === 'shared' || scopes.includes(scope)) {
          markedBlocks.push(block);
        }
      }
    }

    // Prefer marked blocks — avoids duplicating documentation examples
    const result = (markedBlocks.length > 0 ? markedBlocks : allBlocks).join('\n\n');
    // Sanitise CSS: single-pass replacement for </style, @import, external url(), expression(), -moz-binding
    const sanitised = result.replace(CSS_SANITISE_RE, cssReplacer);
    // Only cache non-empty results — avoids masking files that gain CSS later
    if (sanitised) cssCache.set(cacheKey, sanitised);
    return sanitised;
  } catch {
    return '';
  }
}

export async function extractCssVars(filePath: string): Promise<Record<string, string>> {
  const css = await extractAllCss(filePath);
  const vars: Record<string, string> = {};

  const regex = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(css)) !== null) {
    const key = match[1]!.trim();
    const value = match[2]!.replace(/\/\*.*?\*\//g, '').trim();
    vars[key] = value;
  }

  return vars;
}
