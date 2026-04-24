/** In-memory queue for non-fatal command warnings that should be attached to the next CLI JSON response. */
const warningQueue: string[] = [];

export function recordWarning(message: string): void {
  warningQueue.push(message);
}

export function drainDiagnosticWarnings(): string[] {
  const warnings = [...warningQueue];
  warningQueue.length = 0;
  return warnings;
}
