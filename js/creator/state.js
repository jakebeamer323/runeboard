/* ============================================================
   CHARACTER CREATOR — Reactive state store
   Pub/sub pattern with localStorage draft persistence
   ============================================================ */

import { CHARACTER_CREATOR_SOURCES } from '../data/sources.js';

const DRAFT_KEY = 'runeboard_char_draft';

function defaultState() {
  return {
    basics: {
      name: '',
      alignment: '',
      backstory: '',
    },
    sources: [...CHARACTER_CREATOR_SOURCES],
    species: {
      id: null,
      name: '',
      source: null,
      speed: null,
      size: '',
      traits: [],
      desc: '',
    },
    class: {
      id: null,
      name: '',
      source: null,
      hitDie: null,
      savingThrows: [],
    },
    level: 1,
    background: {
      id: null,
      name: '',
      source: null,
      feature: '',
      skillProfs: [],
    },
    abilityScores: {
      method: 'standard-array',
      str: null, dex: null, con: null,
      int: null, wis: null,  cha: null,
    },
    proficiencies: {
      skills: [],
      tools: [],
      languages: [],
      notes: '',
    },
    equipment: {
      gp: 0, sp: 0, cp: 0,
      items: [],
      notes: '',
    },
    spells: {
      cantrips: [],
      known: [],
      notes: '',
    },
  };
}

// Mutable state object
let _state = defaultState();

// Listeners: key → Set<function>
const _listeners = new Map();

// Debounced save to localStorage
let _saveTimer = null;
function _scheduleSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(_saveDraft, 400);
}

function _saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(_state));
  } catch {}
}

// Notify subscribers for a key AND the wildcard '*'
function _notify(key) {
  const fns = _listeners.get(key);
  if (fns) fns.forEach(fn => fn(get(key)));
  if (key !== '*') {
    const wild = _listeners.get('*');
    if (wild) wild.forEach(fn => fn(_state));
  }
}

// Dot-path getter: get('basics.name') → 'Aragorn'
export function get(path) {
  if (!path || path === '*') return structuredClone(_state);
  return path.split('.').reduce((obj, k) => obj?.[k], _state);
}

// Dot-path setter: set('basics.name', 'Aragorn')
export function set(path, value) {
  const keys = path.split('.');
  let obj = _state;
  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]];
  }
  obj[keys[keys.length - 1]] = value;
  _notify(path.split('.')[0]); // notify top-level key
  _scheduleSave();
}

// Subscribe to a top-level key or '*' for any change
// Returns an unsubscribe function
export function subscribe(key, fn) {
  if (!_listeners.has(key)) _listeners.set(key, new Set());
  _listeners.get(key).add(fn);
  return () => _listeners.get(key).delete(fn);
}

// Get a deep clone of the full state
export function getAll() {
  return structuredClone(_state);
}

// Reset to defaults (start new character)
export function reset() {
  _state = defaultState();
  localStorage.removeItem(DRAFT_KEY);
  _notify('*');
}

// Load draft from localStorage if available
// Returns true if a draft was found
export function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    // Merge saved into defaults so new keys are included
    _state = Object.assign(defaultState(), saved);
    return !!(saved.basics?.name);
  } catch {
    return false;
  }
}

// Manually save draft right now
export function saveDraft() {
  _saveDraft();
}
