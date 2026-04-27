/**
 * Playwright support utilities for page monitoring and contrast checks.
 */
/// <reference lib="dom" />
import { expect, type Locator, type Page } from '@playwright/test';

const ALLOWED_HOST = `127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? '4173'}`;

export type PageMonitor = {
  consoleErrors: string[];
  externalRequests: string[];
  pageErrors: string[];
};

export function monitorPage(page: Page): PageMonitor {
  const consoleErrors: string[] = [];
  const externalRequests: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', message => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  page.on('request', request => {
    const url = new URL(request.url());
    if (url.protocol === 'data:' || url.protocol === 'blob:' || url.protocol === 'about:') {
      return;
    }
    if (url.host !== ALLOWED_HOST) {
      externalRequests.push(request.url());
    }
  });

  return { consoleErrors, externalRequests, pageErrors };
}

export function expectHealthyRuntime(monitor: PageMonitor): void {
  expect(monitor.consoleErrors).toEqual([]);
  expect(monitor.pageErrors).toEqual([]);
  expect(monitor.externalRequests).toEqual([]);
}

export async function installPromptTrap(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const prompts: string[] = [];
    const trap = (prompt: string) => {
      prompts.push(String(prompt));
    };
    (globalThis as typeof globalThis & { __capturedPrompts?: string[] }).__capturedPrompts = prompts;
    (globalThis as typeof globalThis & { sendPrompt?: (prompt: string) => void }).sendPrompt = trap;
  });
}

export async function capturedPrompts(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const value = (globalThis as typeof globalThis & { __capturedPrompts?: string[] }).__capturedPrompts;
    return Array.isArray(value) ? value.slice() : [];
  });
}

export async function expectPromptCaptured(page: Page, pattern: RegExp): Promise<void> {
  await expect
    .poll(async () => {
      const prompts = await capturedPrompts(page);
      return prompts.some(prompt => pattern.test(prompt));
    })
    .toBe(true);
}

export async function hydrationElapsedMs(page: Page, readySelector: string): Promise<number> {
  await expect(page.locator(readySelector)).toBeVisible();
  return page.evaluate(() => performance.now());
}

export async function canvasHasPaint(page: Page, selector: string): Promise<boolean> {
  const locator = page.locator(selector);
  await expect(locator).toBeVisible();

  const probeId = '__playwright-blank-canvas-probe';
  await locator.evaluate((node, id) => {
    const canvas = node as {
      width?: number;
      height?: number;
      ownerDocument?: {
        getElementById?: (value: string) => unknown;
        createElement?: (tag: string) => unknown;
        body?: {
          appendChild?: (child: unknown) => void;
        };
      };
    };
    const doc = canvas.ownerDocument;
    if (!doc || typeof doc.createElement !== 'function' || typeof doc.body?.appendChild !== 'function') {
      return;
    }
    const existing = typeof doc.getElementById === 'function' ? doc.getElementById(id) : null;
    if (existing && typeof (existing as { remove?: () => void }).remove === 'function') {
      (existing as { remove: () => void }).remove();
    }
    const blank = doc.createElement('canvas') as {
      id?: string;
      width?: number;
      height?: number;
      style?: {
        cssText?: string;
      };
    };
    blank.id = id;
    blank.width = Number(canvas.width) || 1;
    blank.height = Number(canvas.height) || 1;
    if (blank.style) {
      blank.style.cssText = `position:fixed;left:-10000px;top:0;width:${blank.width}px;height:${blank.height}px;pointer-events:none;opacity:1;`;
    }
    doc.body.appendChild(blank);
  }, probeId);

  try {
    const actual = await locator.screenshot();
    const blank = await page.locator(`#${probeId}`).screenshot();
    return !actual.equals(blank);
  } finally {
    await page.evaluate(id => {
      const doc = (
        globalThis as {
          document?: { getElementById?: (value: string) => { remove?: () => void } | null };
        }
      ).document;
      doc?.getElementById?.(id)?.remove?.();
    }, probeId);
  }
}

type ContrastMeasurement = {
  ratio: number;
  foreground: string;
  background: string;
  text: string;
};

export async function contrastRatio(locator: Locator): Promise<ContrastMeasurement> {
  return locator.evaluate((node: Element) => {
    type Rgba = { r: number; g: number; b: number; a: number };

    function parseColor(value: string): Rgba {
      const match = value.match(/rgba?\(([^)]+)\)/i);
      if (!match || !match[1]) return { r: 255, g: 255, b: 255, a: 1 };
      const parts = match[1]
        .split(',')
        .map(part => Number(part.trim()))
        .filter(part => Number.isFinite(part));
      return {
        r: parts[0] ?? 255,
        g: parts[1] ?? 255,
        b: parts[2] ?? 255,
        a: parts[3] ?? 1,
      };
    }

    function blend(base: Rgba, overlay: Rgba): Rgba {
      const alpha = overlay.a + base.a * (1 - overlay.a);
      if (alpha <= 0) return { r: 0, g: 0, b: 0, a: 0 };
      return {
        r: (overlay.r * overlay.a + base.r * base.a * (1 - overlay.a)) / alpha,
        g: (overlay.g * overlay.a + base.g * base.a * (1 - overlay.a)) / alpha,
        b: (overlay.b * overlay.a + base.b * base.a * (1 - overlay.a)) / alpha,
        a: alpha,
      };
    }

    function rgbaString(color: Rgba): string {
      return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${color.a.toFixed(3)})`;
    }

    function srgb(value: number): number {
      const scaled = value / 255;
      return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
    }

    function luminance(color: Rgba): number {
      return 0.2126 * srgb(color.r) + 0.7152 * srgb(color.g) + 0.0722 * srgb(color.b);
    }

    function effectiveBackgroundColor(element: Element): Rgba {
      const chain: Element[] = [];
      let current: Element | null = element;
      while (current) {
        chain.push(current);
        const root = current.getRootNode();
        current = current.parentElement || ((root as ShadowRoot).host as Element | null) || null;
      }

      let background = parseColor(getComputedStyle(document.documentElement).backgroundColor);
      if (background.a === 0) background = parseColor(getComputedStyle(document.body).backgroundColor);
      if (background.a === 0) background = { r: 255, g: 255, b: 255, a: 1 };

      for (let index = chain.length - 1; index >= 0; index -= 1) {
        const el = chain[index];
        if (!el) continue;
        const layer = parseColor(getComputedStyle(el).backgroundColor);
        if (layer.a > 0) background = blend(background, layer);
      }

      return background;
    }

    const foreground = parseColor(getComputedStyle(node).color);
    const background = effectiveBackgroundColor(node);
    const lighter = Math.max(luminance(foreground), luminance(background));
    const darker = Math.min(luminance(foreground), luminance(background));
    return {
      ratio: Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2)),
      foreground: rgbaString(foreground),
      background: rgbaString(background),
      text: (node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
    };
  });
}

export async function expectContrastAtLeast(locator: Locator, minimumRatio: number): Promise<void> {
  const measurement = await contrastRatio(locator);
  expect(
    measurement.ratio,
    `${measurement.text || 'element'} contrast ${measurement.ratio}:1 below ${minimumRatio}:1 (${measurement.foreground} on ${measurement.background})`,
  ).toBeGreaterThanOrEqual(minimumRatio);
}

export async function computedStyleValue(locator: Locator, property: string): Promise<string> {
  return locator.evaluate(
    (node: Element, cssProperty: string) => getComputedStyle(node).getPropertyValue(cssProperty),
    property,
  );
}
