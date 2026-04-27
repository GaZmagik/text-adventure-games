/**
 * Collects and updates fixture trend snapshots for hydration and rendering budgets.
 */
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { HYDRATION_BUDGET_CASES } from '../cli/tests/browser/hydration-cases';
import { measureRenderOutputTrends } from '../cli/tests/support/fixture-trends';

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 4176);
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;
const SKILL_DIR = resolve(import.meta.dir, '..');
const OUTPUT_PATH = join(SKILL_DIR, 'cli', 'tests', 'quality', 'fixture-trends.json');

type FixtureTrendSnapshot = {
  updatedAt: string;
  renderOutput: Record<string, { widget: string; chars: number }>;
  hydrationObservedMs: Record<string, number>;
  hydrationBudgetsMs: Record<string, number>;
};

async function waitForHealth(url: string): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (_error) {
      // server still starting
    }
    await Bun.sleep(200);
  }
  throw new Error(`Timed out waiting for preview server health at ${url}`);
}

async function collectHydrationTrends(): Promise<Record<string, number>> {
  const browser = await chromium.launch({ headless: true });
  try {
    const observed: Record<string, number> = {};

    for (const [name, entry] of Object.entries(HYDRATION_BUDGET_CASES).sort(([left], [right]) =>
      left.localeCompare(right),
    )) {
      const page = await browser.newPage();
      try {
        await page.goto(`${BASE_URL}${entry.path}`);
        await entry.waitForReady(page);
        observed[name] = Math.round(await page.evaluate(() => performance.now()));
      } finally {
        await page.close();
      }
    }

    return observed;
  } finally {
    await browser.close();
  }
}

function buildHydrationBudgetSnapshot(): Record<string, number> {
  return Object.fromEntries(
    Object.entries(HYDRATION_BUDGET_CASES)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, entry]) => [name, entry.maxMs]),
  );
}

function buildRenderOutputSnapshot(
  measurements: Awaited<ReturnType<typeof measureRenderOutputTrends>>,
): Record<string, { widget: string; chars: number }> {
  return Object.fromEntries(
    measurements.map(measurement => [
      measurement.fixtureName,
      {
        widget: measurement.widget,
        chars: measurement.chars,
      },
    ]),
  );
}

const server = Bun.spawn(['bun', './scripts/playwright-preview-server.ts', '--port', String(PORT)], {
  cwd: SKILL_DIR,
  stdout: 'ignore',
  stderr: 'pipe',
});

try {
  await waitForHealth(`${BASE_URL}/__health`);

  const snapshot: FixtureTrendSnapshot = {
    updatedAt: new Date().toISOString().slice(0, 10),
    renderOutput: buildRenderOutputSnapshot(await measureRenderOutputTrends()),
    hydrationObservedMs: await collectHydrationTrends(),
    hydrationBudgetsMs: buildHydrationBudgetSnapshot(),
  };

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf-8');
  console.log(`Wrote ${OUTPUT_PATH}`);
} finally {
  server.kill();
  await server.exited;
}
