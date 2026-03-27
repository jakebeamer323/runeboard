/* ============================================================
   TAB: SPELLS — Cantrips and spell selection (stub)
   ============================================================ */

import { get, set } from '../state.js';

const SPELLCASTERS = ['bard', 'cleric', 'druid', 'sorcerer', 'warlock', 'wizard',
                      'paladin', 'ranger', 'artificer'];

export function init(container) {
  const cls    = get('class');
  const spells = get('spells');
  const isSpellcaster = cls.id && SPELLCASTERS.includes(cls.id);

  if (!isSpellcaster) {
    container.innerHTML = `
      <div class="creator-section-header">
        <div class="creator-section-header-text">
          <h2 class="creator-section-title">Spells</h2>
        </div>
      </div>
      <div class="creator-stub">
        <div class="creator-stub-icon">🚫</div>
        <h3 class="creator-stub-title">No Spells</h3>
        <p class="creator-stub-sub">
          ${cls.name ? `${cls.name}s don't cast spells (at least not at the start).` : 'Choose a spellcasting class to unlock this tab.'}
          You can skip this step.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="creator-section-header">
      <div class="creator-section-header-text">
        <h2 class="creator-section-title">Spells</h2>
        <p class="creator-section-sub">
          As a ${cls.name || 'spellcaster'}, you have access to a variety of magical spells.
          Full spell selection with filtering is coming in a future update.
        </p>
      </div>
    </div>

    <div class="creator-form">
      <div class="creator-field">
        <label class="form-label">Cantrips &amp; Known Spells</label>
        <textarea
          id="spells-notes"
          rows="6"
          placeholder="List your starting cantrips and spells here, e.g.&#10;Cantrips: Fire Bolt, Mage Hand, Prestidigitation&#10;Level 1: Magic Missile, Shield, Sleep"
          style="resize:vertical;"
        >${spells.notes || ''}</textarea>
        <p class="creator-hint">A full spell browser with source filtering is coming in a future update.</p>
      </div>
    </div>
  `;

  container.querySelector('#spells-notes').addEventListener('input', e => {
    set('spells.notes', e.target.value);
  });
}

export function validate() { return true; }
