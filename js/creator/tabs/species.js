/* ============================================================
   TAB: SPECIES — Race/species selection with source filtering
   ============================================================ */

import { get, set, subscribe } from '../state.js';
import { fetchRaces } from '../../data/open5e.js';
import { getEnabledOpen5eSlugs, open5eSlugToSourceId } from '../../data/sources.js';
import { openSourceFilter, onSourcesChange } from '../source-filter.js';

let _container = null;
let _allRaces = [];
let _unsub = null;

export function init(container) {
  _container = container;
  _render();
  _loadRaces();

  // Re-filter when sources change
  _unsub = onSourcesChange(() => {
    _applyFilter();
  });
}

export function onLeave() {
  _unsub?.();
  _unsub = null;
}

// ---- Render shell -----------------------------------------

function _render() {
  const selected = get('species');
  const enabledSources = get('sources');

  _container.innerHTML = `
    <div class="creator-section-header">
      <div class="creator-section-header-text">
        <h2 class="creator-section-title">Species</h2>
        <p class="creator-section-sub">Choose your character's species. Each species provides unique traits, ability score adjustments, and roleplay flavor.</p>
      </div>
      <button id="species-sources-btn" class="btn btn-ghost" style="flex-shrink:0;">
        📚 Sources <span id="species-source-count">(${enabledSources.length})</span>
      </button>
    </div>

    <div class="creator-search-bar">
      <input
        type="text"
        id="species-search"
        placeholder="Search species…"
        autocomplete="off"
      />
    </div>

    <div id="species-list-wrap">
      <div class="creator-loading">
        <div class="spinner"></div>
        <span>Loading species…</span>
      </div>
    </div>

    <div id="species-detail-wrap"></div>
  `;

  _container.querySelector('#species-sources-btn').addEventListener('click', openSourceFilter);

  _container.querySelector('#species-search').addEventListener('input', e => {
    _applyFilter(e.target.value);
  });

  // Subscribe to sources changes to update count badge
  subscribe('sources', sources => {
    const badge = document.getElementById('species-source-count');
    if (badge) badge.textContent = `(${sources.length})`;
  });

  // If we already have a selection, show detail immediately
  if (selected.id) {
    _renderDetail(selected);
  }
}

// ---- Load races from API ----------------------------------

async function _loadRaces() {
  try {
    const slugs = getEnabledOpen5eSlugs(get('sources'));
    // Fetch all races (Open5e is permissive, we filter client-side for better UX)
    _allRaces = await fetchRaces();
    _applyFilter();
  } catch (err) {
    const wrap = document.getElementById('species-list-wrap');
    if (wrap) {
      wrap.innerHTML = `
        <div class="creator-empty">
          <p>Could not load species data from Open5e.</p>
          <p style="margin-top:8px;font-size:11px;color:var(--text-muted);">${err.message}</p>
        </div>
      `;
    }
  }
}

// ---- Filter and render cards ------------------------------

function _applyFilter(searchText = '') {
  const wrap = document.getElementById('species-list-wrap');
  if (!wrap) return;

  const enabledSlugs = new Set(getEnabledOpen5eSlugs(get('sources')));
  const query = (searchText || _container.querySelector('#species-search')?.value || '').toLowerCase().trim();

  let filtered = _allRaces.filter(r => {
    const sourceMatch = enabledSlugs.size === 0 || enabledSlugs.has(r.sourceSlug);
    const searchMatch = !query || r.name.toLowerCase().includes(query);
    return sourceMatch && searchMatch;
  });

  // Sort alphabetically
  filtered.sort((a, b) => a.name.localeCompare(b.name));

  if (filtered.length === 0) {
    wrap.innerHTML = `
      <div class="creator-empty">
        ${query
          ? `No species matching "<strong>${query}</strong>" in the selected sources.`
          : 'No species found for the selected sources. Try enabling more source books.'
        }
      </div>
    `;
    return;
  }

  const selectedId = get('species.id');

  wrap.innerHTML = `<div class="creator-grid" id="species-grid"></div>`;
  const grid = wrap.querySelector('#species-grid');

  filtered.forEach(race => {
    const card = document.createElement('button');
    card.className = 'creator-option-card' + (race.id === selectedId ? ' selected' : '');
    card.dataset.raceId = race.id;

    const sourceId = open5eSlugToSourceId(race.sourceSlug);

    card.innerHTML = `
      <div class="creator-option-card-check">✓</div>
      <div class="creator-option-card-name">${race.name}</div>
      <div class="creator-option-card-source">${sourceId}</div>
      ${race.desc ? `<div class="creator-option-card-desc">${race.desc}</div>` : ''}
    `;

    card.addEventListener('click', () => _selectRace(race));
    grid.appendChild(card);
  });
}

// ---- Select a race ----------------------------------------

function _selectRace(race) {
  // Update state
  set('species', {
    id: race.id,
    name: race.name,
    source: open5eSlugToSourceId(race.sourceSlug),
    speed: race.speed,
    size: race.size,
    traits: race.traits,
    desc: race.desc,
  });

  // Update card selection highlight
  document.querySelectorAll('.creator-option-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.raceId === race.id);
  });

  // Show detail panel
  _renderDetail(race);

  // Scroll detail into view
  document.getElementById('species-detail-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ---- Render selected detail panel -------------------------

function _renderDetail(race) {
  const wrap = document.getElementById('species-detail-wrap');
  if (!wrap) return;

  const sourceId = race.source || open5eSlugToSourceId(race.sourceSlug || '');

  wrap.innerHTML = `
    <div class="creator-detail-panel">
      <div class="creator-detail-header">
        <div>
          <div class="creator-detail-title">${race.name}</div>
          <div class="creator-detail-meta">
            ${race.speed ? `<span>🏃 Speed ${race.speed} ft</span>` : ''}
            ${race.size  ? `<span>📏 ${race.size} size</span>` : ''}
            ${sourceId   ? `<span>📖 ${sourceId}</span>` : ''}
          </div>
        </div>
        <button class="btn btn-ghost" id="species-deselect-btn" style="font-size:11px;">✕ Clear</button>
      </div>

      ${race.desc ? `<p style="font-size:13px;color:var(--text-muted);line-height:1.6;margin-bottom:var(--space-4);">${race.desc.substring(0, 400)}${race.desc.length > 400 ? '…' : ''}</p>` : ''}

      ${race.traits?.length ? `
        <div class="creator-traits">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:var(--space-2);">Racial Traits</div>
          ${race.traits.map(t => `
            <div>
              <div class="creator-trait-name">${t.name}</div>
              <div class="creator-trait-desc">${t.desc}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${race.languages ? `
        <div style="margin-top:var(--space-4);">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:var(--space-2);">Languages</div>
          <div style="font-size:13px;color:var(--text-muted);">${race.languages}</div>
        </div>
      ` : ''}
    </div>
  `;

  wrap.querySelector('#species-deselect-btn')?.addEventListener('click', () => {
    set('species', { id: null, name: '', source: null, speed: null, size: '', traits: [], desc: '' });
    document.querySelectorAll('.creator-option-card').forEach(c => c.classList.remove('selected'));
    wrap.innerHTML = '';
  });
}

export function validate() {
  return !!get('species.id');
}
