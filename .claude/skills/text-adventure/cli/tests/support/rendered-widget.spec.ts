import { describe, test, expect } from 'bun:test';
import { 
  decodeHtmlEntities, 
  extractTagMatch, 
  extractTagAttr, 
  extractJsonTagAttr, 
  extractScriptSrcs 
} from './rendered-widget';

describe('rendered-widget test helpers', () => {
  test('decodeHtmlEntities decodes common entities', () => {
    const input = '&quot;Hello&quot; &amp; &lt;World&gt; &#39;!&#39;';
    expect(decodeHtmlEntities(input)).toBe('"Hello" & <World> \'!\'');
  });

  test('extractTagMatch extracts attributes and inner HTML', () => {
    const html = '<ta-test id="1" class="foo">Content</ta-test>';
    const result = extractTagMatch(html, 'ta-test');
    expect(result.attrs).toBe(' id="1" class="foo"');
    expect(result.innerHtml).toBe('Content');
  });

  test('extractTagMatch throws on missing tag', () => {
    expect(() => extractTagMatch('<div></div>', 'ta-test')).toThrow('Expected <ta-test> in rendered HTML.');
  });

  test('extractTagAttr extracts a specific attribute value', () => {
    const html = '<ta-test data-val="123">Content</ta-test>';
    expect(extractTagAttr(html, 'ta-test', 'data-val')).toBe('123');
  });

  test('extractTagAttr returns null for missing attribute', () => {
    const html = '<ta-test>Content</ta-test>';
    expect(extractTagAttr(html, 'ta-test', 'data-val')).toBeNull();
  });

  test('extractJsonTagAttr parses JSON from an attribute', () => {
    const data = { foo: 'bar', num: 42 };
    const html = `<ta-test data-config='${JSON.stringify(data)}'>Content</ta-test>`;
    expect(extractJsonTagAttr<typeof data>(html, 'ta-test', 'data-config')).toEqual(data);
  });

  test('extractJsonTagAttr throws for missing attribute', () => {
    const html = '<ta-test>Content</ta-test>';
    expect(() => extractJsonTagAttr(html, 'ta-test', 'data-config')).toThrow('Expected attribute data-config on <ta-test>.');
  });

  test('extractScriptSrcs extracts all script src attributes', () => {
    const html = `
      <ta-test></ta-test>
      <script src="one.js"></script>
      <script src="two.js?v=123"></script>
    `;
    const srcs = extractScriptSrcs(html);
    expect(srcs).toContain('one.js');
    expect(srcs).toContain('two.js?v=123');
  });
});
