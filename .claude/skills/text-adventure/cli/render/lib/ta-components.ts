/** Web Components bundle for Text Adventure widgets. Served via CDN. */
export const TA_COMPONENTS_CODE = `
(function() {
  if (typeof window === 'undefined' || typeof HTMLElement === 'undefined') return;

  window.tag = window.tag || {};

  function sendOrCopyPrompt(btn, prompt) {
    if (!prompt) return;
    btn.setAttribute('title', prompt);
    if (typeof sendPrompt === 'function') {
      sendPrompt(prompt);
      return;
    }
    var orig = btn.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(prompt).then(function() {
        btn.textContent = 'Copied! Paste as your reply.';
        setTimeout(function() { btn.textContent = orig; }, 3000);
      }).catch(function() {
        btn.textContent = 'Copy the prompt from the tooltip.';
        setTimeout(function() { btn.textContent = orig; }, 3000);
      });
      return;
    }
    var ta = document.createElement('textarea');
    var copied = false;
    ta.value = prompt;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { copied = !!document.execCommand('copy'); } catch (_err) {}
    document.body.removeChild(ta);
    btn.textContent = copied ? 'Copied! Paste as your reply.' : 'Copy the prompt from the tooltip.';
    setTimeout(function() { btn.textContent = orig; }, 3000);
  }

  window.tag.sendOrCopyPrompt = sendOrCopyPrompt;

  // TaTts
  class TaTts extends HTMLElement {
    constructor() {
      super();
      this._synth = window.speechSynthesis || null;
      this._idx = 0;
      this._els = [];
      this._playing = false;
      this._voice = null;
      this._rate = 1;
      this._voicesChangedHandler = null;
      this.attachShadow({ mode: 'open' });
      this._render();
      if (this._synth) {
        this._loadVoices();
        if (typeof this._synth.onvoiceschanged !== 'undefined') {
          this._voicesChangedHandler = this._loadVoices.bind(this);
          this._synth.onvoiceschanged = this._voicesChangedHandler;
        }
      }
    }

    connectedCallback() {
      this._collectEls();
      this._wireControls();
    }

    _collectEls() {
      var rawSel = this.getAttribute('nar-selector') || '.narrative p, .prose p, .dlg p, .flash';
      var selector = /^[a-zA-Z0-9 .#,\-_>+~:*]+$/.test(rawSel) ? rawSel : '.narrative p, .prose p, .dlg p, .flash';
      var scope = this.closest('.root, [data-scene]') || document;
      var all = Array.from(scope.querySelectorAll(selector));
      this._els = all.filter(function(el) { return !el.closest('.sp'); });
    }

    _loadVoices() {
      var voices = this._synth.getVoices();
      if (!voices.length) return;
      var preferred = ['Google UK English Male', 'Google UK English'];
      var found = null;
      for (var i = 0; i < preferred.length && !found; i++) {
        for (var j = 0; j < voices.length; j++) {
          if (voices[j].name === preferred[i]) { found = voices[j]; break; }
        }
      }
      if (!found) {
        for (var k = 0; k < voices.length; k++) {
          if (voices[k].lang === 'en-GB') { found = voices[k]; break; }
        }
      }
      if (!found) {
        for (var m = 0; m < voices.length; m++) {
          if (voices[m].lang && voices[m].lang.slice(0, 2) === 'en') { found = voices[m]; break; }
        }
      }
      if (!found && voices.length) found = voices[0];
      this._voice = found;
      var label = found ? found.name.replace(/Google |Microsoft |Apple /g, '') : '';
      var voiceEl = this.shadowRoot.querySelector('.tts-voice-label');
      if (voiceEl) voiceEl.textContent = label;
    }

    _render() {
      this.shadowRoot.innerHTML =
        '<style>' +
        ':host { display: block; }' +
        '.tts-bar { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.75rem;' +
        ' background: var(--ta-color-surface, #1a1a2e); border: 1px solid var(--ta-color-border, #333);' +
        ' border-radius: 6px; }' +
        'button { background: none; border: none; cursor: pointer; color: var(--ta-color-fg, #eee);' +
        ' padding: 0.25rem 0.5rem; }' +
        'button:hover { color: var(--ta-color-accent, #9bf); }' +
        '.tts-voice-label { font-size: 0.75em; opacity: 0.7; flex: 1; overflow: hidden;' +
        ' text-overflow: ellipsis; white-space: nowrap; }' +
        'select { background: var(--ta-color-surface, #1a1a2e); color: var(--ta-color-fg, #eee);' +
        ' border: 1px solid var(--ta-color-border, #333); border-radius: 4px; font-size: 0.8em; }' +
        '</style>' +
        '<div class="tts-bar">' +
        '<button class="tts-play-btn" aria-label="Play narration">&#9654;</button>' +
        '<span class="tts-voice-label"></span>' +
        '<select class="tts-speed" aria-label="Speed">' +
        '<option value="0.85">0.85x</option>' +
        '<option value="1" selected>1x</option>' +
        '<option value="1.15">1.15x</option>' +
        '<option value="1.5">1.5x</option>' +
        '</select>' +
        '</div>';
    }

    _wireControls() {
      var self = this;
      var playBtn = this.shadowRoot.querySelector('.tts-play-btn');
      var speedSel = this.shadowRoot.querySelector('.tts-speed');
      if (playBtn) {
        playBtn.addEventListener('click', function() {
          if (!self._synth) return;
          if (self._playing) { self._pause(); } else { self._resume(); }
        });
      }
      if (speedSel) {
        speedSel.addEventListener('change', function() {
          self._rate = parseFloat(this.value);
          if (self._playing) { self._synth.cancel(); self._speak(self._idx); }
        });
      }
    }

    _speak(idx) {
      if (!this._synth) return;
      if (!this._els.length) this._collectEls();
      if (idx >= this._els.length) { this._stop(); return; }
      this._idx = idx;
      this._setActive(idx);
      var el = this._els[idx];
      var utter = new SpeechSynthesisUtterance(el.textContent || '');
      if (this._voice) utter.voice = this._voice;
      utter.rate = this._rate;
      var self = this;
      utter.onend = function() { self._speak(self._idx + 1); };
      utter.onerror = function() { self._stop(); };
      this._synth.speak(utter);
      this._playing = true;
      this._updatePlayBtn();
    }

    _pause() {
      if (!this._synth) return;
      this._synth.pause();
      this._playing = false;
      this._updatePlayBtn();
    }

    _resume() {
      if (!this._synth) return;
      if (!this._synth.speaking && !this._synth.paused) { this._speak(this._idx || 0); return; }
      this._synth.resume();
      var self = this;
      setTimeout(function() {
        if (!self._synth.speaking) { self._speak(self._idx); }
      }, 50);
      this._playing = true;
      this._updatePlayBtn();
    }

    _stop() {
      if (this._synth) this._synth.cancel();
      this._playing = false;
      this._idx = 0;
      this._clearActive();
      this._updatePlayBtn();
    }

    _setActive(idx) {
      this._els.forEach(function(el, i) { el.classList.toggle('tts-active', i === idx); });
      var activeEl = this._els[idx];
      if (activeEl && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    _clearActive() {
      this._els.forEach(function(el) { el.classList.remove('tts-active'); });
    }

    _updatePlayBtn() {
      var btn = this.shadowRoot.querySelector('.tts-play-btn');
      if (!btn) return;
      if (this._playing) {
        btn.setAttribute('aria-label', 'Pause narration');
        btn.innerHTML = '&#9646;&#9646;';
      } else {
        btn.setAttribute('aria-label', 'Play narration');
        btn.innerHTML = '&#9654;';
      }
    }

    disconnectedCallback() {
      this._stop();
      if (this._synth && this._voicesChangedHandler) {
        this._synth.onvoiceschanged = null;
        this._voicesChangedHandler = null;
      }
    }
  }

  // TaTicker
  class TaTicker extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
      try {
        var period = this.getAttribute('data-period') || 'unknown';
        var date = this.getAttribute('data-date') || 'Date unknown';
        var hour = this.getAttribute('data-hour');
        var deadlineLabel = this.getAttribute('data-deadline-label');
        var deadlineRemaining = this.getAttribute('data-deadline-remaining');

        var showTime = period !== 'unknown';
        var showDate = date !== 'Date unknown';

        var html = '<style>' +
          ':host { display: block; }' +
          '.widget-ticker { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; font-family: var(--ta-font-body); font-size: 12px; letter-spacing: 0.06em; border-bottom: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); color: var(--sta-text-secondary, #9AA0C0); }' +
          '.ticker-period { text-transform: uppercase; font-weight: 600; color: var(--ta-color-accent); }' +
          '.ticker-date { color: var(--sta-text-tertiary, #545880); }' +
          '.ticker-deadline { color: var(--ta-color-warning); font-weight: 600; }' +
          '</style><div class="widget-ticker">';
          
        if (showTime) {
          var timeStr = period;
          if (hour) timeStr += ' (' + String(hour).padStart(2, '0') + ':00)';
          html += '<span class="ticker-period">' + timeStr + '</span>';
        } else {
          html += '<span class="ticker-period">???</span>';
        }
        
        html += '<span class="ticker-date">' + date + '</span>';
        
        if (deadlineLabel) {
          var rem = parseInt(deadlineRemaining, 10) || 0;
          var label = rem === 1 ? 'scene' : 'scenes';
          html += '<span class="ticker-deadline" aria-live="polite">' + deadlineLabel + ' &mdash; ' + rem + ' ' + label + ' remaining</span>';
        }
        html += '</div>';

        this.shadowRoot.innerHTML = html;
      } catch (e) {
        this.innerHTML = '<div>Error rendering ta-ticker</div>';
      }
    }
  }

  // TaFooter
  class TaFooter extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
      try {
        var modules = (this.getAttribute('data-modules') || '').split(' ').filter(Boolean);
        var hasExport = this.getAttribute('data-has-export') === 'true';
        var hasAudio = this.getAttribute('data-has-audio') === 'true';
        var levelupPending = this.getAttribute('data-levelup-pending') === 'true';
        var dimPanels = (this.getAttribute('data-dim-panels') || '').split(' ').filter(Boolean);

        var modMap = {
          'lore-codex': { panel: 'codex', label: 'Codex' },
          'ship-systems': { panel: 'ship', label: 'Ship' },
          'crew-manifest': { panel: 'crew', label: 'Crew' },
          'star-chart': { panel: 'nav', label: 'Nav chart' },
          'geo-map': { panel: 'map', label: 'Map' },
          'core-systems': { panel: 'quests', label: 'Quests' }
        };

        var leftHtml = '<button class="footer-btn" data-panel="character" aria-expanded="false">Character</button>';
        
        modules.forEach(function(m) {
          if (modMap[m]) {
            var isDim = dimPanels.indexOf(modMap[m].panel) > -1;
            leftHtml += '<button class="footer-btn' + (isDim ? ' footer-btn-dim' : '') + '" data-panel="' + modMap[m].panel + '" aria-expanded="false">' + modMap[m].label + '</button>';
          }
        });

        if (levelupPending) {
          leftHtml += '<button class="footer-btn footer-btn-levelup" data-panel="levelup" aria-expanded="false">✦ Level Up</button>';
        }

        if (hasAudio) {
          leftHtml += '<button class="footer-btn" id="audio-btn" data-sound="ship-engine" data-duration="25">\u266b Play</button>';
        }

        var savePrompt = 'Run \`tag save generate\` via the Bash tool to produce my save payload. The CLI generates the checksummed SF2 string — never hand-code save encoding, checksums, or base64. Present the result as a downloadable .save.md file with YAML frontmatter.';
        var rightHtml = '<button class="footer-btn" id="save-btn" data-prompt="' + savePrompt + '" title="' + savePrompt + '">Save \u2197</button>';

        if (hasExport) {
          var exportPrompt = 'Export my world as a downloadable .lore.md file following the exact format in modules/adventure-exporting.md. Use YAML frontmatter plus structured world data sections. Never invent a custom format.';
          rightHtml += '<button class="footer-btn" id="export-btn" data-prompt="' + exportPrompt + '" title="' + exportPrompt + '">Export \u2197</button>';
        }

        var html = '<style>' +
          ':host { display: block; }' +
          '.footer-row { display: flex; justify-content: space-between; align-items: flex-end; padding: 12px 16px; background: rgba(84,88,128,0.06); border-top: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); gap: 16px; margin-top: auto; }' +
          '.footer-left { display: flex; flex-wrap: wrap; gap: 8px; flex: 1; }' +
          '.footer-right { display: flex; gap: 8px; flex-shrink: 0; }' +
          '.footer-btn { font-family: var(--ta-font-body); font-size: 11px; letter-spacing: 0.08em; background: transparent; border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); border-radius: var(--sta-radius-md, 6px); padding: 8px 14px; min-height: 44px; box-sizing: border-box; color: var(--sta-text-tertiary, #545880); cursor: pointer; text-transform: uppercase; white-space: nowrap; transition: all 0.2s; }' +
          '.footer-btn:hover { border-color: var(--sta-border-secondary, rgba(154,160,192,0.35)); color: var(--sta-text-secondary, #9AA0C0); }' +
          '.footer-btn[aria-expanded="true"] { border-color: var(--ta-color-accent); color: var(--ta-color-accent); font-weight: 600; background: var(--ta-color-accent-bg); }' +
          '.footer-btn:focus-visible { outline: 2px solid var(--ta-color-focus, #4ECDC4); outline-offset: 2px; }' +
          '.footer-btn-dim { opacity: 0.4; }' +
          '.footer-btn-dim:hover { opacity: 0.6; background: transparent; }' +
          '.footer-btn-levelup { color: var(--ta-color-accent, #4ECDC4); border-color: var(--ta-color-accent, #4ECDC4); animation: levelup-pulse 2s ease-in-out infinite; }' +
          '.footer-btn-levelup:hover { background: var(--ta-color-accent-bg); }' +
          '@keyframes levelup-pulse { 0%,100% { box-shadow: 0 0 4px var(--ta-color-accent, #4ECDC4); } 50% { box-shadow: 0 0 12px var(--ta-color-accent, #4ECDC4), 0 0 24px rgba(78,205,196,0.3); } }' +
          '@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }' +
          '</style>' +
          '<div class="footer-row"><div class="footer-left">' + leftHtml + '</div><div class="footer-right">' + rightHtml + '</div></div>';

        this.shadowRoot.innerHTML = html;
        
        var self = this;
        this.shadowRoot.querySelectorAll('.footer-btn[data-panel]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            if (window.tag && window.tag.togglePanel) {
              window.tag.togglePanel(this.getAttribute('data-panel'), this);
            }
          });
        });
        this.shadowRoot.querySelectorAll('[data-prompt]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            if (this.getAttribute('aria-disabled') === 'true' || this.getAttribute('disabled') !== null) return;
            var prompt = this.getAttribute('data-prompt');
            window.tag.sendOrCopyPrompt(this, prompt);
          });
        });
      } catch (e) {
        this.innerHTML = '<div>Error rendering ta-footer</div>';
      }
    }
  }

  // TaLevelup
  class TaLevelup extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
      try {
        var charName = this.getAttribute('data-char-name') || 'Adventurer';
        var level = this.getAttribute('data-level') || '1';
        var hp = this.getAttribute('data-hp') || '?';
        var maxHp = this.getAttribute('data-max-hp') || '?';
        var profBonus = this.getAttribute('data-prof-bonus') || '2';
        var profChangedFrom = this.getAttribute('data-prof-changed-from');
        var abilities = (this.getAttribute('data-abilities') || '').split(',').filter(Boolean);

        var html = '<style>' +
          ':host { display: block; }' +
          '.widget-levelup { font-family: var(--ta-font-body); padding: 24px; text-align: center; }' +
          '.levelup-banner { font-family: var(--ta-font-heading); font-size: 24px; font-weight: 700; color: var(--ta-color-accent); margin-bottom: 8px; }' +
          '.levelup-subtitle { font-size: 14px; color: var(--sta-text-secondary, #9AA0C0); margin-bottom: 16px; }' +
          '.levelup-stats { display: flex; justify-content: center; gap: 24px; margin: 16px 0; }' +
          '.levelup-stat { text-align: center; }' +
          '.levelup-stat-label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--sta-text-tertiary, #545880); }' +
          '.levelup-stat-value { display: block; font-size: 22px; font-weight: 700; color: var(--sta-text-primary, #EEF0FF); }' +
          '.levelup-prof-change { display: inline-block; padding: 6px 14px; margin: 8px 0; background: var(--ta-color-accent-bg); color: var(--ta-color-accent); border-radius: 8px; font-size: 12px; font-weight: 600; }' +
          '.ability-options { margin-top: 16px; }' +
          '.ability-card { display: inline-block; padding: 8px 16px; margin: 4px; border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); border-radius: 6px; font-size: 12px; color: var(--sta-text-primary, #EEF0FF); cursor: pointer; background: transparent; transition: border-color 0.2s; min-height: 44px; box-sizing: border-box; }' +
          '.ability-card:hover { border-color: var(--ta-color-accent); }' +
          '.ability-card:focus-visible { outline: 2px solid var(--ta-color-focus, #4ECDC4); outline-offset: 2px; }' +
          '@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }' +
          '</style>';

        html += '<div class="widget-levelup">';
        html += '<div class="levelup-banner" role="status" aria-live="assertive">Level Up!</div>';
        html += '<div class="levelup-subtitle">' + charName + ' has reached level ' + level + '</div>';

        html += '<div class="levelup-stats">';
        html += '<div class="levelup-stat"><span class="levelup-stat-label">Level</span><span class="levelup-stat-value">' + level + '</span></div>';
        html += '<div class="levelup-stat"><span class="levelup-stat-label">HP</span><span class="levelup-stat-value">' + hp + ' / ' + maxHp + '</span></div>';
        html += '<div class="levelup-stat"><span class="levelup-stat-label">Prof. Bonus</span><span class="levelup-stat-value">+' + profBonus + '</span></div>';
        html += '</div>';

        if (profChangedFrom) {
          html += '<div class="levelup-prof-change">Proficiency bonus increased: +' + profChangedFrom + ' &rarr; +' + profBonus + '</div>';
        }

        if (abilities.length > 0) {
          html += '<div class="ability-options"><div style="font-size:11px;color:var(--sta-text-tertiary, #545880);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Choose an ability</div>';
          abilities.forEach(function(a) {
            html += '<button class="ability-card" data-prompt="I choose the ' + a + ' ability" title="I choose the ' + a + ' ability" aria-pressed="false">' + a + '</button>';
          });
          html += '</div>';
        }

        html += '</div>';
        this.shadowRoot.innerHTML = html;
        
        var self = this;
        this.shadowRoot.querySelectorAll('.ability-card[data-prompt]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            this.setAttribute('aria-pressed', 'true');
            this.disabled = true;
            var prompt = this.getAttribute('data-prompt');
            window.tag.sendOrCopyPrompt(this, prompt);
          });
        });
      } catch (e) {
        this.innerHTML = '<div>Error rendering ta-levelup</div>';
      }
    }
  }

  // TaDialogue
  class TaDialogue extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
      try {
        var speaker = this.getAttribute('data-speaker') || 'Unknown';
        var text = this.getAttribute('data-text') || '';
        var choicesStr = this.getAttribute('data-choices');
        var choices = [];
        if (choicesStr) {
          try { choices = JSON.parse(choicesStr); } catch(_e) {}
        }

        var html = '<style>' +
          ':host { display: block; }' +
          '.widget-dialogue { border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); border-radius: 12px; padding: 16px; margin: 16px 0; background: rgba(84,88,128,0.06); }' +
          '.dlg-speaker { font-family: var(--ta-font-heading); font-size: 14px; font-weight: 700; color: var(--ta-color-accent); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.08em; }' +
          '.dlg-text { font-family: var(--ta-font-body); font-size: 14px; line-height: 1.6; color: var(--sta-text-primary, #EEF0FF); margin-bottom: 16px; }' +
          '.dlg-choices { display: flex; flex-direction: column; gap: 8px; }' +
          '.dlg-choice-btn { text-align: left; padding: 10px 14px; background: transparent; border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4)); border-radius: 6px; color: var(--sta-text-secondary, #9AA0C0); font-family: var(--ta-font-body); font-size: 13px; line-height: 1.4; cursor: pointer; transition: all 0.2s; min-height: 44px; box-sizing: border-box; }' +
          '.dlg-choice-btn:hover { border-color: var(--ta-color-accent); color: var(--sta-text-primary, #EEF0FF); background: rgba(84,88,128,0.06); }' +
          '.dlg-choice-btn:focus-visible { outline: 2px solid var(--ta-color-focus, #4ECDC4); outline-offset: 2px; }' +
          '@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }' +
          '</style>';

        html += '<div class="widget-dialogue">';
        html += '<div class="dlg-speaker">' + speaker + '</div>';
        if (text) {
          html += '<div class="dlg-text">' + text + '</div>';
        }
        
        if (choices.length > 0) {
          html += '<div class="dlg-choices">';
          choices.forEach(function(c) {
            html += '<button class="dlg-choice-btn" data-prompt="' + c.prompt + '" title="' + c.prompt + '">' + c.label + '</button>';
          });
          html += '</div>';
        }

        html += '</div>';
        this.shadowRoot.innerHTML = html;

        this.shadowRoot.querySelectorAll('.dlg-choice-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            this.disabled = true;
            var prompt = this.getAttribute('data-prompt');
            window.tag.sendOrCopyPrompt(this, prompt);
          });
        });
      } catch (e) {
        this.innerHTML = '<div>Error rendering ta-dialogue</div>';
      }
    }
  }

  // Register components
  if (!customElements.get('ta-tts')) customElements.define('ta-tts', TaTts);
  if (!customElements.get('ta-ticker')) customElements.define('ta-ticker', TaTicker);
  if (!customElements.get('ta-footer')) customElements.define('ta-footer', TaFooter);
  if (!customElements.get('ta-levelup')) customElements.define('ta-levelup', TaLevelup);
  if (!customElements.get('ta-dialogue')) customElements.define('ta-dialogue', TaDialogue);

})();
`.trim();
