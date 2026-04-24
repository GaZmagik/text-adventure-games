import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractCompactContract } from './contracts';
import { TIER1_MODULES } from './constants';

describe('compact contract extraction', () => {
  test('extracts a marked markdown JSON contract block', () => {
    const content = [
      '# Demo',
      '```json tag-contract',
      JSON.stringify(
        {
          id: 'demo',
          kind: 'module',
          version: '1.4.0',
          summary: 'Short contract.',
          commands: ['tag demo'],
        },
        null,
        2,
      ),
      '```',
    ].join('\n');

    const contract = extractCompactContract('demo', 'module', content);
    expect(contract.source).toBe('markdown');
    expect(contract.summary).toBe('Short contract.');
    expect(contract.commands).toEqual(['tag demo']);
  });

  test('falls back to module digest when no contract block exists', () => {
    const contract = extractCompactContract('core-systems', 'module', '# Core Systems');
    expect(contract.source).toBe('fallback');
    expect(contract.summary).toContain('HP');
    expect(contract.mustRead).toContain('modules/core-systems.md');
  });

  test('falls back and reports parse error for malformed JSON', () => {
    const contract = extractCompactContract('bad', 'module', '```json tag-contract\n{"id":\n```');
    expect(contract.source).toBe('fallback');
    expect(contract.parseError).toBeDefined();
  });

  test('all Tier 1 modules have explicit markdown contracts', () => {
    for (const moduleName of TIER1_MODULES) {
      const content = readFileSync(join(import.meta.dir, '..', '..', 'modules', `${moduleName}.md`), 'utf-8');
      const contract = extractCompactContract(moduleName, 'module', content);
      expect(contract.source).toBe('markdown');
      expect(contract.id).toBe(moduleName);
      expect(contract.summary.length).toBeGreaterThan(20);
    }
  });

  test('all selectable style files have explicit markdown contracts', () => {
    const stylesDir = join(import.meta.dir, '..', '..', 'styles');
    const styleFiles = readdirSync(stylesDir).filter(file => file.endsWith('.md') && file !== 'style-reference.md');
    expect(styleFiles.length).toBeGreaterThan(0);
    for (const file of styleFiles) {
      const styleName = file.replace(/\.md$/, '');
      const content = readFileSync(join(stylesDir, file), 'utf-8');
      const contract = extractCompactContract(styleName, 'style', content);
      expect(contract.source).toBe('markdown');
      expect(contract.id).toBe(styleName);
      expect(contract.summary.length).toBeGreaterThan(20);
    }
  });
});
