// NPC dialogue widget — NPC name, disposition badge, conversation area,
// dialogue option buttons with data-prompt.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

/**
 * Builds the plain HTML fallback for NPC dialogue.
 */
interface DialogueChoice extends Record<string, unknown> {
  label: string;
  prompt: string;
  cost?: string | number;
}

/**
 * Builds a static HTML fallback for the dialogue widget.
 */
function buildDialogueFallback(speaker: string, text: string, choices: DialogueChoice[]): string {
  let html = `<div class="widget-dialogue"><div class="dlg-speaker">${esc(speaker)}</div>`;
  if (text) {
    html += `<div class="dlg-text">${esc(text)}</div>`;
  }
  if (choices.length > 0) {
    html += '<div class="dlg-choices">';
    choices.forEach(c => {
      const cost = c.cost ? ` <span class="cost">(${esc(String(c.cost))})</span>` : '';
      html += `<button class="dlg-choice-btn" data-prompt="${esc(c.prompt)}" title="${esc(c.prompt)}">${esc(c.label)}${cost}</button>`;
    });
    html += '</div>';
  }
  html += '</div>';
  return html;
}

/**
 * Renders the NPC dialogue widget.
 *
 * @param {GmState | null} state - Current game state.
 * @param {string} styleName - Visual style.
 * @param {Record<string, unknown>} [options] - Dialogue content (text, speaker, choices).
 * @returns {string} - The HTML wrapped in a <ta-dialogue> custom element.
 *
 * @remarks
 * Facilitates interactive conversations with NPCs. It supports multiple
 * choice responses, each linked to a specific prompt that the GM
 * can use to determine the next stage of the conversation.
 */
export function renderDialogue(state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  // NPC can be specified via options or we pick the first present NPC
  const npcId = options?.npcId as string | undefined;
  const npc = npcId
    ? state?.rosterMutations.find(n => n.id === npcId)
    : state?.rosterMutations.find(n => n.status === 'active');

  const npcName = npc?.name ?? (options?.npcName as string) ?? 'Unknown NPC';

  // Dialogue text and options can be passed via options.data
  const dataRaw = (options?.data ?? {}) as Record<string, unknown>;
  const dialogueText = typeof dataRaw.text === 'string' ? dataRaw.text : '';
  const choices: DialogueChoice[] = Array.isArray(dataRaw.choices)
    ? (dataRaw.choices as DialogueChoice[])
    : [];

  return emitStandaloneCustomElement({
    tag: 'ta-dialogue',
    styleName,
    html: buildDialogueFallback(npcName, dialogueText, choices),
    attrs: {
      'data-speaker': npcName,
      'data-text': dialogueText || null,
      'data-choices': choices.length > 0 ? JSON.stringify(choices) : null,
    },
  });
}
