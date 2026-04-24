// Compact contracts summarize markdown modules and styles for context recovery after compaction.
import { MODULE_DIGESTS } from '../data/module-digests';

export type ContractKind = 'module' | 'style' | 'style-reference';

export type CompactContract = {
  id: string;
  kind: ContractKind;
  version: string;
  summary: string;
  source: 'markdown' | 'fallback';
  mustRead?: string[];
  commands?: string[];
  outputs?: string[];
  state?: string[];
  render?: string[];
  notes?: string[];
  parseError?: string;
};

const CONTRACT_BLOCK_RE = /```json\s+tag-contract\s*\n([\s\S]*?)```/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.map(item => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function stringField(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeParsedContract(
  id: string,
  kind: ContractKind,
  parsed: unknown,
  fallback: CompactContract,
): CompactContract | null {
  if (!isRecord(parsed)) return null;
  const contract: CompactContract = {
    id: stringField(parsed.id, id),
    kind: parsed.kind === 'module' || parsed.kind === 'style' || parsed.kind === 'style-reference' ? parsed.kind : kind,
    version: stringField(parsed.version, fallback.version),
    summary: stringField(parsed.summary, fallback.summary),
    source: 'markdown',
  };
  for (const key of ['mustRead', 'commands', 'outputs', 'state', 'render', 'notes'] as const) {
    const items = stringArray(parsed[key]);
    if (items) contract[key] = items;
  }
  return contract;
}

function fallbackSummaryFromMarkdown(content: string, id: string): string {
  const frontmatterDescription = content.match(/\ndescription:\s*>\s*\n([\s\S]*?)(?:\n\S|\n---)/);
  if (frontmatterDescription?.[1]) {
    const desc = frontmatterDescription[1]
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .join(' ');
    if (desc) return desc.slice(0, 260);
  }

  const firstQuote = content.match(/^>\s*(.+)$/m)?.[1]?.trim();
  if (firstQuote) return firstQuote.slice(0, 260);

  const firstParagraph = content
    .split(/\n\s*\n/)
    .map(block => block.replace(/^#.*$/gm, '').trim())
    .find(Boolean);
  return firstParagraph ? firstParagraph.replace(/\s+/g, ' ').slice(0, 260) : `Compact contract for ${id}.`;
}

export function buildFallbackContract(id: string, kind: ContractKind, content = ''): CompactContract {
  if (kind === 'module') {
    return {
      id,
      kind,
      version: '1.4.0',
      summary: MODULE_DIGESTS[id] ?? fallbackSummaryFromMarkdown(content, id),
      source: 'fallback',
      mustRead: [`modules/${id}.md`],
      notes: ['Fallback digest generated because no valid markdown tag-contract block was found.'],
    };
  }

  if (kind === 'style-reference') {
    return {
      id,
      kind,
      version: '1.4.0',
      summary: 'Structural CSS and widget composition contract shared by all visual styles.',
      source: 'fallback',
      mustRead: ['styles/style-reference.md'],
      render: ['Custom-element output uses shared scene/footer/panel contracts.'],
      notes: ['Fallback digest generated because no valid markdown tag-contract block was found.'],
    };
  }

  return {
    id,
    kind,
    version: '1.4.0',
    summary: fallbackSummaryFromMarkdown(content, id),
    source: 'fallback',
    mustRead: [`styles/${id}.md`, 'styles/style-reference.md'],
    render: ['Defines theme tokens consumed by CDN-backed ta-* widgets.'],
    notes: ['Fallback digest generated because no valid markdown tag-contract block was found.'],
  };
}

export function extractCompactContract(id: string, kind: ContractKind, content: string): CompactContract {
  const fallback = buildFallbackContract(id, kind, content);
  const match = content.match(CONTRACT_BLOCK_RE);
  if (!match?.[1]) return fallback;

  try {
    const parsed = JSON.parse(match[1]);
    const contract = normalizeParsedContract(id, kind, parsed, fallback);
    if (!contract) {
      return {
        ...fallback,
        parseError: 'tag-contract block must contain a JSON object.',
      };
    }
    return contract;
  } catch (err) {
    return {
      ...fallback,
      parseError: err instanceof Error ? err.message : 'Invalid JSON in tag-contract block.',
    };
  }
}
