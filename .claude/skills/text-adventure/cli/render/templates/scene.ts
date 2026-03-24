// Scene widget — full scene skeleton with progressive reveal, panel overlay,
// scene-meta hidden div, and composed footer. This is the main game widget.

import type { GmState } from '../../types';
import { esc } from '../../lib/html';
import { VERSION } from '../../lib/version';
import { renderFooter } from './footer';
import { SOUNDSCAPE_ENGINE_CODE } from '../lib/soundscape';

export function renderScene(state: GmState | null, css: string, options?: Record<string, unknown>): string {
  const char = state?.character;
  const room = state?.currentRoom ?? 'Unknown Location';
  const scene = state?.scene ?? 0;
  const time = state?.time;
  const modules = state?.modulesActive ?? [];

  // Build scene-meta JSON
  const sceneMeta = JSON.stringify({
    skill_version: VERSION,
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
    <p class="brief-text">Scene ${scene}: You find yourself in ${esc(room)}.</p>
    <button class="continue-btn" id="continue-reveal-btn">Continue</button>
  </div>
  <div id="reveal-full" style="display:none">
    <div id="scene-content">
      <div class="loc-bar">
        <span class="loc-name">${esc(room)}</span>
        ${time ? `<span class="loc-time">${esc(time.period)} — ${esc(time.date)}</span>` : ''}
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
    <div id="panel-overlay" role="dialog" aria-modal="true" aria-labelledby="panel-title-text" style="display:none">
      <div class="panel-header">
        <span class="panel-title" id="panel-title-text" tabindex="-1"></span>
        <button class="panel-close-btn" id="panel-close-btn">Close</button>
      </div>
      <div class="panel-content" data-panel="character"></div>
      ${panelDivs}
    </div>
  </div>
  <!-- Scene metadata (hidden, machine-readable) -->
  <div id="scene-meta" style="display:none" data-meta='${esc(sceneMeta)}'></div>
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

  var lastPanelTrigger = null;

  function togglePanel(panelName, btn) {
    var overlay = document.getElementById('panel-overlay');
    var sceneContent = document.getElementById('scene-content');
    var panels = overlay.querySelectorAll('.panel-content');
    var title = document.getElementById('panel-title-text');

    panels.forEach(function(p) { p.style.display = 'none'; });

    var target = null;
    panels.forEach(function(p) { if (p.dataset && p.dataset.panel === panelName) target = p; });
    if (target) {
      if (btn) lastPanelTrigger = btn;
      target.style.display = 'block';
      title.textContent = panelName.charAt(0).toUpperCase() + panelName.slice(1);
      overlay.style.display = 'block';
      sceneContent.style.display = 'none';
      if (btn) btn.setAttribute('aria-expanded', 'true');
      document.getElementById('panel-title-text').focus();
    }
  }

  function closePanel() {
    var overlay = document.getElementById('panel-overlay');
    var sceneContent = document.getElementById('scene-content');
    overlay.style.display = 'none';
    sceneContent.style.display = 'block';
    document.querySelectorAll('.footer-btn[aria-expanded]').forEach(function(b) {
      b.setAttribute('aria-expanded', 'false');
    });
    if (lastPanelTrigger) lastPanelTrigger.focus();
  }

  // Expose for footer buttons
  window.togglePanel = togglePanel;
  window.closePanel = closePanel;

  // Atmosphere helpers — screen shake and colour flash
  function triggerShake(el) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.classList.add('atmo-shake');
    el.addEventListener('animationend', function() {
      el.classList.remove('atmo-shake');
    }, { once: true });
  }

  function triggerFlash(el, cssColorVar, durationMs) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    durationMs = durationMs || 300;
    var flash = document.createElement('div');
    flash.className = 'atmo-flash';
    flash.style.background = 'var(' + cssColorVar + ')';
    flash.style.animationDuration = durationMs + 'ms';
    el.appendChild(flash);
    flash.addEventListener('animationend', function() { flash.remove(); }, { once: true });
  }

  function showToast(el, message, durationMs) {
    durationMs = durationMs || 3000;
    var toast = document.createElement('div');
    toast.className = 'atmo-toast';
    toast.textContent = message;
    el.appendChild(toast);
    toast.getBoundingClientRect();
    toast.classList.add('visible');
    setTimeout(function() {
      toast.classList.remove('visible');
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        toast.remove();
      } else {
        toast.addEventListener('transitionend', function() { toast.remove(); }, { once: true });
      }
    }, durationMs);
  }

  // Expose atmosphere helpers for inline event handlers
  window.triggerShake = triggerShake;
  window.triggerFlash = triggerFlash;
  window.showToast = showToast;

  // Wire up revealable redactions
  document.querySelectorAll('.atmo-redacted.revealable').forEach(function(el) {
    el.addEventListener('click', function() {
      el.classList.add('revealed');
      el.classList.remove('revealable');
    }, { once: true });
  });

  // Wire up footer panel buttons
  document.querySelectorAll('.footer-btn[data-panel]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      togglePanel(this.getAttribute('data-panel'), this);
    });
  });

  document.querySelectorAll('.footer-btn[data-prompt]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var prompt = this.getAttribute('data-prompt');
      if (typeof sendPrompt === 'function') sendPrompt(prompt);
    });
  });

  // Audio engine — only active when audio module is present
  var audioBtn = document.getElementById('audio-btn');
  if (audioBtn) {
    ${SOUNDSCAPE_ENGINE_CODE}

    var soundscape = new SoundscapeEngine();
    var soundType = audioBtn.getAttribute('data-sound') || 'ship-engine';
    var soundDuration = parseInt(audioBtn.getAttribute('data-duration') || '25', 10);

    audioBtn.addEventListener('click', function() {
      if (soundscape.playing) {
        soundscape.stop();
      } else {
        soundscape.play(soundType, soundDuration);
        audioBtn.textContent = '\\u25a0 Stop';
        setTimeout(function() {
          if (!soundscape.playing) return;
          soundscape.stop();
        }, soundDuration * 1000);
      }
    });
  }
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
