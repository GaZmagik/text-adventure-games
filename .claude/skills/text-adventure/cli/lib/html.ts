const ESC_MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const ESC_RE = /[&<>"']/g;

/** HTML-escape a string. Single-pass for performance. */
export function esc(s: string | undefined | null): string {
  if (!s) return '';
  return s.replace(ESC_RE, c => ESC_MAP[c]!);
}

/** Format a numeric modifier with an explicit sign (e.g. +3, -1, +0). */
export function formatModifier(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}
