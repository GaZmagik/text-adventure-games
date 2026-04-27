/**
 * Local preview server for Playwright browser tests.
 */
import { relative, resolve } from 'node:path';
import {
  PLAYWRIGHT_RENDER_FIXTURE_NAMES,
  PLAYWRIGHT_RENDER_FIXTURES,
  localiseFixtureAssetUrls,
  renderPlaywrightFixture,
  type PlaywrightRenderFixtureName,
} from '../cli/tests/support/reviewed-render-fixtures';

const HOST = '127.0.0.1';
const DEFAULT_PORT = 4173;
const SCRIPT_DIR = import.meta.dir;
const SKILL_DIR = resolve(SCRIPT_DIR, '..');
const ASSETS_DIR = resolve(SKILL_DIR, 'assets');

type PreparedFixturePage = {
  title: string;
  html: string;
  widget: string;
};

function parsePort(argv: string[]): number {
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] !== '--port') continue;
    const raw = argv[index + 1];
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed > 0 && parsed <= 65535) {
      return parsed;
    }
    throw new Error(`Invalid --port value: ${raw ?? '(missing)'}`);
  }
  return DEFAULT_PORT;
}

function titleFromName(name: string): string {
  return name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function wrapDocument(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <style>
      :root { color-scheme: dark; }
      html, body { margin: 0; padding: 0; min-height: 100%; background: #070b13; color: #eef0ff; }
      body { font-family: Inter, system-ui, sans-serif; }
      main { max-width: 1280px; margin: 0 auto; padding: 24px; }
      a { color: #7fd9d0; }
      .fixture-shell { display: grid; gap: 16px; }
      .fixture-meta { display: grid; gap: 4px; }
      .fixture-kicker { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #9aa0c0; }
      .fixture-title { font-size: 24px; font-weight: 700; }
      .fixture-body { display: grid; gap: 16px; }
      .fixture-list { display: grid; gap: 10px; }
      .fixture-list li { line-height: 1.4; }
    </style>
  </head>
  <body>
    <main>${body}</main>
  </body>
</html>`;
}

function indexPage(): string {
  const items = PLAYWRIGHT_RENDER_FIXTURE_NAMES.map(name => {
    const fixture = PLAYWRIGHT_RENDER_FIXTURES[name];
    return `<li><a href="/fixtures/${name}">${fixture.title}</a> <span>(${fixture.widget})</span></li>`;
  }).join('\n');

  return wrapDocument(
    'Playwright Preview Fixtures',
    `<section class="fixture-shell">
      <div class="fixture-meta">
        <div class="fixture-kicker">Playwright Preview</div>
        <div class="fixture-title">Reviewed render fixtures</div>
      </div>
      <ul class="fixture-list">${items}</ul>
    </section>`,
  );
}

async function buildPages(): Promise<Map<PlaywrightRenderFixtureName, PreparedFixturePage>> {
  const pages = new Map<PlaywrightRenderFixtureName, PreparedFixturePage>();
  for (const name of PLAYWRIGHT_RENDER_FIXTURE_NAMES) {
    const { title, widget, html } = await renderPlaywrightFixture(name);
    pages.set(name, {
      title,
      widget,
      html: wrapDocument(
        `${title} Fixture`,
        `<section class="fixture-shell">
          <div class="fixture-meta">
            <div class="fixture-kicker">Reviewed Fixture</div>
            <div class="fixture-title">${title}</div>
            <div>${titleFromName(name)} · ${widget}</div>
          </div>
          <div class="fixture-body">${localiseFixtureAssetUrls(html)}</div>
        </section>`,
      ),
    });
  }
  return pages;
}

function resolveAssetPath(pathname: string): string | null {
  const fullPath = resolve(SKILL_DIR, `.${pathname}`);
  const rel = relative(ASSETS_DIR, fullPath);
  if (rel === '' || rel.startsWith('..')) return null;
  return fullPath;
}

const fixturePages = await buildPages();
const port = parsePort(Bun.argv.slice(2));

const server = Bun.serve({
  hostname: HOST,
  port,
  async fetch(request: Request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname === '/__health') {
      return new Response('ok', { status: 200 });
    }

    if (pathname === '/favicon.ico') {
      return new Response(null, { status: 204 });
    }

    if (pathname === '/') {
      return new Response(indexPage(), {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }

    if (pathname.startsWith('/assets/')) {
      const assetPath = resolveAssetPath(pathname);
      if (!assetPath) {
        return new Response('Not found', { status: 404 });
      }
      const assetFile = Bun.file(assetPath);
      if (!(await assetFile.exists())) {
        return new Response('Not found', { status: 404 });
      }
      return new Response(assetFile);
    }

    if (pathname.startsWith('/fixtures/')) {
      const name = pathname.slice('/fixtures/'.length) as PlaywrightRenderFixtureName;
      const page = fixturePages.get(name);
      if (!page) {
        return new Response('Fixture not found', { status: 404 });
      }
      return new Response(page.html, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
});

console.log(`Playwright preview server listening on http://${HOST}:${server.port}`);
