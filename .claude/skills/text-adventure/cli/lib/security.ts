import { FORBIDDEN_KEYS } from './constants';

/** Recursively check for forbidden keys (__proto__, constructor, prototype) in a parsed value. */
export function containsForbiddenKeys(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key)) return true;
    if (containsForbiddenKeys((obj as Record<string, unknown>)[key])) return true;
  }
  return false;
}
