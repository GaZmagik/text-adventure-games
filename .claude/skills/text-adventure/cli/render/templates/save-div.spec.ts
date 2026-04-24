import { describe, expect, test } from 'bun:test';
import { createDefaultState } from '../../lib/state-store';
import { decodeHtmlEntities } from '../../tests/support/rendered-widget';
import { renderSaveDiv } from './save-div';

function extractPayload(html: string): string {
  const match = html.match(/data-payload="([^"]*)"/);
  if (!match) throw new Error('Expected save payload attribute.');
  return decodeHtmlEntities(match[1]!);
}

describe('renderSaveDiv', () => {
  test('embeds explicit save payload data in the hidden save div', () => {
    const payload = extractPayload(
      renderSaveDiv(null, '', {
        data: { scene: 4, note: 'safe payload' },
      }),
    );

    expect(JSON.parse(payload)).toEqual({ scene: 4, note: 'safe payload' });
  });

  test('escapes hostile payload text before embedding in HTML', () => {
    const html = renderSaveDiv(null, '', {
      data: { note: '<img src=x onerror=alert(1)>' },
    });

    expect(html).not.toContain('<img src=x');
    expect(JSON.parse(extractPayload(html))).toEqual({ note: '<img src=x onerror=alert(1)>' });
  });

  test('serialises current state when explicit data is absent', () => {
    const state = createDefaultState();
    state.scene = 9;

    const payload = JSON.parse(extractPayload(renderSaveDiv(state, '')));

    expect(payload.scene).toBe(9);
  });
});
