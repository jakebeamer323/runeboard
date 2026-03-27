/* ============================================================
   TAB: REVIEW — Summary of all choices before saving
   ============================================================ */

import { getAll } from '../state.js';

const ABILITY_NAMES = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };

export function init(container) {
  _render(container);
}

function _render(container) {
  const s = getAll();

  const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const hasName   = !!s.basics.name?.trim();
  const hasClass  = !!s.class.id;
  const hasSpecies = !!s.species.id;

  container.innerHTML = `
    <div class="creator-section-header">
      <div class="creator-section-header-text">
        <h2 class="creator-section-title">Review &amp; Save</h2>
        <p class="creator-section-sub">Look over your choices before saving. You can go back to any tab to make changes.</p>
      </div>
    </div>

    ${!hasName ? `
      <div style="padding:var(--space-4);background:var(--danger-dim);border:1px solid var(--danger);border-radius:var(--radius);margin-bottom:var(--space-5);font-size:13px;color:var(--danger);">
        ⚠ Your character needs a name before you can save. Go back to the <strong>Basics</strong> tab.
      </div>
    ` : ''}

    <div class="review-grid">

      <div class="review-block">
        <div class="review-block-title">Identity</div>
        <div class="review-block-content">${s.basics.name || '<em style="color:var(--danger)">No name</em>'}</div>
        ${s.basics.alignment ? `<div class="review-block-sub">${s.basics.alignment}</div>` : ''}
      </div>

      <div class="review-block">
        <div class="review-block-title">Species</div>
        <div class="review-block-content">${s.species.name || '<span class="review-block-empty">Not chosen</span>'}</div>
        ${s.species.source ? `<div class="review-block-sub">${s.species.source} · ${s.species.size ? s.species.size + ' size' : ''}</div>` : ''}
      </div>

      <div class="review-block">
        <div class="review-block-title">Class &amp; Level</div>
        <div class="review-block-content">${s.class.name || '<span class="review-block-empty">Not chosen</span>'}</div>
        ${s.class.id ? `<div class="review-block-sub">Level ${s.level} · Hit Die ${s.class.hitDie}</div>` : ''}
      </div>

      <div class="review-block">
        <div class="review-block-title">Background</div>
        <div class="review-block-content">${s.background.name || '<span class="review-block-empty">Not chosen</span>'}</div>
        ${s.background.skillProfs?.length ? `<div class="review-block-sub">Skills: ${s.background.skillProfs.join(', ')}</div>` : ''}
      </div>

      <div class="review-block" style="grid-column: 1 / -1;">
        <div class="review-block-title">Ability Scores (${s.abilityScores.method?.replace('-', ' ') || 'manual'})</div>
        ${abilities.map(a => {
          const val = s.abilityScores[a];
          const mod = val ? Math.floor((val - 10) / 2) : null;
          return `
            <div class="review-ability-row">
              <span>${ABILITY_NAMES[a]}</span>
              <div>
                <strong>${val ?? '—'}</strong>
                ${mod !== null ? `<span style="font-size:11px;color:var(--text-muted);margin-left:6px;">(${mod >= 0 ? '+' : ''}${mod})</span>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      ${s.proficiencies.languages?.length || s.proficiencies.notes ? `
        <div class="review-block">
          <div class="review-block-title">Proficiencies</div>
          ${s.proficiencies.languages?.length ? `<div class="review-block-content">Languages: ${s.proficiencies.languages.join(', ')}</div>` : ''}
          ${s.proficiencies.notes ? `<div class="review-block-sub" style="white-space:pre-line;">${s.proficiencies.notes.substring(0, 200)}</div>` : ''}
        </div>
      ` : ''}

      ${s.equipment.notes || s.equipment.gp ? `
        <div class="review-block">
          <div class="review-block-title">Equipment</div>
          ${s.equipment.gp || s.equipment.sp ? `<div class="review-block-content">${s.equipment.gp}gp ${s.equipment.sp}sp ${s.equipment.cp}cp</div>` : ''}
          ${s.equipment.notes ? `<div class="review-block-sub" style="white-space:pre-line;">${s.equipment.notes.substring(0, 200)}</div>` : ''}
        </div>
      ` : ''}

      ${s.spells.notes ? `
        <div class="review-block">
          <div class="review-block-title">Spells</div>
          <div class="review-block-sub" style="white-space:pre-line;">${s.spells.notes.substring(0, 300)}</div>
        </div>
      ` : ''}

    </div>

    ${s.basics.backstory ? `
      <div style="margin-top:var(--space-5);">
        <div class="form-label">Backstory</div>
        <div style="font-size:13px;color:var(--text-muted);line-height:1.7;white-space:pre-line;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--space-4) var(--space-5);">${s.basics.backstory.substring(0, 1000)}${s.basics.backstory.length > 1000 ? '…' : ''}</div>
      </div>
    ` : ''}

    <div class="review-save-row">
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:var(--space-4);">
        ${hasName ? 'Ready to save? Use the <strong style="color:var(--text)">Save Character</strong> button below.' : 'Add a name in the Basics tab to save your character.'}
      </p>
    </div>
  `;
}

export function validate() {
  return !!getAll().basics.name?.trim();
}
