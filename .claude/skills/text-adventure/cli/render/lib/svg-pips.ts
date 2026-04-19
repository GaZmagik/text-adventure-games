// SVG pip indicators for HP and XP — CDN-independent, theme-aware inline SVG.
// Used by scene.ts (status bar) and character.ts (stat panel).

/** Pip circle radius and spacing constants. */
const PIP_R = 3;
const PIP_SPACING = 10;
const PIP_Y = 6;
const PIP_HEIGHT = 12;

/** Bar mode constants (for maxHp > 20). */
const BAR_WIDTH = 100;
const BAR_HEIGHT = 8;
const BAR_RX = 4;

/** XP track constants. */
const XP_WIDTH = 100;
const XP_HEIGHT = 8;
const XP_RX = 4;

/** Pick the HP colour variable based on percentage remaining. */
function hpColour(hp: number, maxHp: number): string {
  if (maxHp <= 0) return 'var(--sta-color-success, #2BA882)';
  const pct = hp / maxHp;
  if (pct <= 0.25) return 'var(--sta-color-danger, #E84855)';
  if (pct <= 0.5) return 'var(--sta-color-warning, #F0A500)';
  return 'var(--sta-color-success, #2BA882)';
}

/**
 * Render HP as inline SVG pip circles (maxHp <= 20) or a filled bar (maxHp > 20).
 * Returns a complete `<svg>` element string with class `hp-pips`.
 */
export function renderHpPips(hp: number, maxHp: number): string {
  const safeMax = Math.max(0, Math.floor(maxHp));
  const safeHp = Math.max(0, Math.min(Math.floor(hp), safeMax));
  const colour = hpColour(safeHp, safeMax);
  const label = `HP: ${safeHp} of ${safeMax}`;

  if (safeMax === 0) {
    return `<svg class="hp-pips" role="meter" aria-label="${label}" aria-valuenow="0" aria-valuemin="0" aria-valuemax="0" width="20" height="${PIP_HEIGHT}" xmlns="http://www.w3.org/2000/svg"></svg>`;
  }

  // Pip mode: individual circles
  if (safeMax <= 20) {
    const width = safeMax * PIP_SPACING;
    const circles: string[] = [];
    for (let i = 0; i < safeMax; i++) {
      const cx = PIP_R + i * PIP_SPACING;
      const cls = i < safeHp ? 'pip pip-filled' : 'pip pip-empty';
      const fill = i < safeHp ? colour : 'var(--sta-border-tertiary, rgba(84,88,128,0.4))';
      circles.push(`<circle class="${cls}" cx="${cx}" cy="${PIP_Y}" r="${PIP_R}" fill="${fill}"/>`);
    }
    return `<svg class="hp-pips" role="meter" aria-label="${label}" aria-valuenow="${safeHp}" aria-valuemin="0" aria-valuemax="${safeMax}" width="${width}" height="${PIP_HEIGHT}" xmlns="http://www.w3.org/2000/svg">${circles.join('')}<text x="${width + 4}" y="${PIP_Y + 4}" font-size="10" fill="var(--sta-text-tertiary, #545880)">${safeHp}/${safeMax}</text></svg>`;
  }

  // Bar mode: filled rectangle
  const pct = Math.round((safeHp / safeMax) * 100);
  return `<svg class="hp-pips" role="meter" aria-label="${label}" aria-valuenow="${safeHp}" aria-valuemin="0" aria-valuemax="${safeMax}" width="${BAR_WIDTH + 50}" height="${BAR_HEIGHT + 4}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${BAR_WIDTH}" height="${BAR_HEIGHT}" rx="${BAR_RX}" fill="var(--sta-border-tertiary, rgba(84,88,128,0.4))"/><rect class="hp-bar-fill" x="0" y="0" width="${pct}%" height="${BAR_HEIGHT}" rx="${BAR_RX}" fill="${colour}"/><text x="${BAR_WIDTH + 4}" y="${BAR_HEIGHT}" font-size="10" fill="var(--sta-text-tertiary, #545880)">${safeHp}/${safeMax}</text></svg>`;
}

/**
 * Render XP as an inline SVG progress track.
 * Returns a complete `<svg>` element string with class `xp-track`.
 */
export function renderXpTrack(xp: number, xpForLevel: number): string {
  const safeXp = Math.max(0, Math.floor(xp));
  const safeMax = Math.max(0, Math.floor(xpForLevel));
  const label = `XP: ${safeXp} of ${safeMax}`;

  if (safeMax === 0) {
    return `<svg class="xp-track" role="meter" aria-label="${label}" aria-valuenow="0" aria-valuemin="0" aria-valuemax="0" width="20" height="${XP_HEIGHT + 4}" xmlns="http://www.w3.org/2000/svg"></svg>`;
  }

  const pct = Math.min(100, Math.round((safeXp / safeMax) * 100));
  const colour = 'var(--sta-color-accent, #4ECDC4)';

  return `<svg class="xp-track" role="meter" aria-label="${label}" aria-valuenow="${safeXp}" aria-valuemin="0" aria-valuemax="${safeMax}" width="${XP_WIDTH + 50}" height="${XP_HEIGHT + 4}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${XP_WIDTH}" height="${XP_HEIGHT}" rx="${XP_RX}" fill="var(--sta-border-tertiary, rgba(84,88,128,0.4))"/><rect class="xp-fill" x="0" y="0" width="${pct}%" height="${XP_HEIGHT}" rx="${XP_RX}" fill="${colour}"/><text x="${XP_WIDTH + 4}" y="${XP_HEIGHT}" font-size="10" fill="var(--sta-text-tertiary, #545880)">${safeXp}/${safeMax}</text></svg>`;
}
