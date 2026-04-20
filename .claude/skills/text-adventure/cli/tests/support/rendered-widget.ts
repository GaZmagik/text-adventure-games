const HTML_ENTITY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/&quot;/g, '"'],
  [/&#39;/g, "'"],
  [/&lt;/g, '<'],
  [/&gt;/g, '>'],
  [/&amp;/g, '&'],
];

export function decodeHtmlEntities(value: string): string {
  let decoded = value;
  for (const [pattern, replacement] of HTML_ENTITY_REPLACEMENTS) {
    decoded = decoded.replace(pattern, replacement);
  }
  return decoded;
}

export function extractTagMatch(html: string, tagName: string): { attrs: string; innerHtml: string } {
  const pattern = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = pattern.exec(html);
  if (!match) {
    throw new Error(`Expected <${tagName}> in rendered HTML.`);
  }
  return {
    attrs: match[1] ?? '',
    innerHtml: match[2] ?? '',
  };
}

export function extractTagAttr(html: string, tagName: string, attrName: string): string | null {
  const { attrs } = extractTagMatch(html, tagName);
  const attrPattern = new RegExp(`\\b${attrName}\\s*=\\s*(['"])(.*?)\\1`, 'i');
  const match = attrPattern.exec(attrs);
  return match?.[2] ?? null;
}

export function extractJsonTagAttr<T>(html: string, tagName: string, attrName: string): T {
  const raw = extractTagAttr(html, tagName, attrName);
  if (raw == null) {
    throw new Error(`Expected attribute ${attrName} on <${tagName}>.`);
  }
  return JSON.parse(decodeHtmlEntities(raw)) as T;
}

export function extractScriptSrcs(html: string): string[] {
  return [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*(['"])(.*?)\1[^>]*><\/script>/gi)]
    .map(match => match[2] ?? '');
}
