/* ============================================================
   CHARACTER CREATOR WIZARD — Tab orchestrator
   ============================================================ */

import { initTheme, initSettings, initAuthStateUI } from '../ui/shared-ui.js';
import { initSourceFilter } from './source-filter.js';
import { reset, getAll, saveDraft } from './state.js';
import { createCharacter } from '../modules/characters.js';
import { showToast } from '../ui/notifications.js';

import * as basicsTab      from './tabs/basics.js';
import * as speciesTab     from './tabs/species.js';
import * as classTab       from './tabs/class.js';
import * as backgroundTab  from './tabs/background.js';
import * as abilityTab     from './tabs/ability-scores.js';
import * as profsTab       from './tabs/proficiencies.js';
import * as equipTab       from './tabs/equipment.js';
import * as spellsTab      from './tabs/spells.js';
import * as reviewTab      from './tabs/review.js';

const TABS = [
  { id: 'basics',         label: 'Basics',         module: basicsTab },
  { id: 'species',        label: 'Species',         module: speciesTab },
  { id: 'class',          label: 'Class',           module: classTab },
  { id: 'background',     label: 'Background',      module: backgroundTab },
  { id: 'ability-scores', label: 'Ability Scores',  module: abilityTab },
  { id: 'proficiencies',  label: 'Proficiencies',   module: profsTab },
  { id: 'equipment',      label: 'Equipment',       module: equipTab },
  { id: 'spells',         label: 'Spells',          module: spellsTab },
  { id: 'review',         label: 'Review & Save',   module: reviewTab },
];

let _currentTab = 0;

export function initWizard() {
  initTheme();
  initSettings();
  initAuthStateUI();
  initSourceFilter();

  // Always start fresh for new character
  reset();

  _buildTabBar();
  _goToTab(0);

  document.getElementById('prev-btn')?.addEventListener('click', _prevTab);
  document.getElementById('next-btn')?.addEventListener('click', _nextTab);
  document.getElementById('finish-btn')?.addEventListener('click', _saveCharacter);
  document.getElementById('save-draft-btn')?.addEventListener('click', () => {
    saveDraft();
    showToast('Draft saved.');
  });
}

// ---- Tab bar ----------------------------------------------

function _buildTabBar() {
  const bar = document.getElementById('creator-tab-bar');
  if (!bar) return;
  bar.innerHTML = '';
  TABS.forEach((tab, i) => {
    const btn = document.createElement('button');
    btn.className = 'creator-tab';
    btn.dataset.tabIndex = i;
    btn.innerHTML = `<span class="creator-tab-num">${i + 1}</span>${tab.label}`;
    btn.addEventListener('click', () => _goToTab(i));
    bar.appendChild(btn);
  });
}

// ---- Navigation -------------------------------------------

function _goToTab(idx) {
  // Call onLeave on the current tab if it has it
  TABS[_currentTab]?.module?.onLeave?.();

  _currentTab = idx;

  // Update tab bar highlight
  document.querySelectorAll('.creator-tab').forEach((btn, i) => {
    btn.classList.toggle('active', i === idx);
  });

  // Render tab content
  const contentEl = document.getElementById('creator-content');
  if (contentEl) {
    contentEl.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'creator-panel';
    contentEl.appendChild(panel);
    TABS[idx].module.init(panel);
    TABS[idx].module?.onEnter?.();
    contentEl.scrollTop = 0;
  }

  // Update footer
  const stepLabel = document.getElementById('creator-step-label');
  if (stepLabel) stepLabel.textContent = `Step ${idx + 1} of ${TABS.length}`;

  const prevBtn   = document.getElementById('prev-btn');
  const nextBtn   = document.getElementById('next-btn');
  const finishBtn = document.getElementById('finish-btn');
  const isLast    = idx === TABS.length - 1;

  if (prevBtn)   prevBtn.style.visibility = idx === 0 ? 'hidden' : 'visible';
  if (nextBtn)   nextBtn.style.display    = isLast ? 'none' : '';
  if (finishBtn) finishBtn.style.display  = isLast ? ''     : 'none';

  // Scroll active tab into view
  document.querySelectorAll('.creator-tab')[idx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
}

function _prevTab() {
  if (_currentTab > 0) _goToTab(_currentTab - 1);
}

function _nextTab() {
  if (_currentTab < TABS.length - 1) _goToTab(_currentTab + 1);
}

// ---- Save -------------------------------------------------

async function _saveCharacter() {
  const state = getAll();
  const name  = state.basics.name?.trim();

  if (!name) {
    showToast('Please give your character a name before saving.');
    _goToTab(0);
    return;
  }

  const finishBtn = document.getElementById('finish-btn');
  if (finishBtn) { finishBtn.disabled = true; finishBtn.textContent = 'Saving…'; }

  try {
    const charData = _buildCharacterData(state);
    await createCharacter(charData);
    showToast(`"${name}" saved!`);
    setTimeout(() => { window.location.href = 'player-tools.html'; }, 800);
  } catch (err) {
    showToast(err.message);
    if (finishBtn) { finishBtn.disabled = false; finishBtn.textContent = 'Save Character'; }
  }
}

function _buildCharacterData(state) {
  return {
    name:         state.basics.name.trim(),
    alignment:    state.basics.alignment || '',
    backstory:    state.basics.backstory || '',

    species:      state.species.name || '',
    speciesId:    state.species.id || null,
    speciesSource:state.species.source || null,
    speciesTraits:state.species.traits || [],
    speciesSpeed: state.species.speed || null,
    speciesSize:  state.species.size || '',

    class:        state.class.name || '',
    classId:      state.class.id || null,
    hitDie:       state.class.hitDie || '',
    level:        state.level || 1,

    background:       state.background.name || '',
    backgroundId:     state.background.id || null,
    backgroundSkills: state.background.skillProfs || [],

    abilityScores:    { ...state.abilityScores },

    proficiencies: {
      skills:    state.proficiencies.skills || [],
      tools:     state.proficiencies.tools  || [],
      languages: state.proficiencies.languages || [],
      notes:     state.proficiencies.notes || '',
    },

    equipment: {
      gp:    state.equipment.gp || 0,
      sp:    state.equipment.sp || 0,
      cp:    state.equipment.cp || 0,
      notes: state.equipment.notes || '',
    },

    spells: {
      cantrips: state.spells.cantrips || [],
      known:    state.spells.known    || [],
      notes:    state.spells.notes    || '',
    },

    enabledSources: state.sources || [],
  };
}
