import { expect, test, type Page } from '@playwright/test';
import { expectHealthyRuntime, monitorPage } from './support';

type SmokeCase = {
  path: string;
  check: (page: Page) => Promise<void>;
};

const SMOKE_CASES: Record<string, SmokeCase> = {
  scene: {
    path: '/fixtures/scene-rich-panels',
    check: async page => {
      await expect(page.locator('ta-scene')).toBeVisible();
      await expect(page.locator('ta-action-card')).toHaveCount(4);
      await expect(page.locator('button[data-panel="map"]:visible')).toHaveCount(1);
      await expect(page.locator('.tracked-quest-badge')).toContainText('Trace the signal lattice');

      await page.getByRole('button', { name: 'Continue' }).click();
      await expect(page.locator('#reveal-full')).toBeVisible();
      await expect(page.locator('#reveal-brief')).toBeHidden();
    },
  },
  map: {
    path: '/fixtures/map-route-overlay',
    check: async page => {
      await expect(page.locator('ta-map')).toBeVisible();
      await expect(page.locator('.map-route-summary')).toContainText('Needle Gate');
      await expect(page.locator('.map-route-summary')).toContainText('Outer Dock');
      await expect.poll(async () => page.locator('.map-zone-group').count()).toBeGreaterThan(3);
      await expect.poll(async () => page.locator('.map-route-active').count()).toBeGreaterThan(0);
    },
  },
  questLog: {
    path: '/fixtures/quest-log-rich',
    check: async page => {
      await expect(page.locator('ta-quest-log')).toBeVisible();
      await expect(page.locator('.quest-tab')).toHaveCount(4);
      await expect(page.locator('.quest-detail-title')).toContainText('Trace the signal lattice');
    },
  },
  factionBoard: {
    path: '/fixtures/faction-board-worldgen',
    check: async page => {
      await expect(page.locator('ta-faction-board')).toBeVisible();
      await expect.poll(async () => page.locator('.fb-card').count()).toBeGreaterThan(1);
      await expect.poll(async () => page.locator('.fb-relation').count()).toBeGreaterThan(0);
    },
  },
  relationshipWeb: {
    path: '/fixtures/relationship-web-worldgen',
    check: async page => {
      await expect(page.locator('ta-relationship-web')).toBeVisible();
      await expect.poll(async () => page.locator('.rw-node-wrap').count()).toBeGreaterThan(5);
      await expect.poll(async () => page.locator('.rw-edge').count()).toBeGreaterThan(5);
    },
  },
  routePlanner: {
    path: '/fixtures/route-planner-rich',
    check: async page => {
      await expect(page.locator('ta-route-planner')).toBeVisible();
      await expect(page.locator('.rp-status')).toContainText('Reachable');
      await expect.poll(async () => page.locator('.rp-step').count()).toBeGreaterThan(1);
    },
  },
  worldPreview: {
    path: '/fixtures/world-preview-generated',
    check: async page => {
      await expect(page.locator('ta-world-preview')).toBeVisible();
      await expect.poll(async () => page.locator('.wp-node').count()).toBeGreaterThan(5);
      await expect(page.getByRole('button', { name: 'Use World' })).toBeVisible();
    },
  },
  worldAtlas: {
    path: '/fixtures/world-atlas-worldgen',
    check: async page => {
      await expect(page.locator('ta-world-atlas')).toBeVisible();
      await expect.poll(async () => page.locator('.wa-room').count()).toBeGreaterThan(3);
      await expect.poll(async () => page.locator('.wa-action').count()).toBeGreaterThan(0);
    },
  },
  clueBoard: {
    path: '/fixtures/clue-board-rich',
    check: async page => {
      await expect(page.locator('ta-clue-board')).toBeVisible();
      await expect.poll(async () => page.locator('.cb-edge').count()).toBeGreaterThan(0);
      await expect.poll(async () => page.locator('.cb-clue').count()).toBeGreaterThan(0);
    },
  },
  dicePool: {
    path: '/fixtures/dice-pool-volley',
    check: async page => {
      await expect(page.locator('ta-dice-pool')).toBeVisible();
      await expect(page.locator('#dice-pool-canvas')).toBeVisible();
      await expect(page.locator('.dice-pool-expression')).toContainText('2d6 + 1d8');
    },
  },
};

test.describe('browser smoke matrix', () => {
  for (const [name, entry] of Object.entries(SMOKE_CASES)) {
    test(`${name} fixture upgrades with visible browser output`, async ({ page }) => {
      const monitor = monitorPage(page);
      await page.goto(entry.path);
      await entry.check(page);
      expectHealthyRuntime(monitor);
      expect(page).toBeDefined();
    });
  }
});
