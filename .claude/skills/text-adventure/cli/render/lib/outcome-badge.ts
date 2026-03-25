// Shared outcome badge styling — used by dice.ts and combat-turn.ts templates.

export type BadgeStyle = {
  bg: string;
  text: string;
  border: string;
};

export function outcomeBadgeStyle(outcome: string): BadgeStyle {
  let bg = 'var(--ta-badge-partial-bg)';
  let text = 'var(--ta-badge-partial-text)';
  let border = 'transparent';

  if (outcome === 'critical_success' || outcome === 'decisive_success') {
    bg = 'var(--ta-badge-success-bg)';
    text = 'var(--ta-badge-success-text)';
    border = 'var(--ta-badge-crit-success-border)';
  } else if (outcome === 'success' || outcome === 'narrow_success' || outcome === 'partial_success') {
    bg = 'var(--ta-badge-success-bg)';
    text = 'var(--ta-badge-success-text)';
  } else if (outcome === 'failure' || outcome === 'narrow_failure') {
    bg = 'var(--ta-badge-failure-bg)';
    text = 'var(--ta-badge-failure-text)';
  } else if (outcome === 'critical_failure' || outcome === 'decisive_failure') {
    bg = 'var(--ta-badge-failure-bg)';
    text = 'var(--ta-badge-failure-text)';
    border = 'var(--ta-badge-crit-failure-border)';
  } else if (outcome === 'quiet') {
    bg = 'var(--ta-badge-neutral-bg, #2a3a5c)';
    text = 'var(--ta-badge-neutral-text, #a0c4ff)';
  } else if (outcome === 'alert') {
    bg = 'var(--ta-badge-warning-bg, #5c4a2a)';
    text = 'var(--ta-badge-warning-text, #ffc080)';
  } else if (outcome === 'hostile') {
    bg = 'var(--ta-badge-danger-bg, #5c2a3a)';
    text = 'var(--ta-badge-danger-text, #ffa0c0)';
  }

  return { bg, text, border };
}
