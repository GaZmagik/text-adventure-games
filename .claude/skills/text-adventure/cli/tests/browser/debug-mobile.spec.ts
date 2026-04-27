import { test, expect } from '@playwright/test';

test.describe('Mobile debugging', () => {
  test('check footer buttons on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/fixtures/scene-rich-panels');

    // Wait for ta-scene to be ready
    await page.waitForSelector('ta-scene', { state: 'attached' });
    // Give it a bit to hydrate
    await new Promise(r => setTimeout(r, 500));

    const buttons = await page.evaluate(() => {
      const scene = document.querySelector('ta-scene');
      if (!scene || !scene.shadowRoot) return 'no scene shadow';

      const footer = scene.shadowRoot.querySelector('ta-footer');
      if (!footer || !footer.shadowRoot) return 'no footer shadow';

      return Array.from(footer.shadowRoot.querySelectorAll('.footer-btn')).map(b => ({
        text: (b as HTMLElement).innerText,
        visible: (b as HTMLElement).offsetParent !== null,
        width: b.getBoundingClientRect().width,
        height: b.getBoundingClientRect().height,
      }));
    });

    console.log('Footer buttons:', JSON.stringify(buttons, null, 2));
    expect(page).toBeDefined();
  });
});
