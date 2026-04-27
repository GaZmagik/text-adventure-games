import { describe, test, expect } from 'bun:test';
import { getStandingLabel, isRequirementMet } from './faction-integration';

describe('getStandingLabel', () => {
  test('returns hostile for values <= -50', () => {
    expect(getStandingLabel(-50)).toBe('hostile');
    expect(getStandingLabel(-100)).toBe('hostile');
  });

  test('returns tense for values between -49 and -16', () => {
    expect(getStandingLabel(-49)).toBe('tense');
    expect(getStandingLabel(-16)).toBe('tense');
  });

  test('returns neutral for values between -15 and 15', () => {
    expect(getStandingLabel(0)).toBe('neutral');
    expect(getStandingLabel(15)).toBe('neutral');
    expect(getStandingLabel(-15)).toBe('neutral');
  });

  test('returns friendly for values between 16 and 49', () => {
    expect(getStandingLabel(16)).toBe('friendly');
    expect(getStandingLabel(49)).toBe('friendly');
  });

  test('returns allied for values >= 50', () => {
    expect(getStandingLabel(50)).toBe('allied');
    expect(getStandingLabel(100)).toBe('allied');
  });
});

describe('isRequirementMet', () => {
  test('returns true when no requirements are specified', () => {
    expect(isRequirementMet({}, { currency: 100, standing: 50 })).toBe(true);
  });

  test('returns false when currency is insufficient', () => {
    expect(isRequirementMet({ currency: 50 }, { currency: 30, standing: 0 })).toBe(false);
  });

  test('returns true when currency exactly meets requirement', () => {
    expect(isRequirementMet({ currency: 50 }, { currency: 50, standing: 0 })).toBe(true);
  });

  test('returns false when standing is below minimum', () => {
    expect(isRequirementMet({ minStanding: 20 }, { currency: 100, standing: 10 })).toBe(false);
  });

  test('returns true when standing exactly meets minimum', () => {
    expect(isRequirementMet({ minStanding: 20 }, { currency: 0, standing: 20 })).toBe(true);
  });

  test('returns false when currency fails even if standing passes', () => {
    expect(isRequirementMet({ currency: 100, minStanding: 10 }, { currency: 50, standing: 50 })).toBe(false);
  });

  test('returns true when all requirements are met', () => {
    expect(isRequirementMet({ currency: 10, minStanding: 20 }, { currency: 50, standing: 30 })).toBe(true);
  });
});
