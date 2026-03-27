/* ============================================================
   TAB: ABILITY SCORES — Standard array, point buy, or manual
   ============================================================ */

import { get, set } from '../state.js';

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_NAMES = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

// Point buy costs: score → cost
const POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const POINT_BUY_TOTAL = 27;

export function init(container) {
  const scores = get('abilityScores');
  const method  = scores.method || 'standard-array';

  container.innerHTML = `
    <div class="creator-section-header">
      <div class="creator-section-header-text">
        <h2 class="creator-section-title">Ability Scores</h2>
        <p class="creator-section-sub">Set your six core ability scores. These affect almost everything your character can do.</p>
      </div>
    </div>

    <div class="ability-method-bar">
      <button class="ability-method-btn ${method === 'standard-array' ? 'active' : ''}" data-method="standard-array">Standard Array</button>
      <button class="ability-method-btn ${method === 'point-buy'      ? 'active' : ''}" data-method="point-buy">Point Buy</button>
      <button class="ability-method-btn ${method === 'manual'         ? 'active' : ''}" data-method="manual">Manual / Roll</button>
    </div>

    <div id="ability-method-content"></div>
  `;

  _renderMethod(container, method);

  container.querySelector('.ability-method-bar').addEventListener('click', e => {
    const btn = e.target.closest('.ability-method-btn');
    if (!btn) return;
    const m = btn.dataset.method;
    // Reset scores when switching method
    ABILITIES.forEach(a => set(`abilityScores.${a}`, null));
    set('abilityScores.method', m);
    container.querySelectorAll('.ability-method-btn').forEach(b => b.classList.toggle('active', b.dataset.method === m));
    _renderMethod(container, m);
  });
}

function _renderMethod(container, method) {
  const wrap = container.querySelector('#ability-method-content');
  if (method === 'standard-array') _renderStandardArray(wrap);
  else if (method === 'point-buy')  _renderPointBuy(wrap);
  else                              _renderManual(wrap);
}

// ---- Standard Array ---------------------------------------

function _renderStandardArray(wrap) {
  const scores = get('abilityScores');

  // Track which array values are already assigned
  const usedValues = new Map(); // ability → value
  ABILITIES.forEach(a => { if (scores[a]) usedValues.set(a, scores[a]); });

  wrap.innerHTML = `
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:var(--space-4);">
      Click an array value then click an ability box to assign it. Each value can be used once.
    </p>
    <div class="standard-array-pool" id="array-pool">
      ${STANDARD_ARRAY.map(v => {
        const isUsed = [...usedValues.values()].includes(v)
          && ![...usedValues.values()].filter(x => x === v).length < STANDARD_ARRAY.filter(x => x === v).length;
        return `<div class="array-value ${isUsed ? 'used' : ''}" data-value="${v}">${v}</div>`;
      }).join('')}
    </div>
    <div class="ability-grid" id="ability-grid-sa">
      ${ABILITIES.map(a => {
        const val = scores[a];
        const mod = val ? _mod(val) : null;
        return `
          <div class="ability-box" data-ability="${a}">
            <div class="ability-box-name">${ABILITY_NAMES[a]}</div>
            <div class="ability-box-score" style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--text);width:52px;text-align:center;background:var(--surface-raised);border:1px solid var(--border);border-radius:var(--radius-sm);padding:var(--space-2) 0;min-height:44px;display:flex;align-items:center;justify-content:center;">
              ${val || '—'}
            </div>
            <div class="ability-box-mod">${mod !== null ? _modStr(mod) : ''}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  let selectedValue = null;

  wrap.querySelector('#array-pool').addEventListener('click', e => {
    const el = e.target.closest('.array-value:not(.used)');
    if (!el) return;
    wrap.querySelectorAll('.array-value').forEach(v => v.style.outline = '');
    if (selectedValue === parseInt(el.dataset.value)) {
      selectedValue = null;
    } else {
      selectedValue = parseInt(el.dataset.value);
      el.style.outline = '2px solid var(--accent)';
      el.style.outlineOffset = '2px';
    }
  });

  wrap.querySelector('#ability-grid-sa').addEventListener('click', e => {
    const box = e.target.closest('.ability-box');
    if (!box || selectedValue === null) return;
    const ability = box.dataset.ability;
    // Unassign any previous ability that had this value
    ABILITIES.forEach(a => {
      if (get(`abilityScores.${a}`) === selectedValue) set(`abilityScores.${a}`, null);
    });
    set(`abilityScores.${ability}`, selectedValue);
    selectedValue = null;
    _renderStandardArray(wrap);
  });
}

