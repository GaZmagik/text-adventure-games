import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const tsFiles: string[] = [];

function walk(dir: string) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      if (entry === 'node_modules' || entry === '.git') continue;
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') && !fullPath.endsWith('.spec.ts')) {
      tsFiles.push(fullPath);
    }
  }
}

walk(root);

console.log('| File | Total Lines | Comment Lines | Comment % |');
console.log('| :--- | :--- | :--- | :--- |');

for (const file of tsFiles) {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  let commentLines = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (inBlockComment) {
      commentLines++;
      if (trimmed.includes('*/')) inBlockComment = false;
    } else {
      if (trimmed.startsWith('//')) {
        commentLines++;
      } else if (trimmed.startsWith('/*')) {
        commentLines++;
        if (!trimmed.includes('*/')) inBlockComment = true;
      }
    }
  }

  const relative = file.replace(root, '');
  const percent = ((commentLines / lines.length) * 100).toFixed(1);
  console.log(`| ${relative} | ${lines.length} | ${commentLines} | ${percent}% |`);
}
