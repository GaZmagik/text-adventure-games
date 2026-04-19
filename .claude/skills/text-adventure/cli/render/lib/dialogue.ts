// Multi-character dialogue composer — scene-level helper for rendering
// conversations with 2+ speakers, prose interludes, and optional choices.
// Output is theme-agnostic; speaker colours come from --speaker-color-N
// tokens defined in each style's :host {} block.

import { esc } from '../../lib/html';

// ── Types ─────────────────────────────────────────────────────────────

export type DialogueSpeaker = {
  id: string;
  name: string;
  /** Override auto-assigned palette variable, e.g. '--speaker-color-3' */
  cssVar?: string;
};

export type DialogueBlock =
  | { type: 'prose'; text: string }
  | { type: 'dialogue'; speakerId: string; text: string };

export type DialogueChoice = {
  label: string;
  prompt: string;
};

export type MultiDialogueOptions = {
  speakers: DialogueSpeaker[];
  blocks: DialogueBlock[];
  choices?: DialogueChoice[];
};

// ── Implementation ────────────────────────────────────────────────────

const PALETTE_SIZE = 6;

export function renderMultiDialogue(opts: MultiDialogueOptions): string {
  const { speakers, blocks, choices = [] } = opts;

  // Build speaker → colour variable map
  const speakerColorVar = new Map<string, string>();
  speakers.forEach((s, i) => {
    speakerColorVar.set(s.id, s.cssVar ?? `--speaker-color-${i % PALETTE_SIZE}`);
  });

  const parts: string[] = [];

  for (const block of blocks) {
    if (block.type === 'prose') {
      parts.push(`<div class="dialogue-prose">${esc(block.text)}</div>`);
    } else {
      const colorVar = speakerColorVar.get(block.speakerId);
      if (colorVar === undefined) continue; // unknown speaker — skip gracefully
      const speaker = speakers.find(s => s.id === block.speakerId);
      if (!speaker) continue;
      parts.push(
        `<div class="dialogue-line" style="--speaker-color: var(${colorVar})">`
        + `<span class="speaker-name">${esc(speaker.name)}</span>`
        + `<span class="speaker-text">${esc(block.text)}</span>`
        + `</div>`,
      );
    }
  }

  const choicesHtml = choices.length > 0
    ? `\n<div class="dialogue-choices">${
        choices.map(c =>
          `<button class="dialogue-choice" data-prompt="${esc(c.prompt)}" title="${esc(c.prompt)}">`
          + `${esc(c.label)}</button>`,
        ).join('\n')
      }</div>`
    : '';

  return `<div class="multi-dialogue">\n${parts.join('\n')}${choicesHtml}\n</div>`;
}
