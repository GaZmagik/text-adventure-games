import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const memoryDir = '/home/gareth/.vs/text-adventure-games/.claude/memory/permanent';
const files = readdirSync(memoryDir);

const categories: Record<string, { count: number; examples: string[] }> = {};

for (const file of files) {
  const prefix = file.split('-')[0] || 'other';
  if (!categories[prefix]) {
    categories[prefix] = { count: 0, examples: [] };
  }
  categories[prefix].count++;
  if (categories[prefix].examples.length < 5) {
    categories[prefix].examples.push(file);
  }
}

console.log('# Memory File Category Analysis');
console.log('| Category | Count | Examples |');
console.log('| :--- | :--- | :--- |');
for (const [cat, data] of Object.entries(categories)) {
  console.log(`| ${cat} | ${data.count} | ${data.examples.join(', ')} |`);
}

console.log('\n## Strategic Integration Priority');
console.log('1. **gotcha-***: High Priority for `@throws` and `@remarks`.');
console.log('2. **learning-***: Medium Priority for `@remarks` and `@example`.');
console.log('3. **decision-***: High Priority for architectural context in JSDoc.');
console.log('4. **artifact-***: Low Priority, mainly reference links.');
