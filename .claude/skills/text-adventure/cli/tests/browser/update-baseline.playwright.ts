import { expect, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const TREND_FILE = join(process.cwd(), 'cli/tests/quality/fixtures-trend.json');

test.describe('Update Baseline', () => {
  test('update performance baseline', async ({ page }) => {
    if (!process.env.UPDATE_BASELINE) {
      expect(page).toBeDefined();
      return;
    }
    const fixtures = [
      'scene-rich-panels',
      'quest-log-rich',
      'map-route-overlay',
      'dice-pool-volley',
      'route-planner-rich',
    ];

    const results: Record<string, any> = {};

    for (const fixture of fixtures) {
      console.log(`Auditing ${fixture}...`);
      await page.goto(`/fixtures/${fixture}`);
      await page.waitForSelector('body', { state: 'attached' });

      const stats = await page.evaluate(async () => {
        await new Promise(r => setTimeout(r, 500));
        const measures = performance.getEntriesByType('measure');
        const getDuration = (name: string) => measures.find(m => m.name === name)?.duration || 0;
        return {
          hydrationMs: getDuration('ta-scene-hydration'),
          bundleLoadMs: getDuration('ta-components-load'),
          htmlSize: document.body.innerHTML.length,
        };
      });
      results[fixture] = stats;
    }

    writeFileSync(TREND_FILE, JSON.stringify(results, null, 2), 'utf-8');
    console.log('Baseline updated successfully.');
    expect(page).toBeDefined();
  });
});
