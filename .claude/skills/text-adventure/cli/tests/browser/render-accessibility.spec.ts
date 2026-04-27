import { expect, test } from '@playwright/test';
import { computedStyleValue, expectContrastAtLeast, expectHealthyRuntime, monitorPage } from './support';

test.describe('browser accessibility checks', () => {
  test('scene exposes accessible buttons', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/fixtures/scene-rich-panels');
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('button', { name: /slip through the crawlspace/i })).toBeVisible();

    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('quest log tabs expose roles and selection state', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/fixtures/quest-log-rich');
    await expect(page.getByRole('tablist')).toBeVisible();
    await expect(page.getByRole('tab', { name: /active/i })).toBeVisible();

    const completedTab = page.getByRole('tab', { name: /completed/i });
    await completedTab.click();
    await expect(completedTab).toHaveAttribute('aria-selected', 'true');

    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('map and graph widgets expose labelled image surfaces', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/fixtures/map-route-overlay');
    await expect(page.getByRole('img', { name: /needle gate concourse/i })).toBeVisible();

    await page.goto('/fixtures/route-planner-rich');
    await expect(page.getByRole('img', { name: /route plan/i })).toBeVisible();

    await page.goto('/fixtures/world-preview-generated');
    await expect(page.getByRole('img', { name: /generated dungeon/i })).toBeVisible();

    await page.goto('/fixtures/clue-board-rich');
    await expect(page.getByRole('img', { name: /clue board/i })).toBeVisible();

    await page.goto('/fixtures/relationship-web-worldgen');
    await expect(page.getByRole('img', { name: /relationship web/i })).toBeVisible();

    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('relationship graph nodes are keyboard-focusable buttons with names', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/fixtures/relationship-web-worldgen');
    const firstNode = page.getByRole('button').first();
    await firstNode.focus();
    await expect(firstNode).toBeFocused();
    await expect(firstNode).toHaveAttribute('aria-label', /.+/);

    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('world atlas and faction board expose actionable controls by role', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/fixtures/world-atlas-worldgen');
    await expect(page.getByRole('button', { name: /inspect|route/i }).first()).toBeVisible();

    await page.goto('/fixtures/faction-board-worldgen');
    await expect(page.getByRole('button', { name: 'Inspect' }).first()).toBeVisible();

    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('dice pool canvas exposes an accessible label', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/fixtures/dice-pool-volley');
    await expect(page.locator('#dice-pool-canvas')).toBeVisible();
    await expect(page.getByRole('img', { name: /volley\. click to roll the dice pool/i })).toBeVisible();

    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('high-use controls meet contrast requirements', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/fixtures/scene-rich-panels');
    await expectContrastAtLeast(page.locator('.brief-text'), 4.5);
    await expectContrastAtLeast(page.getByRole('button', { name: 'Continue' }), 4.5);

    await page.getByRole('button', { name: 'Continue' }).click();
    await expectContrastAtLeast(page.getByRole('button', { name: /slip through the crawlspace/i }).first(), 4.5);
    await expectContrastAtLeast(page.locator('.tracked-quest-badge'), 4.5);

    await page.goto('/fixtures/quest-log-rich');
    await expectContrastAtLeast(page.getByRole('tab', { name: /active/i }), 4.5);
    await expectContrastAtLeast(page.locator('.quest-detail-title'), 4.5);
    await expectContrastAtLeast(page.getByRole('button', { name: 'Track' }).first(), 4.5);

    await page.goto('/fixtures/map-route-overlay');
    await expectContrastAtLeast(page.getByRole('button', { name: 'Inspect' }), 4.5);
    await expectContrastAtLeast(page.locator('.map-inspector-title'), 4.5);

    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('reduced-motion preference disables nonessential motion', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/fixtures/scene-rich-panels');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('.quest-toast')).toBeVisible();
    await expect(await computedStyleValue(page.locator('.quest-toast'), 'animation-name')).toBe('none');

    await page.goto('/fixtures/map-route-overlay');
    await expect(page.locator('.map-zone-shape').first()).toBeVisible();
    expect(parseFloat(await computedStyleValue(page.locator('.map-zone-shape').first(), 'transition-duration'))).toBe(
      0,
    );

    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('scene reveal and panel states expose coherent dialog semantics', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/fixtures/scene-rich-panels');
    await expect(page.locator('#reveal-brief')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#reveal-full')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#panel-overlay')).toHaveAttribute('aria-hidden', 'true');

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('#reveal-brief')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#reveal-full')).toHaveAttribute('aria-hidden', 'false');

    await page.getByRole('button', { name: 'Character' }).click();
    await expect(page.getByRole('dialog', { name: 'Character' })).toBeVisible();
    await expect(page.locator('#panel-overlay')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#scene-content')).toHaveAttribute('aria-hidden', 'true');

    await page.getByRole('button', { name: 'Close panel' }).click();
    await expect(page.locator('#panel-overlay')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#scene-content')).toHaveAttribute('aria-hidden', 'false');

    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('quest toast exposes a live status region', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/fixtures/scene-rich-panels');
    await page.getByRole('button', { name: 'Continue' }).click();
    const toast = page.locator('.quest-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveAttribute('role', 'status');
    await expect(toast).toHaveAttribute('aria-live', 'polite');
    await expect(toast).toHaveAttribute('aria-atomic', 'true');

    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('dialogue exposes speaker, faction, and requirement semantics', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/fixtures/dialogue-faction');
    await expect(page.getByRole('heading', { name: /commander vane/i })).toBeVisible();

    const badge = page.locator('.dlg-faction-badge');
    await expect(badge).toHaveAttribute('role', 'status');
    await expect(badge).toHaveAttribute('aria-label', /faction standing Allied with Survey Corp/i);

    const lockedChoice = page.getByRole('button', { name: /locked - expensive/i });
    await expect(lockedChoice).toBeDisabled();
    await expect(lockedChoice).toHaveAttribute('aria-description', /500 credits required/i);

    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });
});
