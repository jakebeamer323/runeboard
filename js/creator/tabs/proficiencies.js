/* ============================================================
   TAB: PROFICIENCIES — Skills, tools, languages
   ============================================================ */

import { get, set } from '../state.js';

export function init(container) {
  const cls = get('class');
  const bg  = get('background');
  const prof = get('proficiencies');

  // Proficiencies that come from background
  const bgSkills = bg.skillProfs || [];

  container.innerHTML = `
    <div class="creator-section-header">
      <div class="creator-section-header-text">
        <h2 class="creator-section-title">Proficiencies</h2>
        <p class="creator-section-sub">Skills, tools, and languages your character is proficient with. Your class and background grant automatic proficiencies.</p>
      </div>
    </div>

    ${bgSkills.length ? `
      <div style="margin-bottom:var(--space-5);">
        <div class="form-label">From Background (${bg.name || '—'})</div>
        <div class="prof-tags">
          ${bgSkills.map(s => `<span class="prof-tag prof-tag-accent">${s}</span>`).join('')}
        </div>
      </div>
    ` : ''}

    <div class="creator-field" style="margin-bottom:var(--space-5);">
      <label class="form-label">Additional Skills &amp; Proficiencies</label>
      <textarea
        id="prof-notes"
        rows="4"
        placeholder="List any additional skill proficiencies, tool proficiencies, or languages here…"
        style="resize:vertical;"
      >${prof.notes || ''}</textarea>
      <p class="creator-hint">Full proficiency selection by class will be available in a future update. For now, add any extra proficiencies as notes.</p>
    </div>

    <div class="creator-field">
      <label class="form-label">Languages</label>
      <input
        type="text"
        id="prof-languages"
        placeholder="e.g. Common, Elvish, Dwarvish…"
        value="${(prof.languages || []).join(', ')}"
      />
    </div>
  `;

  container.querySelector('#prof-notes').addEventListener('input', e => {
    set('proficiencies.notes', e.target.value);
  });

  container.querySelector('#prof-languages').addEventListener('change', e => {
    const langs = e.target.value.split(',').map(l => l.trim()).filter(Boolean);
    set('proficiencies.languages', langs);
  });
}

export function validate() { return true; }
