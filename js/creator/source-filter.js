/* ============================================================
   SOURCE FILTER PANEL — Slide-in panel for selecting source books
   ============================================================ */

import { get, set, subscribe } from './state.js';
import { getSourcesByCategory } from '../data/sources.js';

let _panel = null;
let _overlay = null;
let _onChangeCallbacks = new Set();

// Init the source filter panel (call once on page load)
export function initSourceFilter() {
  _panel = document.getElementById('source-filter-panel');
  _overlay = document.getElementById('source-filter-overlay');
  if (!_panel) return;

  _renderPanel();

  _overlay?.addEventListener('click', closeSourceFilter);

  // Re-render when sources state changes externally
  subscribe('sources', () => _syncCheckboxes());
}

// Open the panel
export function openSourceFilter() {
  _panel?.classList.add('open');
  _overlay?.classList.add('visible');
}

// Close the panel
export function closeSourceFilter() {
  _panel?.classList.remove('open');
  _overlay?.classList.remove('visible');
}

// Register a callback for when sources change
export function onSourcesChange(fn) {
  _onChangeCallbacks.add(fn);
  return () => _onChangeCallbacks.delete(fn);
}

// ---- Render -----------------------------------------------

function _renderPanel() {
  const enabledSources = new Set(get('sources') || []);
  const groups = getSourcesByCategory();

  _panel.innerHTML = `
    <div class="source-filter-header">
      <span class="source-filter-title">Source Books</span>
      <button class="modal-close" id="source-filter-close">×</button>
    </div>
    <div class="source-filter-body" id="source-filter-body">
      ${Object.entries(groups).map(([cat, sources]) => `
        <div class="source-cat-group">
          <div class="source-cat-label">${cat}</div>
          ${sources.map(src => `
            <label class="source-item">
              <input
                type="checkbox"
                data-source-id="${src.id}"
                ${enabledSources.has(src.id) ? 'checked' : ''}
              />
              <span class="source-item-name">${src.name}</span>
              <span class="source-item-id">${src.id}</span>
            </label>
          `).join('')}
        </div>
      `).join('')}
    </div>
    <div class="source-filter-footer">
      <button id="source-select-all" class="btn btn-ghost" style="flex:1;font-size:11px;">All</button>
      <button id="source-select-none" class="btn btn-ghost" style="flex:1;font-size:11px;">None</button>
      <button id="source-filter-apply" class="btn btn-primary" style="flex:2;font-size:12px;">Apply</button>
    </div>
  `;

  _panel.querySelector('#source-filter-close').addEventListener('click', closeSourceFilter);

  _panel.querySelector('#source-select-all').addEventListener('click', () => {
    _panel.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = true);
  });

  _panel.querySelector('#source-select-none').addEventListener('click', () => {
    _panel.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false);
  });

  _panel.querySelector('#source-filter-apply').addEventListener('click', () => {
    const checked = [..._panel.querySelectorAll('input[type=checkbox]:checked')]
      .map(cb => cb.dataset.sourceId);
    set('sources', checked);
    _onChangeCallbacks.forEach(fn => fn(checked));
    closeSourceFilter();
  });
}

function _syncCheckboxes() {
  if (!_panel) return;
  const enabled = new Set(get('sources') || []);
  _panel.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.checked = enabled.has(cb.dataset.sourceId);
  });
}
