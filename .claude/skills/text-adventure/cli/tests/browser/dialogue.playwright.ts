import { test, expect } from '@playwright/test';

test.describe('Dialogue Faction & Economy', () => {
  test('renders locked and unlocked choices based on standing and currency', async ({ page }) => {
    await page.goto('/fixtures/dialogue-faction');

    // Check for faction badge
    const badge = page.locator('ta-dialogue .dlg-faction-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Survey Corp');
    await expect(badge).toContainText('Allied'); // 60 standing = Allied

    // Check choices
    const choices = page.locator('ta-dialogue .dlg-choice-btn');
    await expect(choices).toHaveCount(4);

    // Unlocked choices
    const payEntry = choices.filter({ hasText: /Pay Entry Fee/i });
    await expect(payEntry).not.toHaveClass(/locked/);
    await expect(payEntry).toBeEnabled();

    const useAuthority = choices.filter({ hasText: /Use Authority/i });
    await expect(useAuthority).not.toHaveClass(/locked/);
    await expect(useAuthority).toBeEnabled();

    // Locked choices
    const expensive = choices.filter({ hasText: /Locked - Expensive/i });
    await expect(expensive).toHaveClass(/locked/);
    await expect(expensive).toBeDisabled();
    await expect(expensive.locator('.dlg-choice-req')).toContainText('500 credits required');

    const highRank = choices.filter({ hasText: /Locked - High Rank/i });
    await expect(highRank).toHaveClass(/locked/);
    await expect(highRank).toBeDisabled();
    await expect(highRank.locator('.dlg-choice-req')).toContainText('100 standing required');
  });
});
