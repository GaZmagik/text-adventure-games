import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const TREND_FILE = join(process.cwd(), 'cli/tests/quality/fixtures-trend.json');

const THRESHOLDS = {
  htmlSize: 0.1, // 10% tolerance
  bundleLoadMs: 1.0, // 100% tolerance (high jitter)
  hydrationMs: 1.0, // 100% tolerance
};

test.describe('Fixture Performance Trend Audit', () => {
  if (!existsSync(TREND_FILE)) {
    test('No trend baseline found.', () => {
      expect(TREND_FILE).toBeDefined();
    });
    return;
  }

  const baseline = JSON.parse(readFileSync(TREND_FILE, 'utf-8')) as Record<string, any>;
  const fixtures = Object.keys(baseline);

  for (const fixture of fixtures) {
    test(`performance trend: ${fixture}`, async ({ page }) => {
      await page.goto(`/fixtures/${fixture}`);
      await page.waitForSelector('body', { state: 'attached' });

      const current = await page.evaluate(async () => {
        await new Promise(r => setTimeout(r, 100));
        const measures = performance.getEntriesByType('measure');
        const getDuration = (name: string) => measures.find(m => m.name === name)?.duration || 0;
        return {
          hydrationMs: getDuration('ta-scene-hydration'),
          bundleLoadMs: getDuration('ta-components-load'),
          htmlSize: document.body.innerHTML.length,
        };
      });

      const base = baseline[fixture];

      // 1. Check HTML Size
      if (base.htmlSize > 0) {
        const sizeRatio = (current.htmlSize - base.htmlSize) / base.htmlSize;
        expect(
          sizeRatio,
          `HTML size regression in ${fixture}: ${current.htmlSize} vs baseline ${base.htmlSize}`,
        ).toBeLessThan(THRESHOLDS.htmlSize);
      }

      // 2. Check Bundle Load (if base had it)
      if (base.bundleLoadMs > 0 && current.bundleLoadMs > 0) {
        const loadRatio = (current.bundleLoadMs - base.bundleLoadMs) / base.bundleLoadMs;
        if (loadRatio > THRESHOLDS.bundleLoadMs) {
          console.warn(
            `[PERF] Bundle load regression in ${fixture}: ${current.bundleLoadMs.toFixed(2)}ms (base ${base.bundleLoadMs.toFixed(2)}ms)`,
          );
        }
      }

      // 3. Check Hydration (for ta-scene)
      if (base.hydrationMs > 0 && current.hydrationMs > 0) {
        const hydRatio = (current.hydrationMs - base.hydrationMs) / base.hydrationMs;
        if (hydRatio > THRESHOLDS.hydrationMs) {
          console.warn(
            `[PERF] Hydration regression in ${fixture}: ${current.hydrationMs.toFixed(2)}ms (base ${base.hydrationMs.toFixed(2)}ms)`,
          );
        }
      }
    });
  }
});
