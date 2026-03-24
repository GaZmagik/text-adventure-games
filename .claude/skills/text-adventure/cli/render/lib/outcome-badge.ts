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
  }

  return { bg, text, border };
}
