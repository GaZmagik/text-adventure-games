/**
 * Shadow DOM wrapper — generates HTML that bootstraps a Shadow DOM
 * with CDN-hosted styles, optional inline CSS, and optional scripts.
 *
 * Follows the v7 proven pattern: custom element with attachShadow,
 * :host override with CSS variable fallbacks, and content injection.
 */

import {
  CDN_BASE,
  CSS_MANIFEST,
  JS_MANIFEST,
  ICON_SPRITE_HASH,
  ICON_SPRITE_URL,
} from '../../../assets/cdn-manifest.ts';
import { esc, emitCustomElement } from '../../lib/html';

type ShadowWrapperOptions = {
  /** Style name matching a key in CSS_MANIFEST (e.g. 'station'). */
  styleName: string;
  /** HTML content to render inside the shadow root. */
  html: string;
  /** Optional inline CSS to inject as a <style> element. */
  inlineCss?: string;
  /** Optional inline script body — has access to the `shadow` variable. */
  script?: string;
  /** Optional array of external script URLs to load. */
  scriptSrc?: string[];
};

/**
 * Escape HTML content for safe embedding inside a JS template literal.
 * Backticks and ${ sequences must be escaped to prevent interpolation.
 */
function escapeForTemplateLiteral(raw: string): string {
  return raw
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')
    .replace(/<\/script/gi, '<\\/script');
}

/**
 * Wrap HTML content in a Shadow DOM bootstrap with CDN styles and
 * optional inline CSS / scripts.
 */
