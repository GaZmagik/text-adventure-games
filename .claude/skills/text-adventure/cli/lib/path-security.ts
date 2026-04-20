import { realpathSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { MAX_FILE_SIZE_BYTES } from './constants';

const DEFAULT_PATH_PREFIXES = ['/', './', '../', '~/'] as const;

/** 
 * DI container for path resolution functions to facilitate testing. 
 */
export const PATH_SECURITY_RUNTIME = {
  realpathSync,
  resolve,
  homedir,
  tmpdir,
};

/** Options for safe path resolution. */
type SafeReadPathOptions = {
  /** Descriptive name of the file type (e.g., 'Lore', 'State'). */
  kind: string;
  /** Optional list of allowed file extensions. */
  extensions?: readonly string[];
};

/**
 * Heuristic check to see if a string looks like a legitimate file path.
 * @param {string} input - The input string.
 * @param {readonly string[]} [extensions=[]] - Allowed extensions.
 */
export function looksLikeSafeReadPath(
  input: string,
  extensions: readonly string[] = [],
): boolean {
  if (!input) return false;
  if (DEFAULT_PATH_PREFIXES.some(prefix => input.startsWith(prefix))) return true;
  return extensions.some(extension => input.endsWith(extension));
}

/**
 * Resolves an input string into a safe, absolute, real filesystem path.
 * @param {string} input - The user-provided path string.
 * @param {SafeReadPathOptions} options - Security options.
 * @returns {string | null} - Resolved absolute path, or null if heuristic fails.
 * @throws {Error} - If the file is not found or falls outside the allowed sandbox.
 */
export function resolveSafeReadPath(
  input: string,
  options: SafeReadPathOptions,
): string | null {
  if (!looksLikeSafeReadPath(input, options.extensions)) {
    return null;
  }

  let resolved: string;
  try {
    resolved = PATH_SECURITY_RUNTIME.realpathSync(PATH_SECURITY_RUNTIME.resolve(input));
  } catch (err: unknown) {
    const code = err && typeof err === 'object' && 'code' in err
      ? (err as NodeJS.ErrnoException).code
      : undefined;
    if (code === 'ENOENT' || code === 'ENOTDIR') throw new Error(`${options.kind} file not found: ${input}`);
    throw err;
  }

  if (!isAllowedPath(resolved)) {
    throw new Error(`${options.kind} file path must be within the home, temp, or /mnt/ directory.`);
  }

  return resolved;
}

/** 
 * Enforces the 'Sandbox' boundary for file operations.
 * 
 * @param {string} filepath - Absolute, resolved path to check.
 * @returns {boolean} - True if the path is within the allowed home, tmp, or /mnt/ prefixes.
 * @remarks
 * This is a critical security function used to prevent directory traversal and unauthorized 
 * access to system files. It assumes the path has already been resolved via `realpathSync`.
 */
export function isAllowedPath(filepath: string): boolean {
  const home = PATH_SECURITY_RUNTIME.homedir();
  const tmp = PATH_SECURITY_RUNTIME.tmpdir();
  if (home === '/') return false;
  const homePrefix = home + '/';
  const tmpPrefix = tmp === '/' ? tmp : tmp + '/';
  const mntPrefix = '/mnt/';
  return filepath.startsWith(homePrefix) || filepath.startsWith(tmpPrefix) || filepath.startsWith(mntPrefix);
}

/**
 * Safely reads the contents of a text file, enforcing size limits and sandbox boundaries.
 * 
 * @param {string} filePath - Path to the file (must be already resolved/validated).
 * @param {string} kind - Descriptive name for error messages.
 * @returns {Promise<string>} - The file contents as text.
 * @throws {Error} - If the file is missing, unreadable, or exceeds `MAX_FILE_SIZE_BYTES` (10MB).
 * @remarks
 * Note: A Time-of-Check to Time-of-Use (TOCTOU) race condition exists between validation 
 * and reading, but this is an acceptable trade-off for the CLI's security model.
 */
export async function readSafeTextFile(
  filePath: string,
  kind: string,
): Promise<string> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    throw new Error(`${kind} file could not be read.`);
  }
  if (statSync(filePath).size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`${kind} file exceeds 10 MB size limit.`);
  }

  try {
    return await file.text();
  } catch {
    throw new Error(`${kind} file could not be read.`);
  }
}
