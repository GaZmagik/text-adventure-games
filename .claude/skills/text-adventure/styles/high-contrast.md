# High-Contrast Style

Maximum readability using a simple WCAG AAA compliant palette.

```json tag-contract
{
  "id": "high-contrast",
  "kind": "style",
  "version": "1.4.0",
  "summary": "Maximum-readability WCAG AAA style using pure black/white/yellow palette with no decorative effects.",
  "mustRead": ["Pair with styles/style-reference.md for structural contracts."],
  "render": [
    "CDN CSS is built with tag build-css and consumed by ta-* custom elements.",
    "All decorative effects (shadows, gradients, animations) are stripped for maximum clarity."
  ]
}
```

```css
.root {
  /* High Contrast Palette */
  --hc-bg: #000000;
  --hc-fg: #ffffff;
  --hc-accent: #ffff00;
  --hc-border: #ffffff;
  --hc-success: #00ff00;
  --hc-danger: #ff0000;
  --hc-warning: #ffff00;

  --ta-font-heading: system-ui, -apple-system, sans-serif;
  --ta-font-body: system-ui, -apple-system, sans-serif;

  --ta-color-fg: var(--hc-fg);
  --ta-color-bg: var(--hc-bg);
  --ta-color-surface: var(--hc-bg);
  --ta-color-border: var(--hc-border);
  --ta-color-accent: var(--hc-accent);
  --ta-color-accent-bg: var(--hc-bg);
  --ta-color-accent-hover: var(--hc-fg);
  --ta-color-focus: var(--hc-accent);
  --ta-color-success: var(--hc-success);
  --ta-color-danger: var(--hc-danger);
  --ta-color-warning: var(--hc-warning);

  /* Overrides for high readability */
  font-family: var(--ta-font-body);
  color: var(--hc-fg);
  background: var(--hc-bg);
  line-height: 1.5;
  font-size: 16px;
}

.root * {
  background-image: none !important;
  text-shadow: none !important;
  box-shadow: none !important;
}

.root button {
  background: var(--hc-bg);
  border: 2px solid var(--hc-border);
  color: var(--hc-fg);
  font-weight: bold;
  padding: 10px 20px;
}

.root button:hover {
  background: var(--hc-fg);
  color: var(--hc-bg);
  border-color: var(--hc-fg);
}

.root .loc-name {
  color: var(--hc-accent);
  font-size: 1.5em;
  border-bottom: 2px solid var(--hc-accent);
}

.root .narrative {
  border-left: 4px solid var(--hc-border);
  padding-left: 1rem;
}

.root .action-card {
  border: 2px solid var(--hc-border);
  background: var(--hc-bg);
}

.root .badge {
  background: var(--hc-bg) !important;
  border: 2px solid currentColor !important;
  font-weight: bold;
}

.root .status-bar {
  border-top: 2px solid var(--hc-border);
}

.root .pip {
  background: var(--hc-fg);
  border: 1px solid var(--hc-bg);
}

.root .pip.empty {
  background: var(--hc-bg);
  border: 1px solid var(--hc-fg);
}

.root :focus-visible {
  outline: 4px solid var(--hc-accent) !important;
  outline-offset: 4px !important;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```
