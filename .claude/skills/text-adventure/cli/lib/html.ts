const ESC_MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const ESC_RE = /[&<>"']/g;
const INLINE_SCRIPT_ESC_RE = /[<>&\u2028\u2029]/g;

const INLINE_SCRIPT_ESC_MAP: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

/** HTML-escape a value. Accepts strings, numbers, objects with a name field, null/undefined.
 *  Objects are coerced via .name (for abilities, equipment items passed as objects). */
export function esc(s: unknown): string {
  if (s == null || s === false || s === '') return '';
  const str = typeof s === 'string' ? s
    : typeof s === 'object' && s !== null && 'name' in s ? String((s as Record<string, unknown>).name)
    : String(s);
  return str.replace(ESC_RE, c => ESC_MAP[c] ?? c);
}

/** Serialise data for safe embedding inside an inline <script> tag. */
export function serialiseInlineScriptData(value: unknown): string {
  return JSON.stringify(value).replace(
    INLINE_SCRIPT_ESC_RE,
    char => INLINE_SCRIPT_ESC_MAP[char] ?? char,
  );
}

/** @internal — test-only
 *  Format a numeric modifier with an explicit sign (e.g. +3, -1, +0). */
export function formatModifier(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

/** Emit a custom element with data attributes and optional fallback inner HTML. */
export function emitCustomElement(tag: string, attributes: Record<string, unknown>, innerHtml = ''): string {
  const parts = [`<${tag}`];
  for (const [k, v] of Object.entries(attributes)) {
    if (v == null) continue;
    // For arrays or objects, JSON.stringify them so they can be parsed by the component
    const strVal = typeof v === 'object' ? JSON.stringify(v) : String(v);
    parts.push(`${k}="${esc(strVal)}"`);
  }
  return parts.join(' ') + `>${innerHtml}</${tag}>`;
}
