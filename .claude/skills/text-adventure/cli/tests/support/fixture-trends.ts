/**
 * Support functions for tracking fixture trend budgets.
 */
import { REVIEWED_RENDER_FIXTURE_NAMES, renderReviewedFixture } from './reviewed-render-fixtures';

export type RenderOutputTrendEntry = {
  fixtureName: string;
  widget: string;
  chars: number;
};

export async function measureRenderOutputTrends(): Promise<RenderOutputTrendEntry[]> {
  const measurements: RenderOutputTrendEntry[] = [];
  for (const fixtureName of REVIEWED_RENDER_FIXTURE_NAMES) {
    const { html, widget } = await renderReviewedFixture(fixtureName);
    measurements.push({ fixtureName, widget, chars: html.length });
  }
  return measurements.sort((a, b) => a.fixtureName.localeCompare(b.fixtureName));
}
