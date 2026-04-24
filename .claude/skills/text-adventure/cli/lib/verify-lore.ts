// tag CLI — Lore File Verification
// Structural and content checks for .lore.md files (both base64 and full markdown flavours).

import { parseLoreFrontmatter } from './lore-frontmatter';
import type { LoreFrontmatter } from './lore-frontmatter';
import { extractLorePayload } from './lore-serialiser';
import { validateAndDecode } from './fnv32';
import { KNOWN_MODULES } from './constants';
import { CSS_MANIFEST } from '../../assets/cdn-manifest';

// ── Validation sets ─────────────────────────────────────────────────

const VALID_RULEBOOKS = new Set([
  'd20_system',
  'dnd_5e',
  'gurps_lite',
  'pf2e_lite',
  'shadowrun_lite',
  'narrative_engine',
  'custom',
]);

const VALID_VISUAL_STYLES = new Set(Object.keys(CSS_MANIFEST));

const KNOWN_MODULES_SET = new Set<string>(KNOWN_MODULES);

const RE_SEMVER = /^\d+\.\d+\.\d+$/;

// ── Required frontmatter fields ─────────────────────────────────────

const REQUIRED_FIELDS: (keyof LoreFrontmatter)[] = [
  'format',
  'version',
  'title',
  'theme',
  'tone',
  'acts',
  'players',
  'difficulty',
];

// ── Body section definitions ────────────────────────────────────────

const REQUIRED_SECTIONS = ['World History', 'Location Atlas', 'NPC Roster', 'Story Spine'];
const OPTIONAL_SECTIONS = ['Encounter Tables', 'Loot and Rewards', 'Faction Dynamics'];

// ── Check 1: Frontmatter presence ───────────────────────────────────

/**
 * Check 1: Verifies that the file begins with a YAML frontmatter block.
 */
export function checkLoreFrontmatterPresent(content: string, failures: string[]): boolean {
  const hasFm = /^---\n[\s\S]*?\n---/.test(content);
  if (!hasFm) {
    failures.push('No YAML frontmatter found — lore files must begin with --- delimiters.');
    return false;
  }
  return true;
}

// ── Check 2: Required frontmatter fields ────────────────────────────

/**
 * Check 2: Verifies that all mandatory frontmatter fields are present.
 */
export function checkLoreFrontmatterFields(fm: LoreFrontmatter, failures: string[]): void {
  for (const field of REQUIRED_FIELDS) {
    const value = fm[field];
    if (value === undefined || value === null || value === '') {
      failures.push(`Missing required frontmatter field: "${field}".`);
    }
  }
}

// ── Check 3: Frontmatter value validation ───────────────────────────

/**
 * Check 3: Validates the format, version, rulebook, and style values.
 */
export function checkLoreFrontmatterValues(fm: LoreFrontmatter, failures: string[]): void {
  if (fm.format !== undefined && fm.format !== 'text-adventure-lore') {
    failures.push(`Invalid format: "${fm.format}" — expected "text-adventure-lore".`);
  }

  if (fm.version !== undefined && (typeof fm.version !== 'number' || fm.version < 1)) {
    failures.push(`Invalid version: ${fm.version} — must be a positive integer.`);
  }

  if (fm.skillVersion !== undefined && !RE_SEMVER.test(fm.skillVersion)) {
    failures.push(`Invalid skill-version: "${fm.skillVersion}" — must match semver (e.g. "1.4.0").`);
  }

  if (fm.rulebook !== undefined && !VALID_RULEBOOKS.has(fm.rulebook)) {
    failures.push(`Unknown rulebook: "${fm.rulebook}". Valid: ${[...VALID_RULEBOOKS].join(', ')}.`);
  }

  if (fm.recommendedStyles !== undefined && typeof fm.recommendedStyles === 'object' && fm.recommendedStyles !== null) {
    const visual = (fm.recommendedStyles as { visual?: string }).visual;
    if (visual !== undefined && !VALID_VISUAL_STYLES.has(visual)) {
      failures.push(`Unknown recommended visual style: "${visual}". Valid: ${[...VALID_VISUAL_STYLES].join(', ')}.`);
    }
  }

  if (fm.requiredModules !== undefined && Array.isArray(fm.requiredModules)) {
    for (const mod of fm.requiredModules) {
      if (!KNOWN_MODULES_SET.has(mod)) {
        failures.push(`Unknown required module: "${mod}".`);
      }
    }
  }

  if (fm.exportedDate !== undefined) {
    const parsed = new Date(fm.exportedDate);
    if (isNaN(parsed.getTime())) {
      failures.push(`Invalid exported-date: "${fm.exportedDate}" — must be valid ISO 8601.`);
    }
  }
}

// ── Check 4: Export-specific fields ─────────────────────────────────

/**
 * Check 4: Verifies metadata consistency for lore files exported from live sessions.
 */
export function checkLoreExportFields(fm: LoreFrontmatter, failures: string[]): void {
  if (!fm.exported) return;

  if (!fm.exportedDate) {
    failures.push('Exported lore must include "exported-date" field.');
  }
  if (!fm.exportedFrom) {
    failures.push('Exported lore must include "exported-from" field.');
  }
}

// ── Check 5: Pre-generated characters ───────────────────────────────

/**
 * Check 5: Validates the schema of any pre-generated character options.
 */
