/** Shared sendOrCopyPrompt JavaScript string injected into widget scripts.
 *  Uses Clipboard API with legacy execCommand fallback. */
export const SEND_OR_COPY_PROMPT_JS = `function sendOrCopyPrompt(btn, prompt) {
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
}`;
