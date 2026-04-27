import { expect, test } from '@playwright/test';
import { canvasHasPaint, expectHealthyRuntime, monitorPage } from './support';

test.describe('browser rendering sanity', () => {
  test('scene hydrates icon usage and non-empty interactive chrome', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/fixtures/scene-rich-panels');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect.poll(async () => page.locator('use').count()).toBeGreaterThan(0);
    await expect.poll(async () => page.locator('ta-action-card').count()).toBeGreaterThan(0);
    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('world preview renders non-empty SVG topology', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/fixtures/world-preview-generated');
    await expect.poll(async () => page.locator('.wp-node').count()).toBeGreaterThan(5);
    await expect.poll(async () => page.locator('.wp-edge').count()).toBeGreaterThan(5);
    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('relationship web renders nodes and edges into SVG', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/fixtures/relationship-web-worldgen');
    await expect.poll(async () => page.locator('.rw-node-wrap').count()).toBeGreaterThan(5);
    await expect.poll(async () => page.locator('.rw-edge').count()).toBeGreaterThan(5);
    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('clue board renders graph edges and clue list content', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/fixtures/clue-board-rich');
    await expect.poll(async () => page.locator('.cb-edge').count()).toBeGreaterThan(0);
    await expect.poll(async () => page.locator('.cb-clue-important').count()).toBeGreaterThan(0);
    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('route planner renders a non-empty route canvas', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/fixtures/route-planner-rich');
    await expect.poll(async () => page.locator('.rp-path-line').count()).toBeGreaterThan(0);
    await expect.poll(async () => page.locator('.rp-node-active').count()).toBeGreaterThan(1);
    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });

  test('dice pool canvas paints pixels after a roll', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/fixtures/dice-pool-volley');
    await expect(page.locator('#dice-pool-canvas')).toBeVisible();

    await expect(page.locator('#dice-pool-target')).toBeVisible();
    await page.locator('#dice-pool-target').click();
    await expect(page.locator('#dice-pool-result')).toHaveClass(/is-visible/);
    await page.waitForTimeout(200);
    expect(await canvasHasPaint(page, '#dice-pool-canvas')).toBe(true);

    expectHealthyRuntime(monitor);
    expect(page).toBeDefined();
  });
});