export function checkLorePregenCharacters(fm: LoreFrontmatter, failures: string[]): void {
  if (
    !fm.preGeneratedCharacters ||
    !Array.isArray(fm.preGeneratedCharacters) ||
    fm.preGeneratedCharacters.length === 0
  ) {
    return;
  }

  for (let i = 0; i < fm.preGeneratedCharacters.length; i++) {
    const char = fm.preGeneratedCharacters[i] as Record<string, unknown>;
    const missing: string[] = [];

    if (!char.name) missing.push('name');
    if (!char.class) missing.push('class');
    if (char.hp === undefined || char.hp === null) missing.push('hp');

    if (missing.length > 0) {
      failures.push(`Pre-generated character at index ${i} missing: ${missing.join(', ')}.`);
    }

    if (char.stats && typeof char.stats === 'object' && !Array.isArray(char.stats)) {
      const keyCount = Object.keys(char.stats as Record<string, unknown>).length;
      if (keyCount !== 6) {
        failures.push(`Pre-generated character at index ${i} stats block must have 6 keys, found ${keyCount}.`);
      }
    }
  }
}

// ── Check 6: Body sections ──────────────────────────────────────────

/** Extract section content between a ## heading and the next ## heading (or EOF). */
function extractSectionContent(content: string, sectionName: string): string | null {
  const re = new RegExp(`^## ${sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm');
  const match = content.match(re);
  if (!match || match.index === undefined) return null;

  const start = match.index + match[0].length;
  const rest = content.slice(start);
  const nextHeading = rest.match(/^## /m);
  const sectionText = nextHeading && nextHeading.index !== undefined ? rest.slice(0, nextHeading.index) : rest;

  return sectionText;
}

/**
 * Check 6: Verifies the presence and content of required markdown headings.
 * @remarks
 * If a Base64 LORE payload is present, body sections are optional as
 * the engine will prioritise the encoded data.
 */
export function checkLoreBodySections(
  content: string,
  fm: LoreFrontmatter,
  hasPayload: boolean,
  failures: string[],
  warnings: string[],
): void {
  // If a LORE payload exists, body sections are optional — data is encoded in the payload
  if (hasPayload) return;

  for (const section of REQUIRED_SECTIONS) {
    const sectionContent = extractSectionContent(content, section);
    if (sectionContent === null) {
      failures.push(`Missing required body section: "## ${section}".`);
    } else if (sectionContent.trim().length === 0) {
      failures.push(`Required body section "## ${section}" is empty — must contain content.`);
    }
  }

  for (const section of OPTIONAL_SECTIONS) {
    const sectionContent = extractSectionContent(content, section);
    if (sectionContent === null) {
      warnings.push(`Optional body section "## ${section}" is missing — consider adding it.`);
    }
  }

  // Exported lore without payload must have Previous Adventurer section
  if (fm.exported) {
    const prevAdventurer = extractSectionContent(content, 'Previous Adventurer');
    if (prevAdventurer === null) {
      failures.push('Exported lore missing required body section: "## Previous Adventurer".');
    }
  }
}

// ── Check 7: Embedded LORE payload ──────────────────────────────────

/**
 * Check 7: Locates and validates the embedded Base64 LORE payload comment.
 */
export function checkLorePayload(content: string, failures: string[]): { hasPayload: boolean } {
  const payloadStr = extractLorePayload(content);
  if (!payloadStr) return { hasPayload: false };

  const decoded = validateAndDecode(payloadStr);
  if (!decoded.valid) {
    failures.push(`Embedded LORE payload validation failed: ${decoded.error}.`);
  } else if (decoded.payload._loreVersion !== 1) {
    failures.push(`Embedded LORE payload has unsupported _loreVersion: ${decoded.payload._loreVersion}.`);
  }

  return { hasPayload: true };
}

// ── Orchestrator ────────────────────────────────────────────────────

/** Result of a comprehensive lore file verification. */
type LoreVerifyResult = {
  failures: string[];
  warnings: string[];
  /** Total number of check phases completed. */
  checks: number;
  /** The parsed frontmatter, if available. */
  frontmatter: LoreFrontmatter | null;
};

/**
 * Runs a full suite of structural and semantic checks on a .lore.md file.
 *
 * @param {string} content - Raw Markdown content of the lore file.
 * @returns {LoreVerifyResult} - Aggregated failures and warnings.
 *
 * @remarks
 * This is the primary entry point for world-file validation.
 * It enforces the "Text Adventure Lore" standard, ensuring that shared
 * worlds are both human-readable and machine-parsable.
 */
export function verifyLoreFile(content: string): LoreVerifyResult {
  const failures: string[] = [];
  const warnings: string[] = [];

  // Check 1: Frontmatter presence
  const hasFm = checkLoreFrontmatterPresent(content, failures);
  if (!hasFm) {
    return { failures, warnings, checks: 1, frontmatter: null };
  }

  const fm = parseLoreFrontmatter(content);

  // Check 2: Required fields
  checkLoreFrontmatterFields(fm, failures);

  // Check 3: Value validation
  checkLoreFrontmatterValues(fm, failures);

  // Check 4: Export fields
  checkLoreExportFields(fm, failures);

  // Check 5: Pre-generated characters
  checkLorePregenCharacters(fm, failures);

  // Check 7: Payload (run before body sections to determine hasPayload)
  const { hasPayload } = checkLorePayload(content, failures);

  // Check 6: Body sections
  checkLoreBodySections(content, fm, hasPayload, failures, warnings);

  return { failures, warnings, checks: 7, frontmatter: fm };
}
