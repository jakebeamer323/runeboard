/* ============================================================
   TAB: EQUIPMENT — Starting equipment and currency
   ============================================================ */

import { get, set } from '../state.js';

export function init(container) {
  const eq = get('equipment');

  container.innerHTML = `
    <div class="creator-section-header">
      <div class="creator-section-header-text">
        <h2 class="creator-section-title">Equipment</h2>
        <p class="creator-section-sub">Your starting gear and currency. Your class and background typically provide starting equipment or gold to purchase it.</p>
      </div>
    </div>

    <div class="creator-form">
      <div class="creator-field-row">
        <div class="creator-field">
          <label class="form-label">Gold Pieces (gp)</label>
          <input type="number" id="eq-gp" min="0" value="${eq.gp || 0}" />
        </div>
        <div class="creator-field">
          <label class="form-label">Silver Pieces (sp)</label>
          <input type="number" id="eq-sp" min="0" value="${eq.sp || 0}" />
        </div>
        <div class="creator-field">
          <label class="form-label">Copper Pieces (cp)</label>
          <input type="number" id="eq-cp" min="0" value="${eq.cp || 0}" />
        </div>
      </div>

      <div class="creator-field">
        <label class="form-label">Starting Equipment</label>
        <textarea
          id="eq-notes"
          rows="6"
          placeholder="List your starting weapons, armor, tools, and other gear…"
          style="resize:vertical;"
        >${eq.notes || ''}</textarea>
        <p class="creator-hint">A full equipment selection interface is coming in a future update.</p>
      </div>
    </div>
  `;

  container.querySelector('#eq-gp').addEventListener('change', e => set('equipment.gp', parseInt(e.target.value) || 0));
  container.querySelector('#eq-sp').addEventListener('change', e => set('equipment.sp', parseInt(e.target.value) || 0));
  container.querySelector('#eq-cp').addEventListener('change', e => set('equipment.cp', parseInt(e.target.value) || 0));
  container.querySelector('#eq-notes').addEventListener('input', e => set('equipment.notes', e.target.value));
}

export function validate() { return true; }
