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

  test('contains TaQuestLog component definition', () => {
    expect(TA_COMPONENTS_CODE).toContain('class TaQuestLog extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain("customElements.define('ta-quest-log', TaQuestLog)");
  });

  test('contains quest toast and persisted quest-log selection support', () => {
    expect(TA_COMPONENTS_CODE).toContain('class TaQuestToast extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain("customElements.define('ta-quest-toast', TaQuestToast)");
    expect(TA_COMPONENTS_CODE).toContain('ta-quest-log:expanded');
    expect(TA_COMPONENTS_CODE).toContain('localStorage.setItem(this._storageKey');
  });

  test('contains TaIcon component definition', () => {
    expect(TA_COMPONENTS_CODE).toContain('class TaIcon extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain("customElements.define('ta-icon', TaIcon)");
    expect(TA_COMPONENTS_CODE).toContain('<svg viewBox="0 0 24 24" role="');
  });

  test('contains TaActionCard component definition', () => {
    expect(TA_COMPONENTS_CODE).toContain('class TaActionCard extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain("customElements.define('ta-action-card', TaActionCard)");
    expect(TA_COMPONENTS_CODE).toContain("'travel': 'travel'");
    expect(TA_COMPONENTS_CODE).toContain("'persuade': 'persuade'");
    expect(TA_COMPONENTS_CODE).toContain("'objective': 'objective'");
  });

  test('contains shared status icon helpers', () => {
    expect(TA_COMPONENTS_CODE).toContain('function conditionIcon(value)');
    expect(TA_COMPONENTS_CODE).toContain('function statusIcon(value)');
    expect(TA_COMPONENTS_CODE).toContain('function codexIcon(entry)');
  });

  test('contains rich SVG map rendering support', () => {
    expect(TA_COMPONENTS_CODE).toContain('class TaMap extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain('map-zone-group');
    expect(TA_COMPONENTS_CODE).toContain('viewBox="0 0 680 ');
    expect(TA_COMPONENTS_CODE).toContain('pattern id="map-forest"');
    expect(TA_COMPONENTS_CODE).toContain('map-inspector');
    expect(TA_COMPONENTS_CODE).toContain('function renderInspector(z)');
    expect(TA_COMPONENTS_CODE).toContain('map-route-active');
  });

  test('contains faction and relationship inspect prompt wiring', () => {
    expect(TA_COMPONENTS_CODE).toContain('fb-inspect');
    expect(TA_COMPONENTS_CODE).toContain('rw-node-wrap');
    expect(TA_COMPONENTS_CODE).toContain("window.tag.sendOrCopyPrompt(this, this.getAttribute('data-prompt'))");
  });

  test('contains worldgen web component definitions', () => {
    expect(TA_COMPONENTS_CODE).toContain('function parseJsonAttr(el, name, fallback)');
    expect(TA_COMPONENTS_CODE).toContain('class TaWorldPreview extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain("customElements.define('ta-world-preview', TaWorldPreview)");
    expect(TA_COMPONENTS_CODE).toContain('class TaRoutePlanner extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain("customElements.define('ta-route-planner', TaRoutePlanner)");
    expect(TA_COMPONENTS_CODE).toContain('class TaFactionBoard extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain("customElements.define('ta-faction-board', TaFactionBoard)");
    expect(TA_COMPONENTS_CODE).toContain('class TaRelationshipWeb extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain("customElements.define('ta-relationship-web', TaRelationshipWeb)");
    expect(TA_COMPONENTS_CODE).toContain('class TaWorldAtlas extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain("customElements.define('ta-world-atlas', TaWorldAtlas)");
    expect(TA_COMPONENTS_CODE).toContain('class TaClueBoard extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain("customElements.define('ta-clue-board', TaClueBoard)");
  });

  test('contains TaBadge component definition', () => {
    expect(TA_COMPONENTS_CODE).toContain('class TaBadge extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain("customElements.define('ta-badge', TaBadge)");
  });

  test('contains TaMeter component definition', () => {
    expect(TA_COMPONENTS_CODE).toContain('class TaMeter extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain("customElements.define('ta-meter', TaMeter)");
  });

  test('contains TaLocBar component definition', () => {
    expect(TA_COMPONENTS_CODE).toContain('class TaLocBar extends HTMLElement');
    expect(TA_COMPONENTS_CODE).toContain("customElements.define('ta-loc-bar', TaLocBar)");
  });

  test('ta-scene delegates light-DOM fallback hydration to initTagScene', () => {
    expect(TA_COMPONENTS_CODE).toContain("typeof window.initTagScene === 'function'");
    expect(TA_COMPONENTS_CODE).toContain('window.initTagScene(this.shadowRoot)');
    expect(TA_COMPONENTS_CODE).toContain('window.tag._pendingScenes.push(this)');
  });
});
