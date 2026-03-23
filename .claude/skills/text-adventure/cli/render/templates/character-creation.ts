// Character creation widget — accepts --data JSON with archetype options.
// Shows archetype cards, name input, stat display, proficiency picker.
// Confirm fires sendPrompt.

import type { GmState } from '../../types';

interface Archetype {
  name: string;
  description?: string;
  stats?: Record<string, number>;
  abilities?: string[];
  hp?: number;
  ac?: number;
}

interface CreationData {
  archetypes?: Archetype[];
  proficiencies?: string[];
  defaultName?: string;
}

export function renderCharacterCreation(_state: GmState | null, css: string, options?: Record<string, unknown>): string {
  const data = (options?.data ?? {}) as CreationData;
  const archetypes = data.archetypes ?? [];
  const proficiencies = data.proficiencies ?? ['Athletics', 'Acrobatics', 'Stealth', 'Arcana', 'History', 'Investigation', 'Nature', 'Religion', 'Perception', 'Insight', 'Persuasion', 'Deception', 'Intimidation', 'Performance', 'Survival', 'Medicine', 'Animal Handling', 'Sleight of Hand'];
  const defaultName = data.defaultName ?? '';

  const archetypeCards = archetypes.map((arch, i) => {
    const stats = arch.stats
      ? Object.entries(arch.stats).map(([k, v]) => `<span class="arch-stat">${esc(k)} ${v}</span>`).join(' ')
      : '';
    const abilities = arch.abilities
      ? arch.abilities.map(a => `<span class="arch-ability">${esc(a)}</span>`).join(' ')
      : '';

    return `
      <div class="archetype-card" data-index="${i}">
        <div class="arch-name">${esc(arch.name)}</div>
        ${arch.description ? `<div class="arch-desc">${esc(arch.description)}</div>` : ''}
        ${stats ? `<div class="arch-stats">${stats}</div>` : ''}
        ${abilities ? `<div class="arch-abilities">${abilities}</div>` : ''}
        ${arch.hp !== undefined ? `<div class="arch-meta">HP ${arch.hp}${arch.ac !== undefined ? ` · AC ${arch.ac}` : ''}</div>` : ''}
      </div>`;
  }).join('\n');

  const profOptions = proficiencies.map(p =>
    `<button class="prof-option" data-prof="${escAttr(p)}">${esc(p)}</button>`,
  ).join('\n        ');

  return `
<style>${css}
.widget-char-creation { font-family: var(--ta-font-body); padding: 16px; }
.creation-title { font-family: var(--ta-font-heading); font-size: 22px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px; }
.creation-subtitle { font-size: 12px; color: var(--color-text-tertiary); margin-bottom: 20px; }
.creation-section { margin-bottom: 16px; }
.creation-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-tertiary); margin-bottom: 8px; }
.archetype-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.archetype-card {
  padding: 14px; border: 0.5px solid var(--color-border-tertiary);
  border-radius: 8px; cursor: pointer; transition: all 0.2s;
}
.archetype-card:hover { border-color: var(--ta-color-accent); }
.archetype-card.selected { border-color: var(--ta-color-accent); background: var(--ta-color-accent-bg); }
.arch-name { font-family: var(--ta-font-heading); font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px; }
.arch-desc { font-size: 11px; color: var(--color-text-secondary); line-height: 1.4; margin-bottom: 6px; }
.arch-stats { margin-bottom: 4px; }
.arch-stat { display: inline-block; padding: 1px 6px; font-size: 10px; border-radius: 4px; background: var(--color-border-tertiary); color: var(--color-text-primary); margin-right: 4px; font-weight: 600; }
.arch-abilities { margin-bottom: 4px; }
.arch-ability { display: inline-block; padding: 1px 6px; font-size: 10px; border-radius: 4px; background: var(--ta-color-accent-bg); color: var(--ta-color-accent); margin-right: 4px; }
.arch-meta { font-size: 10px; color: var(--color-text-tertiary); }
.name-input {
  width: 100%; padding: 10px 14px; font-family: var(--ta-font-body);
  font-size: 14px; background: transparent;
  border: 0.5px solid var(--color-border-tertiary); border-radius: 6px;
  color: var(--color-text-primary); box-sizing: border-box;
}
.name-input:focus { border-color: var(--ta-color-accent); outline: none; }
.prof-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.prof-option {
  padding: 4px 10px; font-size: 11px; border: 0.5px solid var(--color-border-tertiary);
  border-radius: 12px; background: transparent; color: var(--color-text-secondary);
  cursor: pointer; transition: all 0.2s;
}
.prof-option:hover { border-color: var(--ta-color-accent); }
.prof-option.selected { border-color: var(--ta-color-accent); background: var(--ta-color-accent-bg); color: var(--ta-color-accent); font-weight: 600; }
.confirm-btn {
  display: block; width: 100%; margin-top: 20px; padding: 12px;
  font-family: var(--ta-font-heading); font-size: 14px; font-weight: 700;
  background: var(--ta-color-accent); color: #fff; border: none;
  border-radius: 8px; cursor: pointer; text-transform: uppercase;
  letter-spacing: 0.08em; transition: background 0.2s;
}
.confirm-btn:hover { background: var(--ta-color-accent-hover); }
</style>
<div class="widget-char-creation">
  <div class="creation-title">Create Your Character</div>
  <div class="creation-subtitle">Choose an archetype, name your character, and select proficiencies</div>

  <div class="creation-section">
    <div class="creation-label">Name</div>
    <input class="name-input" id="char-name-input" type="text" placeholder="Enter character name..." value="${escAttr(defaultName)}">
  </div>

  ${archetypes.length > 0 ? `
  <div class="creation-section">
    <div class="creation-label">Archetype</div>
    <div class="archetype-grid">
      ${archetypeCards}
    </div>
  </div>` : ''}

  <div class="creation-section">
    <div class="creation-label">Proficiencies (choose 2)</div>
    <div class="prof-grid">
      ${profOptions}
    </div>
  </div>

  <button class="confirm-btn" id="creation-confirm">Create Character</button>
</div>
<script>
(function() {
  var selectedArchetype = -1;
  var selectedProfs = [];

  // Archetype selection
  document.querySelectorAll('.archetype-card').forEach(function(card) {
    card.addEventListener('click', function() {
      document.querySelectorAll('.archetype-card').forEach(function(c) { c.classList.remove('selected'); });
      this.classList.add('selected');
      selectedArchetype = parseInt(this.getAttribute('data-index'), 10);
    });
  });

  // Proficiency selection (max 2)
  document.querySelectorAll('.prof-option').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var prof = this.getAttribute('data-prof');
      var idx = selectedProfs.indexOf(prof);
      if (idx >= 0) {
        selectedProfs.splice(idx, 1);
        this.classList.remove('selected');
      } else if (selectedProfs.length < 2) {
        selectedProfs.push(prof);
        this.classList.add('selected');
      }
    });
  });

  // Confirm
  document.getElementById('creation-confirm').addEventListener('click', function() {
    var name = document.getElementById('char-name-input').value.trim();
    if (!name) { alert('Please enter a character name.'); return; }

    var payload = {
      name: name,
      archetypeIndex: selectedArchetype,
      proficiencies: selectedProfs
    };
    var prompt = 'Create character: ' + JSON.stringify(payload);
    if (typeof sendPrompt === 'function') sendPrompt(prompt);
  });
})();
<\/script>`;
}

function esc(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escAttr(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
