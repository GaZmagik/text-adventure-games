import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { MAX_FILE_SIZE_BYTES } from './constants';

const DEFAULT_PATH_PREFIXES = ['/', './', '../', '~/'] as const;

export const PATH_SECURITY_RUNTIME = {
  realpathSync,
  resolve,
  homedir,
  tmpdir,
};

type SafeReadPathOptions = {
  kind: string;
  extensions?: readonly string[];
};

export function looksLikeSafeReadPath(
  input: string,
  extensions: readonly string[] = [],
): boolean {
  if (!input) return false;
  if (DEFAULT_PATH_PREFIXES.some(prefix => input.startsWith(prefix))) return true;
  return extensions.some(extension => input.endsWith(extension));
}

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

/** Check whether a resolved absolute path falls within allowed prefixes (home, tmp, /mnt/).
 *  Centralises the prefix validation duplicated across path-security, state-store, tag, and sync. */
export function isAllowedPath(filepath: string): boolean {
  const home = PATH_SECURITY_RUNTIME.homedir();
  const tmp = PATH_SECURITY_RUNTIME.tmpdir();
  if (home === '/') return false;
  const homePrefix = home + '/';
  const tmpPrefix = tmp === '/' ? tmp : tmp + '/';
  const mntPrefix = '/mnt/';
  return filepath.startsWith(homePrefix) || filepath.startsWith(tmpPrefix) || filepath.startsWith(mntPrefix);
}

export async function readSafeTextFile(
  filePath: string,
  kind: string,
): Promise<string> {
  // TOCTOU note: the realpath/prefix validation happens before the actual read.
  // Bun/Node do not give us a clean cross-platform no-follow open-by-fd path here,
  // so we keep the same documented limitation for save/export and fail closed on I/O.
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    throw new Error(`${kind} file could not be read.`);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`${kind} file exceeds 10 MB size limit.`);
  }

  try {
    return await file.text();
  } catch {
    throw new Error(`${kind} file could not be read.`);
  }
}
