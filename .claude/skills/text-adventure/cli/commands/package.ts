import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { homedir } from 'node:os';
import type { CommandResult } from '../types';
import { ok, fail } from '../lib/errors';
import { handleBuildCss } from './build-css';

const COMMAND = 'package';
const ZIP_NAME = 'text-adventure.zip';

/**
 * Regex versions of exclusions for the audit scanner.
 */
const EXCLUSION_REGEXES = [
  /^\.git($|\/)/,
  /^node_modules($|\/)/,
  /^scratch($|\/)/,
  /^\.env$/,
  /^\.DS_Store$/,
  /\.log$/,
  /^coverage($|\/)/,
  /^test-results($|\/)/,
  /^playwright-report($|\/)/,
  /^\.claude\/logs($|\/)/,
  /^text-adventure\.zip$/,
];

/**
 * Audit result for a single file.
 */
type AuditIssue = {
  path: string;
  type: 'forbidden' | 'leak';
  detail: string;
};

/**
 * Scans a directory for forbidden files and local path leaks.
 * Skips directories that are explicitly excluded from the package.
 */
async function runAudits(rootDir: string): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = [];
  const home = homedir();

  // We'll also check for common Linux/Mac home prefixes if we can't get homedir
  const homeLeaks = [home].filter(h => h && h !== '/');

  function walk(dir: string): void {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relPath = relative(rootDir, fullPath);
      const normalisedRelPath = relPath.split('\\').join('/');

      // If this file/dir is in the exclusion list, skip it entirely
      if (EXCLUSION_REGEXES.some(r => r.test(normalisedRelPath))) {
        continue;
      }

      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile()) {
        // 1. Check for sensitive filenames that might have been missed by exclusions
        if (entry.includes('secret') || entry.includes('key') || entry.endsWith('.pem')) {
          issues.push({ path: relPath, type: 'forbidden', detail: 'Potentially sensitive filename' });
        }

        // 2. Scan file content for leaks (text files only)
        const ext = entry.split('.').pop()?.toLowerCase();
        const isText = ['ts', 'js', 'css', 'md', 'json', 'txt', 'html', 'sh'].includes(ext || '');

        if (isText) {
          try {
            const content = readFileSync(fullPath, 'utf-8');
            for (const leak of homeLeaks) {
              if (content.includes(leak)) {
                issues.push({ path: relPath, type: 'leak', detail: `Contains local path leak: ${leak}` });
              }
            }
          } catch {
            /* ignore unreadable files */
          }
        }
      }
    }
  }

  walk(rootDir);
  return issues;
}

/**
 * Creates the zip file using the system 'zip' command.
 */
async function createZip(rootDir: string, targetZip: string): Promise<void> {
  // Refined exclusion list for zip command
  const zipExclusions = [
    '.git/*',
    'node_modules/*',
    'scratch/*',
    '.env',
    '.DS_Store',
    '*.log',
    'coverage/*',
    'test-results/*',
    'playwright-report/*',
    '.claude/logs/*',
    'text-adventure.zip',
  ];

  const proc = Bun.spawn(['zip', '-r', targetZip, '.', '-x', ...zipExclusions], {
    cwd: rootDir,
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`Zip command failed with exit code ${exitCode}`);
  }
}

export async function handlePackage(_args: string[]): Promise<CommandResult> {
  const cliDir = resolve(import.meta.dir, '..');
  const skillDir = resolve(cliDir, '..');

  // 1. Read version
  let version = 'unknown';
  try {
    const pkg = JSON.parse(readFileSync(join(skillDir, 'package.json'), 'utf-8'));
    version = pkg.version || 'unknown';
  } catch {
    /* ignore */
  }

  process.stderr.write(`Starting package for v${version}...\n`);

  // 2. Build CSS with --release
  process.stderr.write('Building assets with --release...\n');
  const buildResult = await handleBuildCss(['--release', `v${version}`]);
  if (!buildResult.ok) {
    return buildResult;
  }

  // 3. Run security audits
  process.stderr.write('Running security audits...\n');
  const issues = await runAudits(skillDir);

  if (issues.length > 0) {
    return fail(
      'Security audit failed. Potential leaks or forbidden files detected.',
      issues.map(i => `${i.type.toUpperCase()}: ${i.path} (${i.detail})`).join('\n'),
      COMMAND,
    );
  }

  // 4. Create Zip
  process.stderr.write(`Creating ${ZIP_NAME}...\n`);
  const zipPath = join(skillDir, ZIP_NAME);

  // Delete existing zip if it exists
  if (existsSync(zipPath)) {
    const proc = Bun.spawn(['rm', zipPath]);
    await proc.exited;
  }

  try {
    await createZip(skillDir, ZIP_NAME);
  } catch (err) {
    return fail(`Failed to create ${ZIP_NAME}`, err instanceof Error ? err.message : String(err), COMMAND);
  }

  const zipStat = statSync(zipPath);

  process.stderr.write('Package created successfully.\n');

  return ok(
    {
      zipPath,
      sizeBytes: zipStat.size,
      version,
      audited: true,
    },
    COMMAND,
  );
}
