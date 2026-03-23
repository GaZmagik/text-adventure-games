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
      toast.addEventListener('transitionend', function() { toast.remove(); }, { once: true });
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
      togglePanel(this.getAttribute('data-panel'));
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
    var SoundscapeEngine = function() {
      this.ctx = null; this.nodes = []; this.playing = false; this.timeout = null;
    };
    SoundscapeEngine.prototype.init = function() {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    };
    SoundscapeEngine.prototype.play = function(type, duration) {
      this.init(); this.stop();
      duration = Math.min(duration || 25, 30);
      var generators = {
        'ship-engine': function(e) { e.genDrone(45, 0.15, duration); e.genNoise('lowpass', 150, 0.08, duration); },
        'rain': function(e) { e.genNoise('bandpass', 1000, 0.15, duration); },
        'wind': function(e) { e.genNoise('bandpass', 400, 0.12, duration); },
        'forest': function(e) { e.genNoise('bandpass', 2000, 0.08, duration); },
        'mechanical': function(e) { e.genDrone(80, 0.09, duration); },
        'terminal': function(e) { e.genNoise('highpass', 3000, 0.08, duration); },
        'alarm': function(e) { e.genAlarm(440, 880, 0.2, duration); },
        'silence': function(e) { e.genNoise('lowpass', 100, 0.02, duration); },
      };
      var gen = generators[type] || generators['silence'];
      gen(this);
      this.playing = true;
      var self = this;
      this.timeout = setTimeout(function() { self.stop(); }, duration * 1000);
    };
    SoundscapeEngine.prototype.stop = function() {
      this.nodes.forEach(function(n) { try { n.stop(); } catch(e) {} try { n.disconnect(); } catch(e) {} });
      this.nodes = []; this.playing = false;
      if (this.timeout) { clearTimeout(this.timeout); this.timeout = null; }
      var btn = document.getElementById('audio-btn');
      if (btn) btn.textContent = '\\u266b Play';
    };
    SoundscapeEngine.prototype.genDrone = function(freq, vol, dur) {
      var osc = this.ctx.createOscillator(); var gain = this.ctx.createGain();
      var lfo = this.ctx.createOscillator(); var lfoGain = this.ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      lfo.type = 'sine'; lfo.frequency.value = 0.2; lfoGain.gain.value = 3;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      osc.connect(gain); gain.gain.value = vol; gain.connect(this.ctx.destination);
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 2);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + dur);
      osc.start(); lfo.start(); this.nodes.push(osc, lfo);
    };
    SoundscapeEngine.prototype.genNoise = function(filterType, freq, vol, dur) {
      var bufSize = this.ctx.sampleRate * dur;
      var buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      var source = this.ctx.createBufferSource(); source.buffer = buffer;
      var filter = this.ctx.createBiquadFilter(); filter.type = filterType; filter.frequency.value = freq;
      var gain = this.ctx.createGain(); gain.gain.value = vol;
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 1);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + dur);
      source.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
      source.start(); this.nodes.push(source);
    };
    SoundscapeEngine.prototype.genAlarm = function(f1, f2, vol, dur) {
      var osc = this.ctx.createOscillator(); var gain = this.ctx.createGain();
      osc.type = 'square'; gain.gain.value = vol;
      osc.connect(gain); gain.connect(this.ctx.destination);
      for (var i = 0; i < Math.floor(dur); i++) osc.frequency.setValueAtTime(i % 2 === 0 ? f1 : f2, this.ctx.currentTime + i);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + dur);
      osc.start(); this.nodes.push(osc);
    };

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
