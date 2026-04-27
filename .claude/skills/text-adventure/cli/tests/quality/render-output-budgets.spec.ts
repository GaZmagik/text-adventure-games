import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { REVIEWED_RENDER_FIXTURE_NAMES, REVIEWED_RENDER_FIXTURES } from '../support/reviewed-render-fixtures';
import { measureRenderOutputTrends } from '../support/fixture-trends';

const BUDGET_PATH = join(import.meta.dir, 'render-output-budgets.json');

type RenderOutputBudgetConfig = {
  fixtures: Record<string, number>;
};

async function readBudgets(): Promise<RenderOutputBudgetConfig> {
  return (await Bun.file(BUDGET_PATH).json()) as RenderOutputBudgetConfig;
}

function overBudgetMessage(fixtureName: string, widget: string, actualChars: number, budgetChars: number): string {
  return `${fixtureName} (${widget}): ${actualChars} chars exceeds ${budgetChars} char budget`;
}

describe('render output budgets', () => {
  test('budget config stays aligned with the reviewed fixture set', async () => {
    const budgets = await readBudgets();
    const budgetFixtureNames = Object.keys(budgets.fixtures).sort();

    expect(budgetFixtureNames).toEqual(REVIEWED_RENDER_FIXTURE_NAMES);
  });

  test('representative widget renders stay within reviewed character budgets', async () => {
    const budgets = await readBudgets();
    const failures: string[] = [];

    for (const measurement of await measureRenderOutputTrends()) {
      const budgetChars = budgets.fixtures[measurement.fixtureName];
      if (budgetChars === undefined) {
        failures.push(`${measurement.fixtureName} (${measurement.widget}): missing budget entry`);
        continue;
      }
      if (measurement.chars > budgetChars) {
        failures.push(overBudgetMessage(measurement.fixtureName, measurement.widget, measurement.chars, budgetChars));
      }
    }

    expect(failures).toEqual([]);
  });

  test('fixture registry keys stay sorted and unique', () => {
    const registryKeys = Object.keys(REVIEWED_RENDER_FIXTURES);
    const sortedKeys = [...registryKeys].sort();

    expect(registryKeys.length).toBe(new Set(registryKeys).size);
    expect(sortedKeys).toEqual(REVIEWED_RENDER_FIXTURE_NAMES);
  });
});
