/**
 * Support functions for tracking fixture trend budgets.
 */
import {
  REVIEWED_RENDER_FIXTURE_NAMES,
  renderReviewedFixture,
  localiseFixtureAssetUrls,
} from './reviewed-render-fixtures';

export type RenderOutputTrendEntry = {
  fixtureName: string;
  widget: string;
  chars: number;
};

export async function measureRenderOutputTrends(): Promise<RenderOutputTrendEntry[]> {
  const measurements: RenderOutputTrendEntry[] = [];
  for (const fixtureName of REVIEWED_RENDER_FIXTURE_NAMES) {
    const { html, widget } = await renderReviewedFixture(fixtureName);
    // Measure against localised asset URLs so the byte count is independent of the
    // CDN_BASE git ref (e.g. a temporary `@<commit>` testing pin vs the `@v1.4.0` release tag).
    measurements.push({ fixtureName, widget, chars: localiseFixtureAssetUrls(html).length });
  }
  return measurements.sort((a, b) => a.fixtureName.localeCompare(b.fixtureName));
}