export function wrapInShadowDom(opts: ShadowWrapperOptions): string {
  const { styleName, html, inlineCss, script, scriptSrc } = opts;

  const hash = CSS_MANIFEST[styleName];
  const escapedHtml = escapeForTemplateLiteral(html);

  function withJsHash(rawUrl: string): string {
    const match = rawUrl.match(/\/js\/([^/?#]+)$/);
    if (!match) return rawUrl;
    const hash = JS_MANIFEST[match[1]!];
    return hash ? `${rawUrl}?v=${hash}` : rawUrl;
  }

  // Build CDN link element or warning comment
  let cdnLink = '';
  let warning = '';
  if (hash) {
    cdnLink = `var link=document.createElement('link');link.rel='stylesheet';link.href='${CDN_BASE}/css/${styleName}.css?v=${hash}';shadow.appendChild(link);`;
  } else {
    warning = `<!-- WARNING: style '${styleName}' not found in CSS_MANIFEST -->`;
  }

  // Build inline CSS injection
  let inlineCssBlock = '';
  if (inlineCss !== undefined && inlineCss !== '') {
    inlineCssBlock = `var widgetStyle=document.createElement('style');widgetStyle.textContent=\`${escapeForTemplateLiteral(inlineCss)}\`;shadow.appendChild(widgetStyle);`;
  }

  // Build external script loading — chain onload so inline script runs after all externals load
  let scriptSrcBlock = '';
  let inlineScriptBlock = '';
  if (script !== undefined && script !== '') {
    inlineScriptBlock = script;
  }

  if (scriptSrc && scriptSrc.length > 0) {
    // Chain scripts sequentially: each loads inside the previous one's onload.
    // This prevents race conditions (e.g. SoundscapeEngine undefined when initTagScene runs).
    // Build from innermost (last script + inline) outward to first script.
    let chain = inlineScriptBlock;
    for (let i = scriptSrc.length - 1; i >= 0; i--) {
      const rawUrl = scriptSrc[i]!;
      const url = withJsHash(rawUrl);
      const varName = `_s${i}`;
      const body = chain
        ? `var ${varName}=document.createElement('script');${varName}.src='${url}';${varName}.onload=function(){${chain}};document.head.appendChild(${varName});`
        : `var ${varName}=document.createElement('script');${varName}.src='${url}';document.head.appendChild(${varName});`;
      chain = body;
    }
    scriptSrcBlock = chain;
    inlineScriptBlock = ''; // consumed by chain
  }

  // :host override with CSS variable fallbacks using station defaults.
  // The fallback font value must not contain single quotes — this string is
  // embedded inside a JS single-quoted literal (hostStyle.textContent='...'),
  // so inner quotes would break the generated script. The CSS variable
  // --sta-font-mono carries the full font stack from the external stylesheet;
  // the bare `monospace` here is only the last-resort browser fallback.
  const hostOverride = [
    ':host{display:block;',
    'background:var(--sta-bg-primary,#1A1D2E);',
    'color:var(--sta-text-primary,#E8E6E3);',
    'font-family:var(--sta-font-mono,monospace);',
    '}',
    '.root{background:inherit;color:inherit;}',
  ].join('');

  return `${warning}<div id="shadow-host"></div>
<script>
(function(){
var host=document.getElementById('shadow-host');
var shadow=host.attachShadow({mode:'open'});
var hostStyle=document.createElement('style');hostStyle.textContent='${hostOverride}';shadow.appendChild(hostStyle);
${cdnLink}
${inlineCssBlock}
var content=document.createElement('div');content.className='root';content.innerHTML=\`${escapedHtml}\`;shadow.appendChild(content);
${scriptSrcBlock}
${inlineScriptBlock}
})();
</script>`;
}

type RootCustomElementOptions = {
  /** The tag name (e.g., 'ta-scenario-select') */
  tag: string;
  /** Inner HTML content */
  html?: string;
  /** Attributes to apply to the element */
  attrs?: Record<string, unknown>;
  /** CSS files to load from CDN (e.g., ['station', 'common-widget', 'pregame-design']) */
  cssUrls?: string[];
  /** JS files to load from CDN (e.g., ['ta-components']) */
  jsUrls?: string[];
};

/**
 * Emits a root custom element with its required CDN scripts and CSS URLs.
 * Replaces wrapInShadowDom for top-level widgets.
 */
export function emitRootCustomElement(opts: RootCustomElementOptions): string {
  // Build fully resolved CDN URLs with hashes
  const resolvedCss = (opts.cssUrls || []).map(name => {
    const hash = CSS_MANIFEST[name];
    return hash ? `${CDN_BASE}/css/${name}.css?v=${hash}` : `${CDN_BASE}/css/${name}.css`;
  });

  const resolvedJs = (opts.jsUrls || []).map(name => {
    const hash = JS_MANIFEST[name + '.js'];
    return hash ? `${CDN_BASE}/js/${name}.js?v=${hash}` : `${CDN_BASE}/js/${name}.js`;
  });

  const attrs = { ...(opts.attrs || {}) };
  if (resolvedCss.length > 0) {
    attrs['data-css-urls'] = resolvedCss.join(',');
  }

  const attrStr = Object.entries(attrs)
    .filter(([, v]) => v != null)
    .map(([k, v]) => {
      const strVal = typeof v === 'object' ? JSON.stringify(v) : String(v);
      return ` ${k}="${esc(strVal)}"`;
    })
    .join('');

  const fallback =
    opts.html || `<div style="padding: 20px; font-family: monospace; opacity: 0.6;">Loading ${opts.tag}...</div>`;
  const html = `<${opts.tag}${attrStr}>${fallback}</${opts.tag}>`;

  const scripts = resolvedJs.map(url => `<script src="${url}"></script>`).join('\n');
  const iconBootstrap =
    resolvedJs.length > 0
      ? `<script>window.tag=window.tag||{};window.tag.ICON_SPRITE_URL=${JSON.stringify(ICON_SPRITE_URL)};window.tag.ICON_SPRITE_HASH=${JSON.stringify(ICON_SPRITE_HASH)};</script>`
      : '';

  return scripts ? `${html}\n${iconBootstrap}\n${scripts}` : html;
}

type StandaloneCustomElementOptions = {
  /** The tag name (e.g., 'ta-dice') */
  tag: string;
  /** Active style for standalone renders. Falsy means nested/custom inline usage. */
  styleName?: string | null;
  /** Attributes to apply to the custom element. */
  attrs?: Record<string, unknown>;
  /** Optional fallback light-DOM HTML shown before the runtime upgrades the element. */
  html?: string;
  /** Extra CSS assets beyond the active theme CSS. */
  cssUrls?: string[];
  /** JS assets required to hydrate the custom element. Defaults to ta-components. */
  jsUrls?: string[];
};

/**
 * Emit a custom element that works both standalone and nested inside another widget.
 * Standalone renders include CDN CSS/JS; nested renders return a bare element.
 */
export function emitStandaloneCustomElement(opts: StandaloneCustomElementOptions): string {
  const { tag, styleName, attrs, html, cssUrls, jsUrls } = opts;
  if (!styleName) {
    return emitCustomElement(tag, attrs ?? {}, html ?? '');
  }
  const rootOpts: RootCustomElementOptions = {
    tag,
    cssUrls: [styleName, ...(cssUrls ?? [])],
    jsUrls: jsUrls ?? ['ta-components'],
  };
  if (attrs !== undefined) rootOpts.attrs = attrs;
  if (html !== undefined) rootOpts.html = html;
  return emitRootCustomElement(rootOpts);
}
