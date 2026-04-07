// tag CLI — Lore Frontmatter Parser
// Structured YAML-subset parser for .lore.md frontmatter blocks.
// Handles: scalars, quoted strings, booleans, integers, folded multiline (>),
// block sequences, nested objects, flow-style { } and [ ], kebab→camelCase keys.

// ── Types ────────────────────────────────────────────────────────────

export type LoreFrontmatter = {
  format?: string;
  version?: number;
  skillVersion?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  author?: string;
  theme?: string;
  tone?: string;
  acts?: number;
  episodes?: number;
  estimatedScenes?: string;
  players?: string;
  difficulty?: string;
  pacing?: string;
  edited?: boolean;
  exported?: boolean;
  exportedFrom?: string;
  exportedDate?: string;
  recommendedStyles?: { output?: string; visual?: string } | string;
  seed?: string;
  rulebook?: string;
  calendarSystem?: string;
  startDate?: string;
  startTime?: string;
  preGeneratedCharacters?: Record<string, unknown>[];
  requiredModules?: string[];
  optionalModules?: string[];
  /** Hex accent colour for scenario card e.g. '#C87941' */
  accent?: string;
  /** Raw SVG markup for scenario card logo (single-line, <svg>...</svg>) */
  svgLogo?: string;
};

// ── Internal helpers ─────────────────────────────────────────────────

type Line = { indent: number; text: string };

function prepareLines(raw: string): Line[] {
  return raw.split('\n').map(line => {
    const m = line.match(/^(\s*)(.*)/);
    return { indent: m![1]!.length, text: m![2]!.trimEnd() };
  });
}

function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** Parse a raw scalar, coercing unquoted booleans/integers. Quoted values stay strings. */
function parseScalar(raw: string): string | number | boolean {
  const t = raw.trim();
  if ((t.startsWith('"') && t.endsWith('"')) ||
      (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  return t;
}

function matchKV(text: string): { key: string; value: string } | null {
  const m = text.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:\s*(.*)/);
  if (!m) return null;
  return { key: m[1]!, value: m[2]!.trim() };
}

function findNextNonBlank(lines: Line[], start: number): Line | null {
  for (let i = start; i < lines.length; i++) {
    if (lines[i]!.text !== '') return lines[i]!;
  }
  return null;
}

// ── Flow-style collections ───────────────────────────────────────────

/** Split comma-separated items respecting quoted strings. */
function splitFlowItems(s: string): string[] {
  const items: string[] = [];
  let cur = '';
  let inQ = false;
  let qChar = '';
  for (const ch of s) {
    if (inQ) {
      cur += ch;
      if (ch === qChar) inQ = false;
    } else if (ch === '"' || ch === "'") {
      inQ = true; qChar = ch; cur += ch;
    } else if (ch === ',') {
      if (cur.trim()) items.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) items.push(cur.trim());
  return items;
}

function parseFlowObject(s: string): Record<string, unknown> {
  const inner = s.slice(1, -1).trim();
  if (!inner) return {};
  const result: Record<string, unknown> = {};
  for (const pair of splitFlowItems(inner)) {
    const idx = pair.indexOf(':');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    result[kebabToCamel(key)] = parseScalar(val);
  }
  return result;
}

function parseFlowArray(s: string): unknown[] {
  const inner = s.slice(1, -1).trim();
  if (!inner) return [];
  return splitFlowItems(inner).map(item => parseScalar(item));
}

// ── Block parsers ────────────────────────────────────────────────────

/** Collect folded multiline string (>) lines until indent drops or blank line. */
function parseFolded(lines: Line[], start: number, keyIndent: number): [string, number] {
  const parts: string[] = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.text === '') break;
    if (line.indent <= keyIndent) break;
    parts.push(line.text.trim());
    i++;
  }
  return [parts.join(' ').trim(), i];
}

