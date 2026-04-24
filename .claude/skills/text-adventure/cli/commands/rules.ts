import type { CommandResult } from '../types';
import { ok } from '../lib/errors';
import { RULES, CATEGORIES, type Category } from '../data/rules';

/** Type guard: narrows a string to Category if it is a valid CATEGORIES member. */
function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

export async function handleRules(args: string[]): Promise<CommandResult> {
  const query = args[0]?.toLowerCase();

  // No args — return all rules
  if (!query) {
    return ok(
      {
        category: 'ALL',
        rules: RULES,
        total: RULES.length,
        hint: `Run tag rules <category> to filter. Categories: ${CATEGORIES.join(', ')}`,
      },
      'rules',
    );
  }

  // Check if query matches a category
  if (isCategory(query)) {
    const filtered = RULES.filter(r => r.category === query);
    return ok(
      {
        category: query,
        rules: filtered,
        total: filtered.length,
        hint: `Showing ${query} rules. Run tag rules for all rules.`,
      },
      'rules',
    );
  }

  // Keyword search across rule text
  const filtered = RULES.filter(r => r.rule.toLowerCase().includes(query) || r.ref.toLowerCase().includes(query));

  return ok(
    {
      category: `search: ${query}`,
      rules: filtered,
      total: filtered.length,
      hint:
        filtered.length > 0
          ? `Found ${filtered.length} rules matching "${query}".`
          : `No rules match "${query}". Categories: ${CATEGORIES.join(', ')}`,
    },
    'rules',
  );
}
