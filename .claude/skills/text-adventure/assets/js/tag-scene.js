// Scene interaction script — progressive reveal, panels, footer, redaction (shadow-DOM-aware).
// CDN version: accepts root parameter for DOM queries. sendPrompt remains global (window).
// Source of truth: cli/render/lib/scene-script.ts

function initTagScene(root) {
  var continueBtn = root.getElementById('continue-reveal-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', function() {
      root.getElementById('reveal-brief').style.display = 'none';
      root.getElementById('reveal-full').style.display = 'block';
    });
  }

  var panelCloseBtn = root.getElementById('panel-close-btn');
  if (panelCloseBtn) {
    panelCloseBtn.addEventListener('click', function() {
      window.tag.closePanel();
    });
  }

  var lastPanelTrigger = null;

  function togglePanel(panelName, btn) {
    var overlay = root.getElementById('panel-overlay');
    var sceneContent = root.getElementById('scene-content');
    var panels = overlay.querySelectorAll('.panel-content');
    var title = root.getElementById('panel-title-text');

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
      requestAnimationFrame(function() { root.getElementById('panel-title-text').focus(); });
    }
  }

  function closePanel() {
    var overlay = root.getElementById('panel-overlay');
    var sceneContent = root.getElementById('scene-content');
    overlay.style.display = 'none';
    sceneContent.style.display = 'block';
    if (overlay.removeEventListener) overlay.removeEventListener('keydown', trapPanelFocus);
    root.querySelectorAll('.footer-btn[aria-expanded]').forEach(function(b) {
      b.setAttribute('aria-expanded', 'false');
    });
    if (lastPanelTrigger) lastPanelTrigger.focus();
  }

  function trapPanelFocus(e) {
    if (e.key === 'Escape') { window.tag.closePanel(); return; }
    if (e.key !== 'Tab') return;
    var overlay = root.getElementById('panel-overlay');
    var focusables = overlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    // shadowRoot.activeElement works for elements inside the shadow tree
    var active = root.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
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

  window.tag.triggerShake = triggerShake;
  window.tag.triggerFlash = triggerFlash;
  window.tag.showToast = showToast;

  // Wire up revealable redactions
  root.querySelectorAll('.atmo-redacted.revealable').forEach(function(el) {
    el.addEventListener('click', function() {
      el.classList.add('revealed');
      el.classList.remove('revealable');
    }, { once: true });
  });

  // Wire up footer panel buttons
  root.querySelectorAll('.footer-btn[data-panel]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      window.tag.togglePanel(this.getAttribute('data-panel'), this);
    });
  });

  // Wire ALL data-prompt buttons (action cards, POI, footer, etc.)
  root.querySelectorAll('[data-prompt]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var prompt = this.getAttribute('data-prompt');
      if (typeof sendPrompt === 'function') {
        sendPrompt(prompt);
      } else {
        // Fallback: copy prompt to clipboard and show feedback
        var ta = document.createElement('textarea');
        ta.value = prompt;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        var orig = this.textContent;
        this.textContent = 'Copied! Paste as your reply.';
        var self = this;
        setTimeout(function() { self.textContent = orig; }, 3000);
      }
    });
  });

  // Visible fallback when sendPrompt is not available
  if (typeof sendPrompt !== 'function') {
    var prompts = root.querySelectorAll('[data-prompt]');
    var actionPrompts = [];
    prompts.forEach(function(btn) {
      var id = btn.id || '';
      if (id === 'save-btn' || id === 'export-btn') return;
      actionPrompts.push(btn.getAttribute('data-prompt'));
    });
    if (actionPrompts.length > 0) {
      var fb = document.createElement('div');
      fb.className = 'fallback-text';
      fb.style.display = 'block';
      var heading = document.createElement('p');
      heading.style.cssText = 'margin:0 0 8px;font-weight:600;';
      heading.textContent = 'If buttons do not respond, copy one of these and paste as your reply:';
      fb.appendChild(heading);
      actionPrompts.forEach(function(p) {
        var code = document.createElement('code');
        code.style.cssText = 'display:block;margin:4px 0;padding:6px 8px;cursor:pointer;user-select:all;';
        code.textContent = p;
        code.addEventListener('click', function() {
          var ta = document.createElement('textarea');
          ta.value = p;
          ta.style.cssText = 'position:fixed;opacity:0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          this.textContent = 'Copied!';
          var self = this;
          var orig = p;
          setTimeout(function() { self.textContent = orig; }, 2000);
        });
        fb.appendChild(code);
      });
      var footer = root.querySelector('.footer-row');
      if (footer) footer.parentNode.insertBefore(fb, footer);
    }
  }

  // Audio engine — only active when audio module is present
  var audioBtn = root.getElementById('audio-btn');
  if (audioBtn && typeof SoundscapeEngine !== 'undefined') {
    var soundscape = new SoundscapeEngine(root);
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
}
