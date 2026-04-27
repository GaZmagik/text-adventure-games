import { expect, test } from '@playwright/test';
import { HYDRATION_BUDGET_CASES } from './hydration-cases';
import { expectHealthyRuntime, monitorPage } from './support';

test.describe('browser hydration budgets', () => {
  for (const [name, entry] of Object.entries(HYDRATION_BUDGET_CASES)) {
    test(`${name} hydrates within budget`, async ({ page }, testInfo) => {
      const monitor = monitorPage(page);

      await page.goto(entry.path);
      await entry.waitForReady(page);

      const elapsedMs = await page.evaluate(() => performance.now());
      testInfo.annotations.push({
        type: 'hydration-ms',
        description: `${Math.round(elapsedMs)}ms`,
      });

      expect(elapsedMs).toBeLessThanOrEqual(entry.maxMs);
      expectHealthyRuntime(monitor);
    });
  }
});
