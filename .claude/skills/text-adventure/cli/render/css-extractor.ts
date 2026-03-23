// Extracts CSS from a style .md file.
// Prefers blocks marked with /* @extract */ — if any exist, ONLY those are used.
// Falls back to extracting ALL blocks when no marked blocks are found.
// This prevents documentation CSS examples from being duplicated alongside
// the Complete CSS Block that already contains everything.

const cssCache = new Map<string, string>();

export async function extractAllCss(filePath: string): Promise<string> {
  if (cssCache.has(filePath)) return cssCache.get(filePath)!;
  try {
    const file = Bun.file(filePath);
    if (!(await file.exists())) return '';

    const content = await file.text();
    const markedBlocks: string[] = [];
    const allBlocks: string[] = [];

    const regex = /```css\s*\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const block = match[1].trim();
      allBlocks.push(block);
      if (block.startsWith('/* @extract */')) {
        markedBlocks.push(block);
      }
    }

    // Prefer marked blocks — avoids duplicating documentation examples
    const result = (markedBlocks.length > 0 ? markedBlocks : allBlocks).join('\n\n');
    cssCache.set(filePath, result);
    return result;
  } catch {
    return '';
  }
}

export async function extractCssVars(filePath: string): Promise<Record<string, string>> {
  const css = await extractAllCss(filePath);
  const vars: Record<string, string> = {};

  const regex = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(css)) !== null) {
    const key = match[1].trim();
    const value = match[2].replace(/\/\*.*?\*\//g, '').trim();
    vars[key] = value;
  }

  return vars;
}