/** Determine value type and parse accordingly. */
function parseValue(
  lines: Line[], lineIdx: number, rawValue: string, keyIndent: number,
): [unknown, number] {
  if (rawValue === '>') {
    return parseFolded(lines, lineIdx + 1, keyIndent);
  }
  if (rawValue === '') {
    const next = findNextNonBlank(lines, lineIdx + 1);
    if (next && next.text.startsWith('- ')) {
      return parseSequence(lines, lineIdx + 1, keyIndent + 2);
    }
    return parseMapping(lines, lineIdx + 1, keyIndent + 2);
  }
  if (rawValue.startsWith('{')) return [parseFlowObject(rawValue), lineIdx + 1];
  if (rawValue.startsWith('[')) return [parseFlowArray(rawValue), lineIdx + 1];
  return [parseScalar(rawValue), lineIdx + 1];
}

/** Parse key-value pairs at a given indentation level. */
function parseMapping(
  lines: Line[], start: number, baseIndent: number,
): [Record<string, unknown>, number] {
  const result: Record<string, unknown> = {};
  let i = start;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.text === '') { i++; continue; }
    if (line.indent < baseIndent) break;
    const kv = matchKV(line.text);
    if (!kv) { i++; continue; }
    let value: unknown;
    [value, i] = parseValue(lines, i, kv.value, line.indent);
    result[kebabToCamel(kv.key)] = value;
  }
  return [result, i];
}

/** Parse block sequence (array) at a given indentation level. */
function parseSequence(
  lines: Line[], start: number, baseIndent: number,
): [unknown[], number] {
  const result: unknown[] = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.text === '') { i++; continue; }
    if (line.indent < baseIndent) break;
    if (!line.text.startsWith('- ')) break;

    const afterDash = line.text.slice(2).trim();

    if (afterDash.startsWith('{')) {
      // Flow object item:  - { key: val, ... }
      result.push(parseFlowObject(afterDash));
      i++;
    } else if (afterDash.includes(':')) {
      // Object item:  - key: value  (first property on dash line)
      const kv = matchKV(afterDash);
      if (kv) {
        const obj: Record<string, unknown> = {};
        const effectiveIndent = baseIndent + 2;
        let value: unknown;
        [value, i] = parseValue(lines, i, kv.value, effectiveIndent);
        obj[kebabToCamel(kv.key)] = value;
        // Consume remaining properties of this object
        let moreProps: Record<string, unknown>;
        [moreProps, i] = parseMapping(lines, i, effectiveIndent);
        Object.assign(obj, moreProps);
        result.push(obj);
      } else {
        result.push(parseScalar(afterDash));
        i++;
      }
    } else {
      // Simple scalar item:  - value
      result.push(parseScalar(afterDash));
      i++;
    }
  }
  return [result, i];
}

// ── Builder helpers ──────────────────────────────────────────────────

