/* ============================================================
   TAB: CLASS — Class selection and level
   ============================================================ */

import { get, set } from '../state.js';

// PHB base classes — always available as a reliable baseline
const PHB_CLASSES = [
  { id: 'barbarian',  name: 'Barbarian',  hitDie: 'd12', desc: 'A fierce warrior of primitive background who can enter a battle rage.' },
  { id: 'bard',       name: 'Bard',       hitDie: 'd8',  desc: 'An inspiring magician whose power echoes the music of creation.' },
  { id: 'cleric',     name: 'Cleric',     hitDie: 'd8',  desc: 'A priestly champion who wields divine magic in service of a higher power.' },
  { id: 'druid',      name: 'Druid',      hitDie: 'd8',  desc: 'A priest of the Old Faith, wielding the powers of nature and adopting animal forms.' },
  { id: 'fighter',    name: 'Fighter',    hitDie: 'd10', desc: 'A master of martial combat, skilled with a variety of weapons and armor.' },
  { id: 'monk',       name: 'Monk',       hitDie: 'd8',  desc: 'A master of martial arts, harnessing the power of the body in pursuit of physical and spiritual perfection.' },
  { id: 'paladin',    name: 'Paladin',    hitDie: 'd10', desc: 'A holy warrior bound to a sacred oath.' },
  { id: 'ranger',     name: 'Ranger',     hitDie: 'd10', desc: 'A warrior who uses martial prowess and nature magic to combat threats on the edges of civilization.' },
  { id: 'rogue',      name: 'Rogue',      hitDie: 'd8',  desc: 'A scoundrel who uses stealth and trickery to overcome obstacles and enemies.' },
  { id: 'sorcerer',   name: 'Sorcerer',   hitDie: 'd6',  desc: 'A spellcaster who draws on inherent magic from a gift or bloodline.' },
  { id: 'warlock',    name: 'Warlock',    hitDie: 'd8',  desc: 'A wielder of magic that is derived from a bargain with an extraplanar entity.' },
  { id: 'wizard',     name: 'Wizard',     hitDie: 'd6',  desc: 'A supreme magic-user, drawing on subtly redefined magic to cast spells of explosive power.' },
  { id: 'artificer',  name: 'Artificer',  hitDie: 'd8',  desc: 'A master of unlocking magic in everyday objects, combining invention and magic.' },
];

export function init(container) {
  const cls   = get('class');
  const level = get('level') || 1;

  container.innerHTML = `
    <div class="creator-section-header">
      <div class="creator-section-header-text">
        <h2 class="creator-section-title">Class</h2>
        <p class="creator-section-sub">Your class defines your role in the party and the abilities you'll master. Choose wisely — it shapes your entire adventure.</p>
      </div>
    </div>

    <div class="creator-grid class-list" id="class-grid">
      ${PHB_CLASSES.map(c => `
        <button class="creator-option-card ${cls.id === c.id ? 'selected' : ''}" data-class-id="${c.id}">
          <div class="creator-option-card-check">✓</div>
          <div class="creator-option-card-name">${c.name}</div>
          <div class="creator-option-card-source">Hit Die: ${c.hitDie}</div>
          <div class="creator-option-card-desc">${c.desc}</div>
        </button>
      `).join('')}
    </div>

    <div class="level-selector" id="level-row" style="${cls.id ? '' : 'display:none;'}">
      <label>Starting Level</label>
      <select id="char-level">
        ${Array.from({ length: 20 }, (_, i) => i + 1).map(l => `
          <option value="${l}" ${level === l ? 'selected' : ''}>Level ${l}</option>
        `).join('')}
      </select>
    </div>
  `;

  container.querySelector('#class-grid').addEventListener('click', e => {
    const card = e.target.closest('.creator-option-card');
    if (!card) return;
    const classId = card.dataset.classId;
    const classData = PHB_CLASSES.find(c => c.id === classId);
    if (!classData) return;

    set('class', { id: classData.id, name: classData.name, source: 'PHB', hitDie: classData.hitDie, savingThrows: [] });

    container.querySelectorAll('.creator-option-card').forEach(c =>
      c.classList.toggle('selected', c.dataset.classId === classId)
    );

    container.querySelector('#level-row').style.display = '';
  });

  container.querySelector('#char-level')?.addEventListener('change', e => {
    set('level', parseInt(e.target.value, 10));
  });
}

export function validate() {
  return !!get('class.id');
}
