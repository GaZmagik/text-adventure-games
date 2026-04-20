import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const tsFiles: string[] = [];

function walk(dir: string) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'tests' || entry === 'scratch') continue;
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') && !fullPath.endsWith('.spec.ts')) {
      tsFiles.push(fullPath);
    }
  }
}

walk(root);

console.log('# Documentation Inventory Report');
console.log('Generated: ' + new Date().toISOString() + '\n');

for (const file of tsFiles) {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  
  const missingItems: string[] = [];
  const coveredItems: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('export function') || 
        line.startsWith('export class') || 
        line.startsWith('export type') || 
        line.startsWith('export interface') ||
        line.startsWith('export const')) {
      
      const itemName = line.split(/\s+/)[2]?.split(/[({<:=]/)[0] || 'unknown';
      
      let hasJSDoc = false;
      for (let j = i - 1; j >= 0; j--) {
        const prevLine = lines[j].trim();
        if (prevLine === '*/') {
          for (let k = j - 1; k >= 0; k--) {
            if (lines[k].trim().startsWith('/**')) {
              hasJSDoc = true;
              break;
            }
            if (lines[k].trim() === '' || !lines[k].trim().startsWith('*')) break;
          }
          break;
        }
        if (prevLine !== '' && !prevLine.startsWith('//')) break;
      }
      
      if (hasJSDoc) coveredItems.push(itemName);
      else missingItems.push(itemName);
    }
  }

  if (missingItems.length > 0 || coveredItems.length > 0) {
    const relative = file.replace(root, '');
    console.log(`## ${relative}`);
    console.log(`- **Covered**: ${coveredItems.length}`);
    console.log(`- **Missing**: ${missingItems.length}`);
    if (missingItems.length > 0) {
      console.log(`- **Missing Items**: \`${missingItems.join('`, `')}\``);
    }
    console.log('');
  }
}