function camelToKebab(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** Fields whose string values should be emitted as folded (>) blocks. */
const FOLDED_FIELDS = new Set(['description', 'background', 'hook']);

/** Fields whose object values should be emitted as flow-style { k: v }. */
const FLOW_OBJ_FIELDS = new Set(['stats']);

/** Fields whose string-array values should be emitted as flow-style ["a","b"]. */
const FLOW_ARR_FIELDS = new Set(['proficiencies']);

function isRec(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Quote a string if it contains YAML-ambiguous characters. */
function fmtScalar(value: unknown): string {
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  const s = String(value);
  if (/^[a-zA-Z0-9._-]+$/.test(s)) return s;
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

/** Format a value for flow-style context — always quotes strings for readability. */
function fmtFlowScalar(value: unknown): string {
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  return '"' + String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function fmtFlowObject(obj: Record<string, unknown>): string {
  const pairs = Object.entries(obj).map(([k, v]) => `${k}: ${fmtFlowScalar(v)}`);
  return '{ ' + pairs.join(', ') + ' }';
}

function fmtFlowArray(arr: string[]): string {
  return '[' + arr.map(v => `"${v}"`).join(', ') + ']';
}

function wrapFolded(text: string, width = 76): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur && cur.length + w.length + 1 > width) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + ' ' + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Emit a key-value entry at a given indent level (block-style YAML). */
function emitKV(key: string, value: unknown, indent: number): string {
  if (value === null || value === undefined) return '';
  const pad = '  '.repeat(indent);
  const yKey = camelToKebab(key);

  // Folded string
  if (typeof value === 'string' && FOLDED_FIELDS.has(key)) {
    const lines = wrapFolded(value);
    return `${pad}${yKey}: >\n` + lines.map(l => `${pad}  ${l}`).join('\n') + '\n';
  }

  // Scalar
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return `${pad}${yKey}: ${fmtScalar(value)}\n`;
  }

  // Array of scalars
  if (Array.isArray(value) && value.length > 0 && !isRec(value[0])) {
    let out = `${pad}${yKey}:\n`;
    for (const item of value) out += `${pad}  - ${String(item)}\n`;
    return out;
  }

  // Array of objects — block sequence
  if (Array.isArray(value) && value.length > 0 && isRec(value[0])) {
    let out = `${pad}${yKey}:\n`;
    for (const item of value) {
      if (isRec(item)) out += emitArrayItem(item, indent + 1);
    }
    return out;
  }

  // Nested object
  if (isRec(value)) {
    let out = `${pad}${yKey}:\n`;
    for (const [k, v] of Object.entries(value)) {
      out += emitKV(k, v, indent + 1);
    }
    return out;
  }

  return '';
}

/** Emit a single object item within a block sequence (- key: val). */
function emitArrayItem(obj: Record<string, unknown>, indent: number): string {
  const pad = '  '.repeat(indent);
  const entries = Object.entries(obj);
  if (entries.length === 0) return '';

  let out = '';
  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i]!;
    if (value === null || value === undefined) continue;
    const prefix = i === 0 ? `${pad}- ` : `${pad}  `;
    out += prefix + emitProperty(key, value, indent + 1);
  }
  return out;
}

/** Emit a property within an array-item object. Returns string without leading pad. */
function emitProperty(key: string, value: unknown, indent: number): string {
  const yKey = camelToKebab(key);
  const pad = '  '.repeat(indent);

  // Flow object (stats)
  if (isRec(value) && FLOW_OBJ_FIELDS.has(key)) {
    return `${yKey}: ${fmtFlowObject(value)}\n`;
  }

  // Flow array (proficiencies)
  if (Array.isArray(value) && FLOW_ARR_FIELDS.has(key) && value.every(v => typeof v === 'string')) {
    return `${yKey}: ${fmtFlowArray(value as string[])}\n`;
  }

  // Block array of flow objects (startingInventory)
  if (Array.isArray(value) && value.length > 0 && isRec(value[0])) {
    let out = `${yKey}:\n`;
    for (const item of value) {
      if (isRec(item)) out += `${pad}  - ${fmtFlowObject(item)}\n`;
    }
    return out;
  }

  // Folded string
  if (typeof value === 'string' && FOLDED_FIELDS.has(key)) {
    const lines = wrapFolded(value);
    return `${yKey}: >\n` + lines.map(l => `${pad}  ${l}`).join('\n') + '\n';
  }

  // Scalar
  return `${yKey}: ${fmtScalar(value)}\n`;
}

// ── Public API ───────────────────────────────────────────────────────

/** Build structured YAML frontmatter from a LoreFrontmatter object.
 *  Inverse of parseLoreFrontmatter — output round-trips through the parser. */
export function buildLoreFrontmatter(data: LoreFrontmatter): string {
  let out = '---\n';
  for (const [key, value] of Object.entries(data)) {
    out += emitKV(key, value, 0);
  }
  out += '---';
  return out;
}

/** Parse structured YAML-subset frontmatter from .lore.md content.
 *  Returns an empty object when no frontmatter is found. */
export function parseLoreFrontmatter(content: string): LoreFrontmatter {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return {};
  const lines = prepareLines(fmMatch[1]!);
  const [result] = parseMapping(lines, 0, 0);
  return result as LoreFrontmatter;
}
