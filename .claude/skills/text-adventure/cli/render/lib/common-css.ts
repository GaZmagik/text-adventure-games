/** Shared CSS for widget templates — avoids duplication across 13+ templates. */
export const COMMON_WIDGET_CSS = `
.widget-title { font-family: var(--ta-font-heading); font-size: 22px; font-weight: 700; color: var(--sta-text-primary, #EEF0FF); margin-bottom: 4px; }
.widget-subtitle { font-size: 12px; color: var(--sta-text-tertiary, #545880); margin-bottom: 20px; }
.widget-section { margin-bottom: 16px; }
.widget-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--sta-text-tertiary, #545880); margin-bottom: 8px; }
.empty-state { color: var(--sta-text-tertiary, #545880); font-style: italic; font-size: 12px; padding: 8px 0; }
.confirm-btn {
  display: block; width: 100%; margin-top: 20px; padding: 12px;
  font-family: var(--ta-font-heading); font-size: 14px; font-weight: 700;
  background: var(--ta-color-accent); color: var(--ta-btn-primary-text, #fff); border: none;
  border-radius: 8px; cursor: pointer; text-transform: uppercase;
  letter-spacing: 0.08em; transition: background 0.2s;
}
.confirm-btn:hover { background: var(--ta-color-accent-hover); }
.confirm-btn:focus-visible { outline: 2px solid var(--ta-color-focus); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0s !important; animation-duration: 0s !important; }
}
`;
