import { describe, test, expect } from 'bun:test';
import { handleDev } from './dev';

describe('handleDev', () => {
  test('returns ok with default port 3000', async () => {
    const result = await handleDev([]);
    expect(result.ok).toBe(true);
    expect(result.command).toBe('dev');
    expect((result.data as any).port).toBe(3000);
  });

  test('accepts custom port via --port', async () => {
    const result = await handleDev(['--port', '4000']);
    expect(result.ok).toBe(true);
    expect((result.data as any).port).toBe(4000);
  });

  test('returns error for invalid port', async () => {
    const result = await handleDev(['--port', 'banana']);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain('Invalid port');
  });
});
