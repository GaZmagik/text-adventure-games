import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { HYDRATION_BUDGET_CASES } from '../browser/hydration-cases';
import { measureRenderOutputTrends } from '../support/fixture-trends';
import { REVIEWED_RENDER_FIXTURE_NAMES } from '../support/reviewed-render-fixtures';

const TREND_PATH = join(import.meta.dir, 'fixture-trends.json');

type FixtureTrendSnapshot = {
  updatedAt: string;
  renderOutput: Record<string, { widget: string; chars: number }>;
  hydrationObservedMs: Record<string, number>;
  hydrationBudgetsMs: Record<string, number>;
};

async function readTrendSnapshot(): Promise<FixtureTrendSnapshot> {
  return (await Bun.file(TREND_PATH).json()) as FixtureTrendSnapshot;
}

describe('fixture trend data', () => {
  test('render output trend snapshot stays aligned with reviewed fixtures', async () => {
    const snapshot = await readTrendSnapshot();
    const current = await measureRenderOutputTrends();

    expect(Object.keys(snapshot.renderOutput).sort()).toEqual(REVIEWED_RENDER_FIXTURE_NAMES);

    for (const measurement of current) {
      expect(snapshot.renderOutput[measurement.fixtureName]).toEqual({
        widget: measurement.widget,
        chars: measurement.chars,
      });
    }
  });

  test('hydration trend snapshot stays aligned with reviewed browser cases and budgets', async () => {
    const snapshot = await readTrendSnapshot();
    const caseNames = Object.keys(HYDRATION_BUDGET_CASES).sort();

    expect(Object.keys(snapshot.hydrationObservedMs).sort()).toEqual(caseNames);
    expect(Object.keys(snapshot.hydrationBudgetsMs).sort()).toEqual(caseNames);

    for (const name of caseNames) {
      expect(snapshot.hydrationBudgetsMs[name]).toBe(HYDRATION_BUDGET_CASES[name]!.maxMs);
      expect(snapshot.hydrationObservedMs[name]).toBeGreaterThan(0);
      expect(snapshot.hydrationObservedMs[name]).toBeLessThanOrEqual(HYDRATION_BUDGET_CASES[name]!.maxMs);
    }
  });

  test('trend snapshot records a concrete review date', async () => {
    const snapshot = await readTrendSnapshot();
    expect(snapshot.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
