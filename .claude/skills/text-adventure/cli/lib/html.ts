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

/** HTML-escape a string. Single-pass for performance. */
export function esc(s: string | undefined | null): string {
  if (!s) return '';
  return s.replace(ESC_RE, c => ESC_MAP[c] ?? c);
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
