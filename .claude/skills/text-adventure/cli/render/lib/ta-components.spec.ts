import { describe, test, expect } from 'bun:test';
import { TA_COMPONENTS_CODE } from './ta-components';

describe('TA_COMPONENTS_CODE', () => {
  test('is a non-empty string', () => {
    expect(typeof TA_COMPONENTS_CODE).toBe('string');
    expect(TA_COMPONENTS_CODE.length).toBeGreaterThan(100);
  });

  test('contains sendOrCopyPrompt definition', () => {
    expect(TA_COMPONENTS_CODE).toContain('function sendOrCopyPrompt(btn, prompt)');
    expect(TA_COMPONENTS_CODE).toContain('window.tag.sendOrCopyPrompt = sendOrCopyPrompt;');
  });

  test('contains TaTts component definition', () => {
    expect(TA_COMPONENTS_CODE).toContain('class TaTts extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain("customElements.define('ta-tts', TaTts)");
  });

  test('contains TaTicker component definition', () => {
    expect(TA_COMPONENTS_CODE).toContain('class TaTicker extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain("customElements.define('ta-ticker', TaTicker)");
  });

  test('contains TaFooter component definition', () => {
    expect(TA_COMPONENTS_CODE).toContain('class TaFooter extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain("customElements.define('ta-footer', TaFooter)");
  });

  test('contains TaLevelup component definition', () => {
    expect(TA_COMPONENTS_CODE).toContain('class TaLevelup extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain("customElements.define('ta-levelup', TaLevelup)");
  });

  test('contains TaDialogue component definition', () => {
    expect(TA_COMPONENTS_CODE).toContain('class TaDialogue extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain("customElements.define('ta-dialogue', TaDialogue)");
  });
});
