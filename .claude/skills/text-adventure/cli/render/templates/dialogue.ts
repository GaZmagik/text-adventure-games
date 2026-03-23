// NPC dialogue widget — NPC name, disposition badge, conversation area,
// dialogue option buttons with data-prompt.

import type { GmState } from '../../types';
import { esc, escapeAttr } from '../../lib/html';

const DISPOSITION_STYLES: Record<string, { bg: string; text: string }> = {
  hostile:    { bg: 'var(--ta-badge-failure-bg)', text: 'var(--ta-badge-failure-text)' },
  suspicious: { bg: 'var(--ta-color-warning-bg)', text: 'var(--ta-color-warning)' },
  neutral:    { bg: 'var(--color-border-tertiary)', text: 'var(--color-text-tertiary)' },
  friendly:   { bg: 'var(--ta-badge-success-bg)', text: 'var(--ta-badge-success-text)' },
  allied:     { bg: 'var(--ta-color-accent-bg)', text: 'var(--ta-color-accent)' },
  bonded:     { bg: 'var(--ta-color-conviction)', text: '#fff' },
};

export function renderDialogue(state: GmState | null, css: string, options?: Record<string, unknown>): string {
  // NPC can be specified via options or we pick the first present NPC
  const npcId = options?.npcId as string | undefined;
  const npc = npcId
    ? state?.rosterMutations.find(n => n.id === npcId)
    : state?.rosterMutations.find(n => n.status === 'active');

  const npcName = npc?.name ?? (options?.npcName as string) ?? 'Unknown NPC';
  const disposition = npc?.disposition ?? 'neutral';
  const dispStyle = DISPOSITION_STYLES[disposition] ?? DISPOSITION_STYLES.neutral;

  // Dialogue text and options can be passed via options.data
  const data = options?.data as { text?: string; choices?: { label: string; prompt: string }[] } | undefined;
  const dialogueText = data?.text ?? '';
  const choices = data?.choices ?? [];

  return `
<style>${css}
.widget-dialogue { font-family: var(--ta-font-body); padding: 16px; }
.dialogue-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.dialogue-npc-name { font-family: var(--ta-font-heading); font-size: 18px; font-weight: 700; color: var(--color-text-primary); }
.dialogue-disposition {
  display: inline-block; padding: 2px 10px; font-size: 10px; border-radius: 8px;
  text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;
}
.dialogue-trust { font-size: 10px; color: var(--color-text-tertiary); }
.dialogue-area {
  padding: 14px; margin-bottom: 14px;
  border-left: 3px solid var(--ta-color-accent);
  background: var(--ta-color-accent-bg);
  border-radius: 0 6px 6px 0;
  font-size: 13px; line-height: 1.6;
  color: var(--color-text-primary);
  font-style: italic;
}
.dialogue-choices { display: flex; flex-direction: column; gap: 8px; }
.dialogue-choice {
  display: block; width: 100%; text-align: left;
  padding: 10px 14px; border: 0.5px solid var(--color-border-tertiary);
  border-radius: 6px; background: transparent;
  font-family: var(--ta-font-body); font-size: 12px;
  color: var(--color-text-primary); cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.dialogue-choice:hover {
  border-color: var(--ta-color-accent);
  background: var(--ta-color-accent-bg);
}
</style>
<div class="widget-dialogue">
  <div class="dialogue-header">
    <span class="dialogue-npc-name">${esc(npcName)}</span>
    <span class="dialogue-disposition" style="background:${dispStyle.bg};color:${dispStyle.text}">${esc(disposition)}</span>
    ${npc ? `<span class="dialogue-trust">Trust: ${npc.trust}</span>` : ''}
  </div>

  ${dialogueText ? `<div class="dialogue-area">${esc(dialogueText)}</div>` : `
  <div class="dialogue-area">
    <!-- Dialogue content rendered by the GM -->
  </div>`}

  ${choices.length > 0 ? `
  <div class="dialogue-choices">
    ${choices.map(c =>
      `<button class="dialogue-choice" data-prompt="${escapeAttr(c.prompt)}">${esc(c.label)}</button>`,
    ).join('\n    ')}
  </div>
  <script>
  document.querySelectorAll('.dialogue-choice[data-prompt]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var prompt = this.getAttribute('data-prompt');
      if (typeof sendPrompt === 'function') sendPrompt(prompt);
    });
  });
  <\/script>` : ''}
</div>`;
}
