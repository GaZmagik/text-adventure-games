import { expect, test } from '@playwright/test';
import { expectHealthyRuntime, expectPromptCaptured, installPromptTrap, monitorPage } from './support';

test.describe('browser interaction coverage', () => {
  test('scene action cards dispatch prompts', async ({ page }) => {
    await installPromptTrap(page);
    const monitor = monitorPage(page);

    await page.goto('/fixtures/scene-rich-panels');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('.card').first().click();

    await expectPromptCaptured(page, /crawlspace behind the relay/i);
    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('quest log tabs switch by keyboard', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/fixtures/quest-log-rich');
    const completedTab = page.getByRole('tab', { name: /completed/i });
    await completedTab.focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('.quest-detail-title')).toContainText('Spoof the patrol log');
    await expect(completedTab).toHaveAttribute('aria-selected', 'true');
    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('map inspector controls dispatch prompts', async ({ page }) => {
    await installPromptTrap(page);
    const monitor = monitorPage(page);

    await page.goto('/fixtures/map-route-overlay');
    await page.getByRole('button', { name: 'Inspect' }).click();

    await expectPromptCaptured(page, /inspect current location/i);
    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('route planner action dispatches a travel prompt', async ({ page }) => {
    await installPromptTrap(page);
    const monitor = monitorPage(page);

    await page.goto('/fixtures/route-planner-rich');
    await page.getByRole('button', { name: /travel route/i }).click();

    await expectPromptCaptured(page, /travel from needle gate to outer dock/i);
    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('world preview use-world action dispatches apply prompt', async ({ page }) => {
    await installPromptTrap(page);
    const monitor = monitorPage(page);

    await page.goto('/fixtures/world-preview-generated');
    await page.getByRole('button', { name: 'Use World' }).click();

    await expectPromptCaptured(page, /tag world generate --seed preview-seed --theme dungeon --apply/i);
    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('faction board inspect buttons dispatch prompts', async ({ page }) => {
    await installPromptTrap(page);
    const monitor = monitorPage(page);

    await page.goto('/fixtures/faction-board-worldgen');
    await page.getByRole('button', { name: 'Inspect' }).first().click();

    await expectPromptCaptured(page, /tag faction inspect/i);
    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('relationship web nodes dispatch prompts from keyboard', async ({ page }) => {
    await installPromptTrap(page);
    const monitor = monitorPage(page);

    await page.goto('/fixtures/relationship-web-worldgen');
    await page.locator('.rw-node-wrap').first().focus();
    await page.keyboard.press('Enter');

    await expectPromptCaptured(page, /inspect|ask about/i);
    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('world atlas room actions dispatch prompts', async ({ page }) => {
    await installPromptTrap(page);
    const monitor = monitorPage(page);

    await page.goto('/fixtures/world-atlas-worldgen');
    await page.locator('.wa-action').first().click();

    await expectPromptCaptured(page, /inspect current location|review route options/i);
    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('dice pool rolls on click and reveals a result panel', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/fixtures/dice-pool-volley');
    await expect(page.locator('#dice-pool-target')).toBeVisible();
    await page.locator('#dice-pool-target').click();

    await expect(page.locator('#dice-pool-result')).toHaveClass(/is-visible/);
    await expect(page.locator('#dice-pool-total')).not.toHaveText('');
    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });
});
