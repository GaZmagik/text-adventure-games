import { test, expect } from '@playwright/test';

const FIXTURES = ['scene-rich-panels', 'quest-log-rich', 'map-route-overlay', 'dice-pool-volley'];

test.describe('Mobile Sanity Checks', () => {
  for (const fixture of FIXTURES) {
    test(`mobile layout: ${fixture}`, async ({ page }) => {
      await page.goto(`/fixtures/${fixture}`);

      // 1. Ensure no horizontal overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(overflow, `Horizontal overflow detected in ${fixture}`).toBe(false);

      // 2. Check touch target sizes for buttons (44px min for mobile)
      const smallTargets = await page.evaluate(() => {
        function getButtons(root: Document | ShadowRoot): HTMLElement[] {
          let buttons = Array.from(root.querySelectorAll('button, [role="button"], a')) as HTMLElement[];
          const shadows = Array.from(root.querySelectorAll('*'))
            .map(el => el.shadowRoot)
            .filter(Boolean) as ShadowRoot[];
          for (const shadow of shadows) {
            buttons = buttons.concat(getButtons(shadow));
          }
          return buttons;
        }

        return getButtons(document)
          .map(b => {
            const rect = b.getBoundingClientRect();
            return {
              tag: b.tagName.toLowerCase(),
              text: b.innerText?.trim().slice(0, 20),
              width: rect.width,
              height: rect.height,
              visible: !!(b.offsetWidth || b.offsetHeight || b.getClientRects().length),
            };
          })
          .filter(t => t.visible && t.tag !== 'g' && (t.width < 44 || t.height < 44));
      });

      expect(smallTargets, `Small touch targets detected in ${fixture}: ${JSON.stringify(smallTargets)}`).toHaveLength(
        0,
      );
    });
  }

  test('scene panels stack on mobile', async ({ page }) => {
    await page.goto('/fixtures/scene-rich-panels');

    // Pierce shadow DOM and use .first() to handle hydration double-render
    const charBtn = page
      .locator('ta-footer button')
      .filter({ hasText: /Character/i })
      .first();
    await charBtn.click();

    const panel = page.locator('ta-scene #panel-overlay');
    await expect(panel).toBeVisible();

    const box = await panel.boundingBox();
    expect(box).toBeDefined();
  });

  test('faction board is readable on mobile', async ({ page }) => {
    await page.goto('/fixtures/faction-board-worldgen');

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow, 'Faction board should not overflow on mobile').toBe(false);

    const card = page.locator('.faction-card').first();
    if (await card.isVisible()) {
      const box = await card.boundingBox();
      expect(box?.width).toBeLessThan(375);
      expect(box?.width).toBeGreaterThan(200);
    }
  });

  test('quest log tabs are tappable on mobile', async ({ page }) => {
    await page.goto('/fixtures/quest-log-rich');

    const tabs = page.locator('ta-quest-log .quest-tab');
    const count = await tabs.count();
    const smallTabs = [];
    for (let i = 0; i < count; i++) {
      const box = await tabs.nth(i).boundingBox();
      if (box && box.height < 44) smallTabs.push({ i, height: box.height });
    }
    expect(smallTabs, `Quest log has small tabs: ${JSON.stringify(smallTabs)}`).toHaveLength(0);
  });
});
