/**
 * Shadow DOM wrapper — generates HTML that bootstraps a Shadow DOM
 * with CDN-hosted styles, optional inline CSS, and optional scripts.
 *
 * Follows the v7 proven pattern: custom element with attachShadow,
 * :host override with CSS variable fallbacks, and content injection.
 */

import { CDN_BASE, CSS_MANIFEST } from '../../../assets/cdn-manifest.ts';

export interface ShadowWrapperOptions {
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
}

/**
 * Escape HTML content for safe embedding inside a JS template literal.
 * Backticks and ${ sequences must be escaped to prevent interpolation.
 */
function escapeForTemplateLiteral(raw: string): string {
  return raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

/**
 * Wrap HTML content in a Shadow DOM bootstrap with CDN styles and
 * optional inline CSS / scripts.
 */
export function wrapInShadowDom(opts: ShadowWrapperOptions): string {
  const { styleName, html, inlineCss, script, scriptSrc } = opts;

  const hash = CSS_MANIFEST[styleName];
  const escapedHtml = escapeForTemplateLiteral(html);

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
    // Load scripts sequentially: each waits for the previous to load.
    // The last script's onload triggers the inline script.
    const loads: string[] = [];
    for (let i = 0; i < scriptSrc.length; i++) {
      const url = scriptSrc[i]!;
      const varName = `_s${i}`;
      const isLast = i === scriptSrc.length - 1;
      if (isLast && inlineScriptBlock) {
        loads.push(`var ${varName}=document.createElement('script');${varName}.src='${url}';${varName}.onload=function(){${inlineScriptBlock}};document.head.appendChild(${varName});`);
        inlineScriptBlock = ''; // consumed by onload
      } else {
        loads.push(`var ${varName}=document.createElement('script');${varName}.src='${url}';document.head.appendChild(${varName});`);
      }
    }
    scriptSrcBlock = loads.join('');
  }

  // :host override with CSS variable fallbacks using station defaults
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
