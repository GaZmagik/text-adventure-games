import { ok, fail } from '../lib/errors';
import type { CommandResult } from '../types';
import { parseArgs } from '../lib/args';
import { TEMPLATE_KEYS, handleRender } from './render';
import { join, resolve } from 'node:path';
import { watch } from 'node:fs';

/**
 * Handler for the `tag dev` command.
 * Starts a live-preview server for widget development.
 */
export async function handleDev(args: string[]): Promise<CommandResult> {
  const parsed = parseArgs(args);
  const port = parseInt(parsed.flags.port || '3000', 10);

  if (isNaN(port)) {
    return fail('Invalid port number.', 'Provide a numeric port: --port 3000', 'dev');
  }

  const HOST = parsed.flags.host || '127.0.0.1';
  const SCRIPT_DIR = import.meta.dir;
  const SKILL_DIR = resolve(SCRIPT_DIR, '..');

  let changeCounter = 0;
  const watchers: ReturnType<typeof watch>[] = [];

  // Watch templates and styles
  const dirsToWatch = [
    join(SKILL_DIR, 'cli', 'render', 'templates'),
    join(SKILL_DIR, 'styles'),
  ];

  for (const dir of dirsToWatch) {
    try {
      const watcher = watch(dir, { recursive: true }, (event, filename) => {
        if (filename) {
          changeCounter++;
        }
      });
      watchers.push(watcher);
    } catch (err) {
      console.warn(`Could not watch directory ${dir}:`, err);
    }
  }

  const server = Bun.serve({
    hostname: HOST,
    port,
    async fetch(request: Request) {
      const url = new URL(request.url);
      const pathname = url.pathname;

      if (pathname === '/events') {
        return new Response(
          new ReadableStream({
            start(controller) {
              const timer = setInterval(() => {
                controller.enqueue(`data: ${changeCounter}\n\n`);
              }, 500);
              request.signal.addEventListener('abort', () => {
                clearInterval(timer);
                controller.close();
              });
            },
          }),
          {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
          }
        );
      }

      if (pathname === '/') {
        return new Response(dashboardHtml(TEMPLATE_KEYS), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      if (pathname === '/preview') {
        const widget = url.searchParams.get('widget') || 'scene';
        const data = url.searchParams.get('data') || '{}';
        const style = url.searchParams.get('style') || '';

        const renderArgs = [widget];
        if (style) renderArgs.push('--style', style);
        if (data && data !== '{}') renderArgs.push('--data', data);
        renderArgs.push('--raw');

        const result = await handleRender(renderArgs);
        if (result.ok) {
          return new Response(wrapPreview(String(result.data)), {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        } else {
          return new Response(`Error: ${result.error?.message}`, { status: 500 });
        }
      }

      if (pathname.startsWith('/assets/')) {
        const assetPath = join(SKILL_DIR, pathname);
        const file = Bun.file(assetPath);
        if (await file.exists()) {
          return new Response(file);
        }
        return new Response('Not found', { status: 404 });
      }

      return new Response('Not found', { status: 404 });
    },
  });

  process.stderr.write(`\n🚀 Live-preview server running at http://${HOST}:${server.port}\n`);

  return ok({ port: server.port, hostname: HOST }, 'dev');
}

function wrapPreview(html: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <style>
      :root { color-scheme: dark; }
      html, body { margin: 0; padding: 0; background: #070b13; color: #eef0ff; height: 100%; overflow: hidden; }
      #container { height: 100%; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; }
    </style>
  </head>
  <body>
    <div id="container">
      ${html}
    </div>
  </body>
</html>`;
}

function dashboardHtml(templates: readonly string[]): string {
  const options = templates.map(t => `<option value="${t}">${t}</option>`).join('\n');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>TAG Dev Preview</title>
    <style>
      :root { color-scheme: dark; }
      body { font-family: Inter, system-ui, sans-serif; background: #0b0f19; color: #eef0ff; margin: 0; display: grid; grid-template-columns: 350px 1fr; height: 100vh; overflow: hidden; }
      aside { background: #121826; border-right: 1px solid #2d3748; padding: 20px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }
      h1 { font-size: 18px; margin: 0; color: #7fd9d0; display: flex; align-items: center; gap: 10px; }
      .field { display: flex; flex-direction: column; gap: 8px; }
      label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9aa0c0; }
      select, textarea, input { background: #1a202e; border: 1px solid #2d3748; border-radius: 6px; padding: 10px; color: #fff; font-family: inherit; font-size: 14px; }
      textarea { height: 200px; font-family: 'JetBrains Mono', monospace; font-size: 12px; resize: vertical; }
      main { background: #070b13; position: relative; }
      iframe { width: 100%; height: 100%; border: none; }
      .status { font-size: 11px; color: #4fd1c5; margin-top: auto; padding-top: 20px; border-top: 1px solid #2d3748; }
      button { background: #319795; color: white; border: none; border-radius: 6px; padding: 10px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
      button:hover { background: #2c7a7b; }
    </style>
  </head>
  <body>
    <aside>
      <h1><span>⚙️</span> TAG Dev Tools</h1>
      
      <div class="field">
        <label for="widget-select">Widget Type</label>
        <select id="widget-select">
          ${options}
        </select>
      </div>

      <div class="field">
        <label for="style-input">Visual Style</label>
        <input id="style-input" type="text" placeholder="e.g. station">
      </div>

      <div class="field">
        <label for="data-input">Data JSON</label>
        <textarea id="data-input" placeholder='{"key": "value"}'></textarea>
      </div>

      <button id="refresh-btn">Refresh Preview</button>

      <div class="status" id="watch-status">Watching for changes...</div>
    </aside>
    <main>
      <iframe id="preview-frame"></iframe>
    </main>

    <script>
      const widgetSelect = document.getElementById('widget-select');
      const styleInput = document.getElementById('style-input');
      const dataInput = document.getElementById('data-input');
      const refreshBtn = document.getElementById('refresh-btn');
      const previewFrame = document.getElementById('preview-frame');
      const watchStatus = document.getElementById('watch-status');

      function updatePreview() {
        const widget = widgetSelect.value;
        const style = styleInput.value;
        const data = dataInput.value;
        
        let url = \`/preview?widget=\${encodeURIComponent(widget)}\`;
        if (style) url += \`&style=\${encodeURIComponent(style)}\`;
        if (data) url += \`&data=\${encodeURIComponent(data)}\`;
        
        previewFrame.src = url;
      }

      widgetSelect.onchange = updatePreview;
      refreshBtn.onclick = updatePreview;
      
      // Auto-load last settings
      const saved = localStorage.getItem('tag-dev-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        widgetSelect.value = settings.widget || 'scene';
        styleInput.value = settings.style || '';
        dataInput.value = settings.data || '{}';
      }

      window.onbeforeunload = () => {
        localStorage.setItem('tag-dev-settings', JSON.stringify({
          widget: widgetSelect.value,
          style: styleInput.value,
          data: dataInput.value
        }));
      };

      // SSE for hot-reloading
      const events = new EventSource('/events');
      let lastCounter = -1;
      events.onmessage = (e) => {
        const counter = parseInt(e.data);
        if (lastCounter !== -1 && counter !== lastCounter) {
          watchStatus.textContent = 'Change detected! Reloading...';
          watchStatus.style.color = '#f6ad55';
          updatePreview();
          setTimeout(() => {
            watchStatus.textContent = 'Watching for changes...';
            watchStatus.style.color = '#4fd1c5';
          }, 2000);
        }
        lastCounter = counter;
      };

      updatePreview();
    </script>
  </body>
</html>`;
}
