import { existsSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { getSyncMarkerPath } from './state-store';

type ClearWorkflowMarkerOptions = {
  includePreGameVerify?: boolean;
};

function getWorkflowMarkerDir(): string {
  return dirname(getSyncMarkerPath());
}

export function clearWorkflowMarkers(options: ClearWorkflowMarkerOptions = {}): void {
  const dir = getWorkflowMarkerDir();

  for (const fileName of ['.last-sync', '.last-verify', '.needs-verify']) {
    try { unlinkSync(join(dir, fileName)); } catch { /* best-effort cleanup */ }
  }

  if (!options.includePreGameVerify) return;

  try {
    for (const entry of readdirSync(dir)) {
      if (!entry.startsWith('.verified-')) continue;
      try { unlinkSync(join(dir, entry)); } catch { /* best-effort cleanup */ }
    }
  } catch {
    /* state dir may not exist yet */
  }
}

const COMPACTION_BLOCK_MARKER = '.compaction-blocked';

function getCompactionBlockPath(): string {
  return join(getWorkflowMarkerDir(), COMPACTION_BLOCK_MARKER);
}

export function writeCompactionBlock(reason: string): void {
  try {
    writeFileSync(getCompactionBlockPath(), reason, { encoding: 'utf-8', mode: 0o600 });
  } catch { /* state dir may not exist — non-fatal */ }
}

export function clearCompactionBlock(): void {
  try { unlinkSync(getCompactionBlockPath()); } catch { /* best-effort */ }
}

export function isCompactionBlocked(): boolean {
  try {
    return existsSync(getCompactionBlockPath());
  } catch {
    return false;
  }
}
