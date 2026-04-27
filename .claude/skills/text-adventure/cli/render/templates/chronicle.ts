import type { GmState } from '../../types';
import { emitStandaloneCustomElement } from '../lib/shadow-wrapper';

/**
 * Renders the narrative history timeline widget.
 */
export function renderChronicle(state: GmState | null, styleName: string, options?: Record<string, unknown>): string {
  if (!state) return '<div>No state available for Chronicle.</div>';

  const history = state._stateHistory || [];
  const travelLog = state.mapState?.travelLog || [];
  
  type SceneEntry = { scene: number; events: { type: string; desc: string }[]; travel: unknown[] };
  const scenes: Record<number, SceneEntry> = {};
  
  // Extract key events from history
  history.forEach(entry => {
    if (!entry) return;
    const cmd = entry.command ?? '';
    const sceneMatch = cmd.match(/scene (\d+)/i);
    const sceneNum = (sceneMatch && sceneMatch[1]) ? parseInt(sceneMatch[1], 10) : (state.scene || 0);
    if (!scenes[sceneNum]) scenes[sceneNum] = { scene: sceneNum, events: [], travel: [] };
    
    if (cmd.startsWith('map enter')) {
      // Travel handled separately by travelLog
    } else if (cmd.startsWith('quest')) {
      scenes[sceneNum].events.push({ type: 'quest', desc: cmd });
    } else if (cmd.startsWith('compute')) {
      scenes[sceneNum].events.push({ type: 'roll', desc: cmd });
    }
  });

  // Add travel to scenes
  (travelLog as { scene?: number }[]).forEach(t => {
    const sceneNum = t.scene || 0;
    if (!scenes[sceneNum]) scenes[sceneNum] = { scene: sceneNum, events: [], travel: [] };
    scenes[sceneNum].travel.push(t);
  });

  const sortedScenes = Object.values(scenes).sort((a, b) => b.scene - a.scene);

  const config = {
    scenes: sortedScenes,
    currentChar: state.character?.name || 'Unknown',
    currentLocation: state.currentRoom || 'Unknown',
  };

  return emitStandaloneCustomElement({
    tag: 'ta-chronicle',
    styleName,
    attrs: { 'data-config': JSON.stringify(config) },
  });
}
