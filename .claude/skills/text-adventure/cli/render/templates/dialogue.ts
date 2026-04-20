// NPC dialogue widget — NPC name, disposition badge, conversation area,
// dialogue option buttons with data-prompt.

import type { GmState } from '../../types';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

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
  const choices: { label: string; prompt: string }[] = Array.isArray(dataRaw.choices) ? dataRaw.choices as { label: string; prompt: string }[] : [];

  return emitStandaloneCustomElement({
    tag: 'ta-dialogue',
    styleName,
    attrs: {
      'data-speaker': npcName,
      'data-text': dialogueText || null,
      'data-choices': choices.length > 0 ? JSON.stringify(choices) : null,
    },
  });
}
