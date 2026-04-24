// Panel integrity checks — structural validation for scene overlay panels.
// Catches GM drift: empty shells, codex count mismatches, spoiler panels, quest format issues.

import { extractAttr, extractPanelContent, countClassOccurrences, stripHtml } from './verify-checks';
import type { GmState } from '../types';

/** Panel is template scaffolding or has an explicit empty-state placeholder. */
function isEmptyOrPlaceholder(panelHtml: string): boolean {
  const inner = panelHtml
    .replace(/^<div[^>]*>/, '')
    .replace(/<\/div>$/, '')
    .trim();
  if (!inner) return true; // Completely empty scaffold
  return /\bempty-state\b/.test(panelHtml);
}

/* ------------------------------------------------------------------ */
/*  Codex: discovered count must match rendered entries                 */
/* ------------------------------------------------------------------ */

export function checkCodexEntryCount(html: string, failures: string[]): void {
  const codexPanel = extractPanelContent(html, 'codex');
  if (!codexPanel) return;

  const summaryMatch = /(\d+)\s+of\s+\d+\s+entr(?:y|ies)\s+discovered/i.exec(codexPanel);
  if (!summaryMatch) return;

  const claimed = parseInt(summaryMatch[1]!, 10);
  if (claimed === 0) return;

  const actual = countClassOccurrences(codexPanel, 'codex-entry');
  if (actual !== claimed) {
    failures.push(
      `Codex claims ${claimed} entries discovered but contains ${actual} .codex-entry element(s). ` +
        'Every discovered entry must be visible in the codex panel. ' +
        'Regenerate the codex panel content to include all discovered entries.',
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Ship: panel must not be an empty spoiler shell                     */
/* ------------------------------------------------------------------ */

const SHIP_PLACEHOLDER = /not currently|no ship|no vessel|not aboard/i;

export function checkShipPanelContent(html: string, failures: string[]): void {
  const shipPanel = extractPanelContent(html, 'ship');
  if (!shipPanel) return;
  if (isEmptyOrPlaceholder(shipPanel)) return;

  const systemCards = countClassOccurrences(shipPanel, 'system-card');
  if (systemCards > 0) return;

  const text = stripHtml(shipPanel);
  if (SHIP_PLACEHOLDER.test(text)) return;

  failures.push(
    'Ship panel is present but contains no system cards (.system-card) and no placeholder message. ' +
      'An empty ship panel spoils that the player eventually acquires a ship. ' +
      'Either populate with ship systems, show a placeholder (e.g., "Not currently aboard a ship"), or remove the panel entirely.',
  );
}

/* ------------------------------------------------------------------ */
/*  Crew: panel must not be an empty spoiler shell                     */
/* ------------------------------------------------------------------ */

const CREW_PLACEHOLDER = /no crew|not recruited|no members|crew not|alone/i;

export function checkCrewPanelContent(html: string, failures: string[]): void {
  const crewPanel = extractPanelContent(html, 'crew');
  if (!crewPanel) return;
  if (isEmptyOrPlaceholder(crewPanel)) return;

  const crewRows = countClassOccurrences(crewPanel, 'crew-row');
  if (crewRows > 0) return;

  const text = stripHtml(crewPanel);
  if (CREW_PLACEHOLDER.test(text)) return;

  failures.push(
    'Crew panel is present but contains no crew members (.crew-row) and no placeholder message. ' +
      'An empty crew panel spoils that the player eventually recruits crew. ' +
      'Either populate with crew members, show a placeholder (e.g., "No crew recruited yet"), or remove the panel entirely.',
  );
}

/* ------------------------------------------------------------------ */
/*  Quests: structural integrity + format consistency                   */
/* ------------------------------------------------------------------ */

export function checkQuestPanelIntegrity(html: string, failures: string[]): void {
  const questPanel = extractPanelContent(html, 'quests');
  if (!questPanel) return;
  if (isEmptyOrPlaceholder(questPanel)) return;

  const questLogElement = /<ta-quest-log\b[^>]*>/i.exec(questPanel)?.[0];
  if (questLogElement) {
    const rawQuests = decodeHtmlEntities(extractAttr(questLogElement, 'data-quests'));
    if (!rawQuests) {
      failures.push('Quest log custom element missing data-quests payload.');
      return;
    }

    try {
      const quests = JSON.parse(rawQuests);
      if (!Array.isArray(quests)) {
        failures.push('Quest log data-quests payload must be an array.');
        return;
      }

      for (const [index, quest] of quests.entries()) {
        if (!isQuestRecord(quest)) {
          failures.push(`Quest log data-quests[${index}] must be an object.`);
          return;
        }
        if (typeof quest.title !== 'string' || quest.title.trim().length === 0) {
          failures.push(`Quest log data-quests[${index}] missing title.`);
          return;
        }
        if (!Array.isArray(quest.objectives)) {
          failures.push(`Quest log data-quests[${index}] missing objectives array.`);
          return;
        }
      }
    } catch {
      failures.push('Quest log data-quests payload must be valid JSON.');
    }
    return;
  }

  const cardCount = countClassOccurrences(questPanel, 'quest-card');
  if (cardCount === 0) {
    failures.push(
      'Quest panel is present but contains no quest cards (.quest-card). ' +
        'Active quests must be visible when the quest panel exists.',
    );
    return;
  }

  const titles = countClassOccurrences(questPanel, 'quest-title');
  const progressCount = countClassOccurrences(questPanel, 'quest-progress');

  if (titles < cardCount) {
    failures.push(
      `Found ${cardCount} quest card(s) but only ${titles} quest title(s) — every quest needs a .quest-title.`,
    );
  }
  if (progressCount < cardCount) {
    failures.push(
      `Found ${cardCount} quest card(s) but only ${progressCount} progress indicator(s) — every quest needs a .quest-progress.`,
    );
  }

  // Check progress format consistency
  const progressValues: string[] = [];
  const progressPattern = /class\s*=\s*(['"])[^'"]*\bquest-progress\b[^'"]*\1[^>]*>([^<]*)/gi;
  let m: RegExpExecArray | null;
  while ((m = progressPattern.exec(questPanel)) !== null) {
    progressValues.push(m[2]!.trim());
  }

  const hasFraction = progressValues.some(v => /^\d+\/\d+$/.test(v));
  const hasPercent = progressValues.some(v => /^\d+%$/.test(v));
  if (hasFraction && hasPercent) {
    failures.push(
      'Quest progress uses mixed formats (fractions and percentages). ' +
        'Use a consistent format �� fractions (e.g., "1/3") or percentages (e.g., "33%"), not both.',
    );
  }
}

function isQuestRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function decodeHtmlEntities(value: string | null): string {
  if (value == null) return '';
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/* ------------------------------------------------------------------ */
/*  Map: must have current location + summary                          */
/* ------------------------------------------------------------------ */

export function checkMapPanelContent(html: string, failures: string[]): void {
  const mapPanel = extractPanelContent(html, 'map');
  if (!mapPanel) return;
  if (isEmptyOrPlaceholder(mapPanel)) return;

  if (!/\bmap-current\b/.test(mapPanel)) {
    failures.push(
      'Map panel missing current location element (.map-current) — the player needs to know where they are.',
    );
  }
  if (!/\bmap-summary\b/.test(mapPanel)) {
    failures.push('Map panel missing summary element (.map-summary) — show visited/unexplored zone counts.');
  }
}

/* ------------------------------------------------------------------ */
/*  Level-up: rewards must be applied via compute, not manual edit     */
/* ------------------------------------------------------------------ */

export function checkLevelUpIntegrity(state: GmState, failures: string[]): void {
  if (!state.character || state.character.level <= 1) return;

  const computedLevel = state._computedLevel ?? 1;
  if (state.character.level > computedLevel) {
    failures.push(
      `Character is level ${state.character.level} but \`tag compute levelup\` only applied rewards through level ${computedLevel}. ` +
        'HP gains, proficiency bonus, and attribute improvements were not applied. ' +
        'Run `tag compute levelup` before verifying the scene.',
    );
  }
}
