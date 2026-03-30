/** Shared CSS for widget templates — avoids duplication across 13+ templates. */
export const COMMON_WIDGET_CSS = `
.widget-title { font-family: var(--ta-font-heading); font-size: 22px; font-weight: 700; color: var(--sta-text-primary, #EEF0FF); margin-bottom: 4px; }
.widget-subtitle { font-size: 12px; color: var(--sta-text-tertiary, #545880); margin-bottom: 20px; }
.widget-section { margin-bottom: 16px; border: none; padding: 0; margin-inline: 0; }
.widget-label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--sta-text-tertiary, #545880); margin-bottom: 8px; padding: 0; }
.empty-state { color: var(--sta-text-tertiary, #545880); font-style: italic; font-size: 12px; padding: 8px 0; }
.option-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.option-card {
  padding: 8px 14px; border: 0.5px solid var(--sta-border-tertiary, rgba(84,88,128,0.4));
  border-radius: 6px; font-size: 12px; color: var(--sta-text-primary, #EEF0FF);
  cursor: pointer; background: transparent; transition: all 0.2s;
  text-transform: capitalize; min-height: 44px; box-sizing: border-box;
}
.option-card:hover { border-color: var(--ta-color-accent); background: var(--ta-color-accent-bg); }
.option-card:focus-visible { outline: 2px solid var(--ta-color-focus, #4ECDC4); outline-offset: 2px; }
.option-card.selected { border-color: var(--ta-color-accent); background: var(--ta-color-accent-bg); color: var(--ta-color-accent); font-weight: 600; }
.confirm-btn {
  display: block; width: 100%; margin-top: 20px; padding: 12px;
  font-family: var(--ta-font-heading); font-size: 14px; font-weight: 700;
  background: var(--ta-color-accent); color: var(--ta-btn-primary-text, #fff); border: none;
  border-radius: 8px; cursor: pointer; text-transform: uppercase;
  letter-spacing: 0.08em; transition: background 0.2s;
}
.confirm-btn:hover { background: var(--ta-color-accent-hover); }
.confirm-btn:focus-visible { outline: 2px solid var(--ta-color-focus); outline-offset: 2px; }
.footer-btn-dim { opacity: 0.4; }
.footer-btn-dim:hover { opacity: 0.6; background: transparent; }
.footer-btn-levelup { color: var(--ta-color-accent, #4ECDC4); border-color: var(--ta-color-accent, #4ECDC4); animation: levelup-pulse 2s ease-in-out infinite; }
.footer-btn-levelup:hover { background: var(--ta-color-accent-bg); }
@keyframes levelup-pulse { 0%,100% { box-shadow: 0 0 4px var(--ta-color-accent, #4ECDC4); } 50% { box-shadow: 0 0 12px var(--ta-color-accent, #4ECDC4), 0 0 24px rgba(78,205,196,0.3); } }
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0s !important; animation-duration: 0s !important; }
}
`;
