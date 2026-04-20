import { describe, test, expect } from 'bun:test';
import { stampRenderOrigin, hasValidRenderOrigin } from './render-origin';

describe('render-origin', () => {
  test('stampRenderOrigin adds a valid comment block', () => {
    const html = '<div class="test"></div>';
    const widgetType = 'test-widget';
    const result = stampRenderOrigin(widgetType, html);
    
    expect(result).toMatch(/^<!-- TAG-RENDER:test-widget:[0-9a-f]{8} -->\n/);
    expect(result).toContain(html);
  });

  test('hasValidRenderOrigin validates a stamped html', () => {
    const html = '<div class="test"></div>';
    const widgetType = 'test-widget';
    const stamped = stampRenderOrigin(widgetType, html);
    
    expect(hasValidRenderOrigin(widgetType, stamped)).toBe(true);
  });

  test('hasValidRenderOrigin fails if html is modified', () => {
    const html = '<div class="test"></div>';
    const widgetType = 'test-widget';
    const stamped = stampRenderOrigin(widgetType, html);
    const modified = stamped + '\n<!-- modified -->';
    
    expect(hasValidRenderOrigin(widgetType, modified)).toBe(false);
  });

  test('hasValidRenderOrigin fails if widget type mismatches', () => {
    const html = '<div class="test"></div>';
    const stamped = stampRenderOrigin('test-widget', html);
    
    expect(hasValidRenderOrigin('other-widget', stamped)).toBe(false);
  });

  test('hasValidRenderOrigin fails if marker is missing', () => {
    const html = '<div class="test"></div>';
    
    expect(hasValidRenderOrigin('test-widget', html)).toBe(false);
  });
});
