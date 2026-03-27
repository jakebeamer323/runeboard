/* ============================================================
   TAB: BASICS — Name, alignment, backstory
   ============================================================ */

import { get, set } from '../state.js';

const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

export function init(container) {
  const b = get('basics');

  container.innerHTML = `
    <div class="creator-section-header">
      <div class="creator-section-header-text">
        <h2 class="creator-section-title">The Basics</h2>
        <p class="creator-section-sub">Give your character a name and a bit of personality before we dive into the details.</p>
      </div>
    </div>

    <div class="creator-form">
      <div class="creator-field">
        <label class="form-label" for="char-name">Character Name *</label>
        <input
          type="text"
          id="char-name"
          placeholder="e.g. Lyra Stormweave"
          maxlength="60"
          value="${escapeAttr(b.name)}"
          autocomplete="off"
        />
        <p class="creator-hint">Your character's full name. You can always change this later.</p>
      </div>

      <div class="creator-field-row">
        <div class="creator-field">
          <label class="form-label" for="char-alignment">Alignment</label>
          <select id="char-alignment">
            <option value="">— Select alignment —</option>
            ${ALIGNMENTS.map(a => `
              <option value="${a}" ${b.alignment === a ? 'selected' : ''}>${a}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="creator-field">
        <label class="form-label" for="char-backstory">Backstory &amp; Notes</label>
        <textarea
          id="char-backstory"
          placeholder="A few words about your character's history, motivations, or personality…"
          rows="6"
          style="resize:vertical;"
        >${escapeAttr(b.backstory)}</textarea>
      </div>
    </div>
  `;

  // Bind live updates to state
  container.querySelector('#char-name').addEventListener('input', e => {
    set('basics.name', e.target.value);
  });
  container.querySelector('#char-alignment').addEventListener('change', e => {
    set('basics.alignment', e.target.value);
  });
  container.querySelector('#char-backstory').addEventListener('input', e => {
    set('basics.backstory', e.target.value);
  });

  // Auto-focus name if empty
  if (!b.name) {
    container.querySelector('#char-name').focus();
  }
}

export function validate() {
  return !!get('basics.name')?.trim();
}

function escapeAttr(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
