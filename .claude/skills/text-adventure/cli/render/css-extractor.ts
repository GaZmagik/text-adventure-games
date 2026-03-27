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
  if (lower.startsWith('url')) { const quoteMatch = match.match(/url\s*\(\s*(['"]?)/i); const quote = quoteMatch?.[1] ?? ''; return match.includes('//') ? `url(${quote}/*blocked*/` : `url(${quote}/*blocked*/:`; }
  return match;
}

// Cache is process-scoped — fine for single CLI invocations. Does not invalidate on file change.
const cssCache = new Map<string, string>();

export async function extractAllCss(filePath: string, scopes?: readonly string[]): Promise<string> {
  const cacheKey = filePath + ':' + (scopes ? [...scopes].sort().join(',') : '*');
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

      const scopeMatch = block.match(/^\/\* @extract(?::([\w-]+(?::[\w-]+)*))? \*\//);
      if (scopeMatch) {
        const scope = scopeMatch[1] ?? null; // null = unlabelled
        // When scopes filter is active: include unlabelled, 'shared', or matching scopes
        // Hierarchical matching: requesting 'atmosphere' matches 'atmosphere:dust' etc.
        if (!scopes || scope === null || scope === 'shared'
            || scopes.includes(scope)
            || (scope !== null && scopes.some(s => scope.startsWith(s + ':')))) {
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

// ── Selector-based CSS filtering (tree-shaking) ─────────────────────

export type FilterResult = {
  css: string;
  included: string[];
  excluded: string[];
};

/**
 * Filter raw CSS to only include rules matching the given selectors.
 * Uses brace-counting tokenisation — zero npm dependencies.
 *
 * Matching rules:
 * - `.action-card` matches `.action-card`, `.action-card:hover`, `.action-card-num`
 * - `:root` blocks always included (CSS custom properties)
 * - `@keyframes name` included when `@keyframes name` is in selectors
 * - `@media` blocks: recurse into content, include wrapper if any inner rules match
 * - `@media (prefers-color-scheme: light)` with `:root` always included
 * - `@media (prefers-reduced-motion` included when registered
 */
export function filterCssBySelectors(
  css: string,
  selectors: readonly string[],
): FilterResult {
  if (!css.trim()) return { css: '', included: [], excluded: [...selectors] };

  const matched = new Set<string>();
  const output: string[] = [];

  const blocks = tokeniseTopLevel(css);
  for (const block of blocks) {
    if (block.type === 'at-rule') {
      const nameLower = block.name.toLowerCase().trim();

      // @keyframes — include if name registered
      if (nameLower.startsWith('@keyframes')) {
        if (selectors.some(s => s.startsWith('@keyframes') && nameLower.includes(s.slice(11).trim()))) {
          output.push(block.raw);
          const kfSel = selectors.find(s => s.startsWith('@keyframes') && nameLower.includes(s.slice(11).trim()));
          if (kfSel) matched.add(kfSel);
        }
        continue;
      }

      // @media — recurse into content
      if (nameLower.startsWith('@media')) {
        // Always include prefers-color-scheme: light with :root
        if (nameLower.includes('prefers-color-scheme') && block.body.includes(':root')) {
          output.push(block.raw);
          continue;
        }
        // @media (prefers-reduced-motion): filter inner rules, don't dump entire block
        const reducedMotionSel = selectors.find(s => s.startsWith('@media (prefers-reduced-motion'));
        if (nameLower.includes('prefers-reduced-motion') && reducedMotionSel) {
          const innerFiltered = filterMediaContent(block.body, selectors, matched);
          if (innerFiltered.trim()) {
            output.push(`${block.name} {\n${innerFiltered}\n}`);
            matched.add(reducedMotionSel);
          }
          continue;
        }
        // Recurse: filter inner rules
        const innerFiltered = filterMediaContent(block.body, selectors, matched);
        if (innerFiltered.trim()) {
          output.push(`${block.name} {\n${innerFiltered}\n}`);
        }
        continue;
      }

      // Other at-rules — pass through
      output.push(block.raw);
      continue;
    }

    // Regular rule — check selector match
    const sel = block.selector.trim();

    // :root always included
    if (sel === ':root') {
      output.push(block.raw);
      continue;
    }

    if (selectorMatchesAny(sel, selectors, matched)) {
      output.push(block.raw);
    }
  }

  const included = [...matched];
  const excluded = selectors.filter(s => !matched.has(s));
  return { css: output.join('\n'), included, excluded };
}

type CssBlock =
  | { type: 'rule'; selector: string; body: string; raw: string }
  | { type: 'at-rule'; name: string; body: string; raw: string };

/** Split CSS into top-level blocks using brace-depth counting. */
function tokeniseTopLevel(css: string): CssBlock[] {
  const blocks: CssBlock[] = [];
  let depth = 0;
  let blockStart = 0;
  let braceStart = -1;

  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') {
      if (depth === 0) braceStart = i;
      depth++;
    } else if (css[i] === '}') {
      depth--;
      if (depth === 0 && braceStart >= 0) {
        const pre = css.slice(blockStart, braceStart).trim();
        const body = css.slice(braceStart + 1, i).trim();
        const raw = css.slice(blockStart, i + 1).trimStart();

        if (pre.startsWith('@')) {
          blocks.push({ type: 'at-rule', name: pre, body, raw });
        } else {
          blocks.push({ type: 'rule', selector: pre, body, raw });
        }
        blockStart = i + 1;
      }
    }
  }
  return blocks;
}

/** Check if a CSS selector matches any registered selector.
 *  Splits on descendant/child combinators so `.pip` doesn't match `.enemy-card .pip`. */
function selectorMatchesAny(
  selector: string,
  targets: readonly string[],
  matched: Set<string>,
): boolean {
  const parts = selector.split(',').map(s => s.trim());
  for (const part of parts) {
    // Split on combinators (space, >, +, ~) to get individual segments
    const segments = part.split(/[\s>+~]+/).map(s => s.trim()).filter(Boolean);
    // Only match on the FIRST segment — descendant rules (.enemy-card .pip)
    // are dead weight if the ancestor isn't in the widget
    const first = segments[0];
    if (!first) continue;
    for (const target of targets) {
      if (target.startsWith('.') || target.startsWith('#')) {
        if (first.startsWith(target)) {
          matched.add(target);
          return true;
        }
      } else if (target.startsWith('[') || target.startsWith('button')) {
        if (first.includes(target)) {
          matched.add(target);
          return true;
        }
      }
    }
  }
  return false;
}

/** Filter CSS rules inside a @media block. */
function filterMediaContent(
  body: string,
  selectors: readonly string[],
  matched: Set<string>,
): string {
  const innerBlocks = tokeniseTopLevel(body);
  const kept: string[] = [];
  for (const block of innerBlocks) {
    if (block.type === 'rule') {
      const sel = block.selector.trim();
      if (sel === ':root' || selectorMatchesAny(sel, selectors, matched)) {
        kept.push(block.raw);
      }
    } else {
      // Nested at-rules inside media (rare but possible)
      kept.push(block.raw);
    }
  }
  return kept.join('\n');
}

/** @internal — test-only cache reset */
export function clearCssCache(): void {
  cssCache.clear();
}

/** @internal — test-only */
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
