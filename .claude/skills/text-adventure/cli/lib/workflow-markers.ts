import { readdirSync, unlinkSync } from 'node:fs';
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
