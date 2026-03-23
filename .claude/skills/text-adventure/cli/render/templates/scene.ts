// Scene widget — full scene skeleton with progressive reveal, panel overlay,
// scene-meta hidden div, and composed footer. This is the main game widget.

import type { GmState } from '../../types';
import { renderFooter } from './footer';

export function renderScene(state: GmState | null, css: string, options?: Record<string, unknown>): string {
  const char = state?.character;
  const room = state?.currentRoom ?? 'Unknown Location';
  const scene = state?.scene ?? 0;
  const time = state?.time;
  const modules = state?.modulesActive ?? [];

  // Build scene-meta JSON
  const sceneMeta = JSON.stringify({
    skill_version: '1.3.0',
    arc: state?.arc ?? 1,
    theme: state?.theme ?? 'fantasy',
    mode: 'procedural',
    scene,
    type: 'exploration',
    location: room,
    time: time ? {
      period: time.period,
      date: time.date,
      elapsed: time.elapsed,
      hour: time.hour,
    } : null,
    modules_active: modules,
    npcs_present: [],
    threads_advanced: [],
    pending_rolls: [],
  });

  // Build panel-content divs for active modules
  const panelDivs = buildPanelDivs(modules);

  // Compose the footer (without its own <style> — we include CSS once at the top)
  const footerHtml = renderFooter(state, '', options);

  return `
<style>${css}
#panel-overlay { display: none; padding: 0; }
.panel-header {
  display: flex; align-items: baseline; justify-content: space-between;
  padding-bottom: 10px; margin-bottom: 12px;
  border-bottom: 0.5px solid var(--color-border-tertiary);
}
.panel-title {
  font-family: var(--ta-font-heading);
  font-size: 18px; font-weight: 600; color: var(--color-text-primary);
}
.panel-close-btn {
  font-family: var(--ta-font-body);
  font-size: 11px; letter-spacing: 0.08em;
  background: transparent; border: 0.5px solid var(--color-border-tertiary);
  border-radius: var(--border-radius-md); padding: 8px 14px;
  min-height: 44px; min-width: 44px; box-sizing: border-box;
  color: var(--color-text-tertiary); cursor: pointer;
}
.panel-close-btn:hover { border-color: var(--color-border-secondary); color: var(--color-text-secondary); }
.panel-content { display: none; }
</style>
<div class="root">
  <!-- Progressive reveal -->
  <div id="reveal-brief">
    <p class="brief-text">Scene ${scene}: You find yourself in ${escapeHtml(room)}.</p>
    <button class="continue-btn" id="continue-reveal-btn">Continue</button>
  </div>
  <div id="reveal-full" style="display:none">
    <div id="scene-content">
      <div class="loc-bar">
        <span class="loc-name">${escapeHtml(room)}</span>
        ${time ? `<span class="loc-time">${escapeHtml(time.period)} — ${escapeHtml(time.date)}</span>` : ''}
      </div>
      <div class="atmo-strip">
        <span class="atmo-visual">The scene unfolds before you...</span>
      </div>
      <div id="narrative">
        <p><!-- Narrative content rendered by the GM --></p>
      </div>
      <div class="status-bar">
        ${char ? `<span class="hp-display">HP ${char.hp}/${char.maxHp}</span>
        <span class="ac-display">AC ${char.ac}</span>
        <span class="level-display">Lv ${char.level}</span>` : ''}
      </div>
    </div>
    <div id="panel-overlay" style="display:none">
      <div class="panel-header">
        <span class="panel-title"></span>
        <button class="panel-close-btn" id="panel-close-btn">Close</button>
      </div>
      <div class="panel-content" data-panel="character"></div>
      ${panelDivs}
    </div>
  </div>
  <!-- Scene metadata (hidden, machine-readable) -->
  <div id="scene-meta" style="display:none" data-meta='${escapeAttr(sceneMeta)}'></div>
  <!-- Footer -->
  ${footerHtml}
</div>
<script>
(function() {
  var continueBtn = document.getElementById('continue-reveal-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', function() {
      document.getElementById('reveal-brief').style.display = 'none';
      document.getElementById('reveal-full').style.display = 'block';
    });
  }

  var panelCloseBtn = document.getElementById('panel-close-btn');
  if (panelCloseBtn) {
    panelCloseBtn.addEventListener('click', function() {
      closePanel();
    });
  }

  function togglePanel(panelName) {
    var overlay = document.getElementById('panel-overlay');
    var sceneContent = document.getElementById('scene-content');
    var panels = overlay.querySelectorAll('.panel-content');
    var title = overlay.querySelector('.panel-title');

    panels.forEach(function(p) { p.style.display = 'none'; });

    var target = overlay.querySelector('[data-panel="' + panelName + '"]');
    if (target) {
      target.style.display = 'block';
      title.textContent = panelName.charAt(0).toUpperCase() + panelName.slice(1);
      overlay.style.display = 'block';
      sceneContent.style.display = 'none';
    }
  }

  function closePanel() {
    var overlay = document.getElementById('panel-overlay');
    var sceneContent = document.getElementById('scene-content');
    overlay.style.display = 'none';
    sceneContent.style.display = 'block';
  }

  // Expose for footer buttons
  window.togglePanel = togglePanel;
  window.closePanel = closePanel;

  // Wire up footer panel buttons
  document.querySelectorAll('.footer-btn[data-panel]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      togglePanel(this.getAttribute('data-panel'));
    });
  });

  document.querySelectorAll('.footer-btn[data-prompt]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var prompt = this.getAttribute('data-prompt');
      if (typeof sendPrompt === 'function') sendPrompt(prompt);
    });
  });
})();
</script>`;
}

/** Build panel-content divs for active modules */
function buildPanelDivs(modules: string[]): string {
  const mapping: Record<string, string> = {
    'lore-codex': 'codex',
    'ship-systems': 'ship',
    'crew-manifest': 'crew',
    'star-chart': 'nav',
    'geo-map': 'map',
    'core-systems': 'quests',
  };

  return modules
    .filter(m => m in mapping)
    .map(m => `<div class="panel-content" data-panel="${mapping[m]}"></div>`)
    .join('\n      ');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
