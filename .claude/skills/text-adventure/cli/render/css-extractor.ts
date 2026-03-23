// Extracts ALL fenced CSS code blocks from a style .md file.
// Captures custom properties, @media overrides, @keyframes, @supports.

export async function extractAllCss(filePath: string): Promise<string> {
  try {
    const file = Bun.file(filePath);
    if (!(await file.exists())) return '';

    const content = await file.text();
    const blocks: string[] = [];

    const regex = /```css\s*\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      blocks.push(match[1].trim());
    }

    return blocks.join('\n\n');
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
