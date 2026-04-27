/**
 * Faction Integration Library
 * Centralises logic for mapping faction standings to game mechanics.
 */

export type FactionStanding = 'hostile' | 'tense' | 'neutral' | 'friendly' | 'allied';

/**
 * Maps a numeric standing value to a semantic label.
 * @param value - Standing value (typically -100 to 100)
 */
export function getStandingLabel(value: number): FactionStanding {
  if (value <= -50) return 'hostile';
  if (value < -15) return 'tense';
  if (value <= 15) return 'neutral';
  if (value < 50) return 'friendly';
  return 'allied';
}

/**
 * Checks if a dialogue choice requirement is met.
 */
export function isRequirementMet(
  requirement: { currency?: number; minStanding?: number },
  playerData: { currency: number; standing: number },
): boolean {
  if (requirement.currency !== undefined && playerData.currency < requirement.currency) {
    return false;
  }
  if (requirement.minStanding !== undefined && playerData.standing < requirement.minStanding) {
    return false;
  }
  return true;
}
