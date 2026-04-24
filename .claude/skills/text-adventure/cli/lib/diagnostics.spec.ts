import { describe, expect, test } from 'bun:test';
import { drainDiagnosticWarnings, recordWarning } from './diagnostics';

describe('diagnostics', () => {
  test('queues and drains warning messages', () => {
    drainDiagnosticWarnings();
    recordWarning('first warning');
    recordWarning('second warning');

    expect(drainDiagnosticWarnings()).toEqual(['first warning', 'second warning']);
    expect(drainDiagnosticWarnings()).toEqual([]);
  });
});
