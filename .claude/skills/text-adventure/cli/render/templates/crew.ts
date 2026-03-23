// Crew manifest — table of crew members with morale bars, stress indicators,
// status badges, and role assignments.

import type { GmState } from '../../types';

export function renderCrew(state: GmState | null, css: string, _options?: Record<string, unknown>): string {
  const crew = state?.crewMutations;

  if (!crew || crew.length === 0) {
    return `
<style>${css}</style>
<div class="widget-crew">
  <p class="empty-state">No crew manifest available.</p>
</div>`;
  }

  const rows = crew.map(member => {
    const moralePct = Math.max(0, Math.min(100, member.morale));
    const stressPct = Math.max(0, Math.min(100, member.stress));
    const statusClass = member.status === 'active' ? 'badge-ok'
      : member.status === 'injured' ? 'badge-warn'
      : 'badge-danger';

    return `
      <tr class="crew-row">
        <td class="crew-name">${esc(member.name)}</td>
        <td class="crew-role">${esc(member.role)}</td>
        <td class="crew-task">${member.task ? esc(member.task) : '<span class="idle">Idle</span>'}</td>
        <td>
          <div class="mini-bar"><div class="mini-fill morale-fill" style="width:${moralePct}%"></div></div>
          <span class="mini-label">${moralePct}%</span>
        </td>
        <td>
          <div class="mini-bar"><div class="mini-fill stress-fill" style="width:${stressPct}%"></div></div>
          <span class="mini-label">${stressPct}%</span>
        </td>
        <td><span class="crew-badge ${statusClass}">${esc(member.status)}</span></td>
      </tr>`;
  }).join('\n');

  return `
<style>${css}
.widget-crew { font-family: var(--ta-font-body); padding: 16px; }
.crew-title { font-family: var(--ta-font-heading); font-size: 18px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 12px; }
.crew-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.crew-table th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-tertiary); padding: 4px 8px; border-bottom: 0.5px solid var(--color-border-tertiary); }
.crew-row td { padding: 8px; border-bottom: 0.5px solid var(--color-border-tertiary); vertical-align: middle; }
.crew-name { font-weight: 600; color: var(--color-text-primary); }
.crew-role { color: var(--color-text-secondary); text-transform: capitalize; }
.crew-task { color: var(--color-text-secondary); }
.idle { color: var(--color-text-tertiary); font-style: italic; }
.mini-bar { width: 60px; height: 5px; background: var(--color-border-tertiary); border-radius: 3px; overflow: hidden; display: inline-block; vertical-align: middle; }
.mini-fill { height: 100%; border-radius: 3px; }
.morale-fill { background: var(--ta-color-success); }
.stress-fill { background: var(--ta-color-danger); }
.mini-label { font-size: 10px; color: var(--color-text-tertiary); margin-left: 4px; }
.crew-badge { display: inline-block; padding: 2px 8px; font-size: 10px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
.badge-ok { background: var(--ta-badge-success-bg); color: var(--ta-badge-success-text); }
.badge-warn { background: var(--ta-badge-partial-bg); color: var(--ta-badge-partial-text); }
.badge-danger { background: var(--ta-badge-failure-bg); color: var(--ta-badge-failure-text); }
</style>
<div class="widget-crew">
  <div class="crew-title">Crew Manifest</div>
  <table class="crew-table">
    <thead>
      <tr><th>Name</th><th>Role</th><th>Task</th><th>Morale</th><th>Stress</th><th>Status</th></tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</div>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
