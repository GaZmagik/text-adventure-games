/** Client-side scene interaction script — progressive reveal, panels, footer, redaction. */
export const SCENE_SCRIPT_CODE = `
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
      window.tag.closePanel();
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
      overlay.addEventListener('keydown', trapPanelFocus);
      requestAnimationFrame(function() { document.getElementById('panel-title-text').focus(); });
    }
  }

  function closePanel() {
    var overlay = document.getElementById('panel-overlay');
    var sceneContent = document.getElementById('scene-content');
    overlay.style.display = 'none';
    sceneContent.style.display = 'block';
    if (overlay.removeEventListener) overlay.removeEventListener('keydown', trapPanelFocus);
    document.querySelectorAll('.footer-btn[aria-expanded]').forEach(function(b) {
      b.setAttribute('aria-expanded', 'false');
    });
    if (lastPanelTrigger) lastPanelTrigger.focus();
  }

  function trapPanelFocus(e) {
    if (e.key === 'Escape') { window.tag.closePanel(); return; }
    if (e.key !== 'Tab') return;
    var overlay = document.getElementById('panel-overlay');
    var focusables = overlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // Expose for footer buttons — namespaced under window.tag to avoid global pollution
  window.tag = window.tag || {};
  window.tag.togglePanel = togglePanel;
  window.tag.closePanel = closePanel;

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

  // Expose atmosphere helpers on window.tag (already initialised above)
  window.tag.triggerShake = triggerShake;
  window.tag.triggerFlash = triggerFlash;
  window.tag.showToast = showToast;

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
      window.tag.togglePanel(this.getAttribute('data-panel'), this);
    });
  });

  document.querySelectorAll('.footer-btn[data-prompt]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var prompt = this.getAttribute('data-prompt');
      var ta = document.createElement('textarea');
      ta.value = prompt;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (typeof sendPrompt === 'function') {
        sendPrompt(prompt);
      } else {
        var orig = this.textContent;
        this.textContent = 'Copied! Paste as your reply.';
        var self = this;
        setTimeout(function() { self.textContent = orig; }, 3000);
      }
    });
  });

  // Audio engine — only active when audio module is present
  var audioBtn = document.getElementById('audio-btn');
  if (audioBtn) {
    \${SOUNDSCAPE_ENGINE_CODE}

    var soundscape = new SoundscapeEngine();
    var soundType = audioBtn.getAttribute('data-sound') || 'ship-engine';
    var soundDuration = parseInt(audioBtn.getAttribute('data-duration') || '25', 10);

    audioBtn.addEventListener('click', function() {
      if (soundscape.playing) {
        soundscape.stop();
      } else {
        soundscape.play(soundType, soundDuration);
        audioBtn.textContent = '\u25a0 Stop';
        setTimeout(function() {
          if (!soundscape.playing) return;
          soundscape.stop();
        }, soundDuration * 1000);
      }
    });
  }
})();
`;
