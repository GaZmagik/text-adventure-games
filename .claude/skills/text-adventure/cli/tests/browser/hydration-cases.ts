/**
 * Configuration for hydration budgets across browser-rendered widgets.
 */
import { expect, type Page } from '@playwright/test';

export type HydrationBudgetCase = {
  path: string;
  maxMs: number;
  waitForReady: (page: Page) => Promise<void>;
};

export const HYDRATION_BUDGET_CASES: Record<string, HydrationBudgetCase> = {
  scene: {
    path: '/fixtures/scene-rich-panels',
    maxMs: 3_500,
    waitForReady: async page => {
      await expect(page.locator('ta-scene')).toBeVisible();
      await expect(page.locator('ta-action-card')).toHaveCount(4);
      await expect(page.locator('.tracked-quest-badge')).toContainText('Trace the signal lattice');
    },
  },
  map: {
    path: '/fixtures/map-route-overlay',
    maxMs: 3_500,
    waitForReady: async page => {
      await expect(page.locator('ta-map')).toBeVisible();
      await expect(page.locator('.map-route-summary')).toContainText('Needle Gate');
      await expect.poll(async () => page.locator('.map-route-active').count()).toBeGreaterThan(0);
    },
  },
  questLog: {
    path: '/fixtures/quest-log-rich',
    maxMs: 2_500,
    waitForReady: async page => {
      await expect(page.locator('ta-quest-log')).toBeVisible();
      await expect(page.locator('.quest-tab')).toHaveCount(4);
      await expect(page.locator('.quest-detail-title')).toContainText('Trace the signal lattice');
    },
  },
  relationshipWeb: {
    path: '/fixtures/relationship-web-worldgen',
    maxMs: 3_000,
    waitForReady: async page => {
      await expect(page.locator('ta-relationship-web')).toBeVisible();
      await expect(page.locator('.rw-node-wrap').first()).toBeVisible();
      await expect(page.locator('.rw-edge').first()).toBeVisible();
    },
  },
  dicePool: {
    path: '/fixtures/dice-pool-volley',
    maxMs: 3_500,
    waitForReady: async page => {
      await expect(page.locator('ta-dice-pool')).toBeVisible();
      await expect(page.locator('#dice-pool-canvas')).toBeVisible();
      await expect(page.locator('#dice-pool-target')).toBeVisible();
    },
  },
};
