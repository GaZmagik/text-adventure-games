import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { CommandResult } from '../types';
import { ok, fail } from '../lib/errors';
import { parseLoreFrontmatter } from '../lib/lore-frontmatter';
import { CDN_BASE } from '../../assets/cdn-manifest';

/** story/ directory relative to cli/commands/ */
const STORY_DIR = join(import.meta.dir, '..', '..', 'story');

/** CDN base for story assets — derived from the assets CDN base. */
const STORY_CDN = CDN_BASE.replace(/\/assets$/, '/story');

/** Map lore frontmatter theme values to player-facing genre labels. */
const THEME_GENRES: Record<string, string> = {
  space: 'sci-fi',
  fantasy: 'fantasy',
  horror: 'horror',
  western: 'western',
  noir: 'noir',
  steampunk: 'steampunk',
  cyberpunk: 'cyberpunk',
  historical: 'historical',
  modern: 'modern',
};

type BundledScenario = {
  id: string;
  title: string;
  description: string;
  genres: string[];
  difficulty: string;
  players: string;
  featured: boolean;
  loreFile: string;
  coverFront?: string;
  coverBack?: string;
  defaults: Record<string, string>;
  requiredModules: string[];
  optionalModules: string[];
};

function buildGenres(theme?: string, tone?: string): string[] {
  const genres: string[] = [];
  if (theme) {
    genres.push(THEME_GENRES[theme] ?? theme);
  }
  if (tone && tone !== theme) {
    genres.push(tone);
  }
  return genres;
}

function scanBundledAdventures(): BundledScenario[] {
  let entries: string[];
  try {
    entries = readdirSync(STORY_DIR);
  } catch {
    return [];
  }

  const loreFiles = entries.filter(f => f.endsWith('.base64.lore.md'));
  const scenarios: BundledScenario[] = [];

  for (const file of loreFiles) {
    try {
      const content = readFileSync(join(STORY_DIR, file), 'utf-8');
      const fm = parseLoreFrontmatter(content);
      if (!fm.title) continue;

      const id = basename(file, '.base64.lore.md');

      // Detect cover art PNGs alongside the lore file
      const frontFile = `${id}-front-cover.png`;
      const backFile = `${id}-back-cover.png`;
      const coverFront = existsSync(join(STORY_DIR, frontFile))
        ? `${STORY_CDN}/${frontFile}` : undefined;
      const coverBack = existsSync(join(STORY_DIR, backFile))
        ? `${STORY_CDN}/${backFile}` : undefined;

      const recStyles = typeof fm.recommendedStyles === 'object' ? fm.recommendedStyles : {};
      const defaults: Record<string, string> = {};
      if (fm.difficulty) defaults.difficulty = fm.difficulty;
      if (fm.pacing) defaults.pacing = fm.pacing;
      if (fm.rulebook) defaults.rulebook = fm.rulebook;
      if (recStyles.visual) defaults.visualStyle = recStyles.visual;

      const toStringArray = (v: unknown): string[] =>
        Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

      scenarios.push({
        id,
        title: fm.title,
        description: fm.description ?? '',
        genres: buildGenres(fm.theme, fm.tone),
        difficulty: fm.difficulty ?? 'normal',
        players: fm.players ?? '1',
        featured: true,
        loreFile: file,
        defaults,
        requiredModules: toStringArray(fm.requiredModules),
        optionalModules: toStringArray(fm.optionalModules),
        ...(coverFront ? { coverFront } : {}),
        ...(coverBack ? { coverBack } : {}),
      });
    } catch {
      // Skip malformed files
    }
  }

  return scenarios;
}

export async function handleScenario(args: string[]): Promise<CommandResult> {
  const sub = args[0];

  if (!sub) {
    return fail(
      'No subcommand provided.',
      'Usage: tag scenario bundled',
      'scenario',
    );
  }

  if (sub === 'bundled') {
    const scenarios = scanBundledAdventures();
    return ok({
      scenarios,
      total: scenarios.length,
      hint: 'Merge with GM-generated scenarios, then pass to: tag render scenario-select --data \'{"scenarios": [...]}\'',
    }, 'scenario');
  }

  return fail(
    `Unknown subcommand: ${sub}`,
    'Valid subcommands: bundled. Usage: tag scenario bundled',
    'scenario',
  );
}
