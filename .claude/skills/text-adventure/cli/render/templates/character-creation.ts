// Character creation widget — accepts --data JSON with archetype options.
// Shows archetype cards, name input, stat display, proficiency picker.
// Confirm fires sendPrompt.
//
// Archetype fields (canonical → alias):
//   description | flavour  — archetype flavour text
//   stats | baseStats      — Record<StatName, number> for stat display
//   abilities | equipment  — string[] of gear/ability names
//   fixedProficiencies     — string[] of archetype-granted proficiencies
//   primaryStats           — string[] of highlighted stat names (informational)
//   hp, ac, name, id       — standard fields

import type { GmState } from '../../types';
import { esc, serialiseInlineScriptData } from '../../lib/html';
import { COMMON_WIDGET_CSS } from '../lib/common-css';

type Archetype = {
  name: string;
  description?: string;
  flavour?: string;         // alias for description
  stats?: Record<string, number>;
  baseStats?: Record<string, number>; // alias for stats
  abilities?: string[];
  equipment?: string[];     // alias for abilities (shown as gear list)
  primaryStats?: string[];  // highlighted stat names
  fixedProficiencies?: string[]; // archetype-granted proficiencies
  hp?: number;
  ac?: number;
  id?: string;
};

export function renderCharacterCreation(_state: GmState | null, css: string, options?: Record<string, unknown>): string {
  const raw = (options?.data ?? {}) as Record<string, unknown>;
  const archetypes: Archetype[] = Array.isArray(raw.archetypes) ? raw.archetypes as Archetype[] : [];
  const proficiencies = Array.isArray(raw.proficiencies)
    ? (raw.proficiencies as unknown[]).map(String)
    : ['Athletics', 'Acrobatics', 'Stealth', 'Arcana', 'History', 'Investigation', 'Nature', 'Religion', 'Perception', 'Insight', 'Persuasion', 'Deception', 'Intimidation', 'Performance', 'Survival', 'Medicine', 'Animal Handling', 'Sleight of Hand'];
  const defaultName = typeof raw.defaultName === 'string' ? raw.defaultName : '';

  // Name pool — injected by render.ts from names.md, or empty fallback
  const namePoolRaw = (options?.namePool ?? {}) as Record<string, unknown>;
  const givenNames: string[] = Array.isArray(namePoolRaw.given) ? namePoolRaw.given as string[] : [];
  const surnames: string[] = Array.isArray(namePoolRaw.surname) ? namePoolRaw.surname as string[] : [];

  const archetypeCards = archetypes.map((arch, i) => {
    const desc = arch.description ?? arch.flavour ?? '';
    const statMap = arch.stats ?? arch.baseStats;
    const stats = statMap
      ? Object.entries(statMap).map(([k, v]) => `<span class="arch-stat">${esc(k)} ${Number(v) || 0}</span>`).join(' ')
      : '';
    const rawGear = arch.equipment ?? arch.abilities ?? [];
    const gear = rawGear.map(a => typeof a === 'string' ? a : (a && typeof a === 'object' && 'name' in a) ? String((a as Record<string, unknown>).name) : String(a));
    const gearHtml = gear.length > 0
      ? gear.map(a => `<span class="arch-ability">${esc(a)}</span>`).join(' ')
      : '';
    const fixedProfs = arch.fixedProficiencies ?? [];
    const profsHtml = fixedProfs.length > 0
      ? `<div class="arch-profs" style="margin-top:4px;font-size:10px;color:var(--color-text-tertiary);">Proficiencies: ${fixedProfs.map(p => esc(p)).join(', ')}</div>`
      : '';

    return `
      <button class="archetype-card" data-index="${i}" aria-pressed="false">
        <div class="arch-name">${esc(arch.name)}</div>
        ${desc ? `<div class="arch-desc">${esc(desc)}</div>` : ''}
        ${stats ? `<div class="arch-stats">${stats}</div>` : ''}
        ${gearHtml ? `<div class="arch-abilities">${gearHtml}</div>` : ''}
        ${profsHtml}
        ${arch.hp !== undefined ? `<div class="arch-meta">HP ${Number(arch.hp) || 0}${arch.ac !== undefined ? ` · AC ${Number(arch.ac) || 0}` : ''}</div>` : ''}
      </button>`;
  }).join('\n');

  const profOptions = proficiencies.map(p =>
    `<button class="prof-option" data-prof="${esc(p)}" aria-pressed="false">${esc(p)}</button>`,
  ).join('\n        ');

  return `
<style>${css}
${COMMON_WIDGET_CSS}
.widget-char-creation { font-family: var(--ta-font-body); padding: 16px; }
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
.name-input:focus { border-color: var(--ta-color-accent); outline: 2px solid var(--ta-color-focus); outline-offset: 2px; }
.name-error { color: var(--ta-color-danger); font-size: 11px; margin-top: 4px; display: block; }
.prof-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.prof-option {
  padding: 8px 12px; font-size: 11px; border: 0.5px solid var(--color-border-tertiary);
  border-radius: 12px; background: transparent; color: var(--color-text-secondary);
  cursor: pointer; transition: all 0.2s; min-height: 44px;
}
.prof-option:hover { border-color: var(--ta-color-accent); }
.prof-option.selected { border-color: var(--ta-color-accent); background: var(--ta-color-accent-bg); color: var(--ta-color-accent); font-weight: 600; }
.archetype-card:focus-visible, .prof-option:focus-visible {
  outline: 2px solid var(--ta-color-focus);
  outline-offset: 2px;
}
.is-hidden { display: none !important; }
</style>
<div class="widget-char-creation">
  <div class="widget-title">Create Your Character</div>
  <div class="widget-subtitle">Choose an archetype, name your character, and select proficiencies</div>

  <div class="widget-section">
    <div class="widget-label">Name</div>
    <div style="display:flex;gap:8px;align-items:center">
      <input class="name-input" id="char-name-input" type="text" placeholder="Enter character name..." value="${esc(defaultName)}" maxlength="80" style="flex:1">
      <button class="option-card" id="randomise-name" type="button" style="white-space:nowrap;flex-shrink:0" title="Generate a random name">Randomise</button>
    </div>
    <span id="name-error" class="name-error is-hidden" role="alert"></span>
  </div>

  <div class="widget-section">
    <div class="widget-label">Pronouns</div>
    <div class="option-grid" id="pronoun-grid">
      <button class="option-card" data-pronouns="she/her" aria-pressed="false">she/her</button>
      <button class="option-card" data-pronouns="he/him" aria-pressed="false">he/him</button>
      <button class="option-card" data-pronouns="they/them" aria-pressed="false">they/them</button>
      <button class="option-card" data-pronouns="custom" aria-pressed="false">Custom</button>
    </div>
    <div id="custom-pronouns" class="is-hidden" style="display:flex;margin-top:8px;gap:8px;align-items:center">
      <select id="pronoun-subject" class="name-input" style="width:auto;padding:8px 12px;font-size:12px">
        <option value="he">he</option>
        <option value="she">she</option>
        <option value="they">they</option>
      </select>
      <span style="font-size:12px;color:var(--color-text-tertiary)">/</span>
      <select id="pronoun-object" class="name-input" style="width:auto;padding:8px 12px;font-size:12px">
        <option value="him">him</option>
        <option value="her">her</option>
        <option value="them">them</option>
      </select>
    </div>
  </div>

  ${archetypes.length > 0 ? `
  <div class="widget-section">
    <div class="widget-label">Archetype</div>
    <div class="archetype-grid">
      ${archetypeCards}
    </div>
  </div>` : ''}

  <div class="widget-section">
    <div class="widget-label">Proficiencies (choose 2)</div>
    <div class="prof-grid">
      ${profOptions}
    </div>
  </div>

  <button class="confirm-btn" id="creation-confirm" title="Create character with selected name, archetype, and proficiencies">Create Character</button>
</div>
<script>
(function() {
  var selectedArchetype = -1;
  var selectedProfs = [];
  var selectedPronouns = '';
  var givenPool = ${serialiseInlineScriptData(givenNames)};
  var surnamePool = ${serialiseInlineScriptData(surnames)};

  // Archetype selection — re-query bounded card set (max ~12 nodes) — standard radio-card deselection pattern
  document.querySelectorAll('.archetype-card').forEach(function(card) {
    card.addEventListener('click', function() {
      document.querySelectorAll('.archetype-card').forEach(function(c) {
        c.classList.remove('selected');
        c.setAttribute('aria-pressed', 'false');
      });
      this.classList.add('selected');
      this.setAttribute('aria-pressed', 'true');
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
        this.setAttribute('aria-pressed', 'false');
      } else if (selectedProfs.length < 2) {
        selectedProfs.push(prof);
        this.classList.add('selected');
        this.setAttribute('aria-pressed', 'true');
      }
    });
  });

  // Pronoun selection
  document.querySelectorAll('#pronoun-grid .option-card').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('#pronoun-grid .option-card').forEach(function(b) {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      this.classList.add('selected');
      this.setAttribute('aria-pressed', 'true');
      var value = this.getAttribute('data-pronouns');
      var customDiv = document.getElementById('custom-pronouns');
      if (value === 'custom') {
        customDiv.classList.remove('is-hidden');
        var subj = document.getElementById('pronoun-subject').value;
        var obj = document.getElementById('pronoun-object').value;
        selectedPronouns = subj + '/' + obj;
      } else {
        customDiv.classList.add('is-hidden');
        selectedPronouns = value;
      }
    });
  });

  // Custom pronoun dropdowns
  document.getElementById('pronoun-subject').addEventListener('change', function() {
    selectedPronouns = this.value + '/' + document.getElementById('pronoun-object').value;
  });
  document.getElementById('pronoun-object').addEventListener('change', function() {
    selectedPronouns = document.getElementById('pronoun-subject').value + '/' + this.value;
  });

  // Randomise name
  document.getElementById('randomise-name').addEventListener('click', function() {
    if (givenPool.length > 0 && surnamePool.length > 0) {
      var g = givenPool[Math.floor(Math.random() * givenPool.length)];
      var s = surnamePool[Math.floor(Math.random() * surnamePool.length)];
      document.getElementById('char-name-input').value = g + ' ' + s;
    }
    document.getElementById('name-error').classList.add('is-hidden');
  });

  // Clear name error on input
  document.getElementById('char-name-input').addEventListener('input', function() {
    document.getElementById('name-error').textContent = '';
    document.getElementById('name-error').classList.add('is-hidden');
  });

  // Confirm
  document.getElementById('creation-confirm').addEventListener('click', function() {
    var name = document.getElementById('char-name-input').value.trim();
    if (!name) {
      document.getElementById('name-error').textContent = 'Please enter a character name.';
      document.getElementById('name-error').classList.remove('is-hidden');
      return;
    }

    var payload = {
      name: name,
      archetypeIndex: selectedArchetype,
      proficiencies: selectedProfs,
      pronouns: selectedPronouns || 'they/them'
    };
    var prompt = 'Create character: ' + JSON.stringify(payload);
    document.getElementById('creation-confirm').setAttribute('title', prompt);
    if (typeof sendPrompt === 'function') sendPrompt(prompt);
  });
})();
<\/script>`;
}