// ---- Point Buy --------------------------------------------

function _renderPointBuy(wrap) {
  const scores = get('abilityScores');

  function pointsSpent() {
    return ABILITIES.reduce((sum, a) => {
      const v = scores[a] || 8;
      return sum + (POINT_BUY_COST[v] || 0);
    }, 0);
  }

  const remaining = POINT_BUY_TOTAL - pointsSpent();

  wrap.innerHTML = `
    <div class="ability-pool-display">
      Points Remaining: <strong id="pb-pool">${remaining}</strong> / ${POINT_BUY_TOTAL}
    </div>
    <div class="ability-grid">
      ${ABILITIES.map(a => {
        const val = scores[a] || 8;
        const mod = _mod(val);
        return `
          <div class="ability-box">
            <div class="ability-box-name">${ABILITY_NAMES[a]}</div>
            <div style="display:flex;align-items:center;gap:4px;">
              <button class="btn btn-ghost btn-icon pb-dec" data-ability="${a}" style="padding:2px 6px;">−</button>
              <span style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--text);min-width:28px;text-align:center;">${val}</span>
              <button class="btn btn-ghost btn-icon pb-inc" data-ability="${a}" style="padding:2px 6px;">+</button>
            </div>
            <div class="ability-box-mod">${_modStr(mod)}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  wrap.querySelectorAll('.pb-inc, .pb-dec').forEach(btn => {
    btn.addEventListener('click', () => {
      const ability = btn.dataset.ability;
      const current = get(`abilityScores.${ability}`) || 8;
      const isInc = btn.classList.contains('pb-inc');
      const next = isInc ? current + 1 : current - 1;

      if (next < 8 || next > 15) return;
      const newCost = POINT_BUY_COST[next];
      const oldCost = POINT_BUY_COST[current];
      const spent = ABILITIES.reduce((s, a) => s + (POINT_BUY_COST[get(`abilityScores.${a}`) || 8] || 0), 0);
      const newSpent = spent - oldCost + newCost;
      if (newSpent > POINT_BUY_TOTAL) return;

      set(`abilityScores.${ability}`, next);
      _renderPointBuy(wrap);
    });
  });
}

// ---- Manual Entry -----------------------------------------

function _renderManual(wrap) {
  const scores = get('abilityScores');

  wrap.innerHTML = `
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:var(--space-5);">
      Enter your scores directly. Typical range is 3–18 (or up to 20 with racial bonuses).
    </p>
    <div class="ability-grid">
      ${ABILITIES.map(a => {
        const val = scores[a] || '';
        return `
          <div class="ability-box">
            <div class="ability-box-name">${ABILITY_NAMES[a]}</div>
            <input
              type="number"
              min="1" max="30"
              value="${val}"
              data-ability="${a}"
              class="ability-score-input"
            />
            <div class="ability-box-mod" id="mod-${a}">${val ? _modStr(_mod(val)) : ''}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  wrap.querySelectorAll('.ability-score-input').forEach(input => {
    input.addEventListener('change', () => {
      const ability = input.dataset.ability;
      const val = parseInt(input.value, 10);
      if (isNaN(val) || val < 1) { set(`abilityScores.${ability}`, null); return; }
      set(`abilityScores.${ability}`, val);
      const mod = _mod(val);
      const modEl = document.getElementById(`mod-${ability}`);
      if (modEl) modEl.textContent = _modStr(mod);
    });
  });
}

// ---- Helpers ----------------------------------------------

function _mod(score) {
  return Math.floor((score - 10) / 2);
}

function _modStr(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function validate() {
  const scores = get('abilityScores');
  return ABILITIES.every(a => scores[a] !== null && scores[a] !== undefined);
}
