import { ensureSignedIn, onAuthReady, getCurrentUser, isGoogleUser } from './firebase/auth.js';
import { createRoom, joinRoom, isDM } from './firebase/rooms.js';
import { initChat } from './modules/chat.js';
import { initDicePanel } from './modules/dice.js';
import { initInitiative } from './modules/initiative.js';
import { getCharacters, deleteCharacter, MAX_CHARACTERS } from './modules/characters.js';
import { showToast } from './ui/notifications.js';
import { getRoomIdFromURL, sanitizeHTML } from './utils/helpers.js';
import {
  initTheme, initSlideshow, initSettings,
  initSignInModal, initAuthStateUI, openSignInModal
} from './ui/shared-ui.js';

const page = document.body.dataset.page;

if (page === 'home')             initHomePage();
if (page === 'rooms')            initRoomsPage();
if (page === 'player-tools')     initPlayerToolsPage();
if (page === 'dm-tools')         initInnerPage();
if (page === 'create-character') initCreatorPage();
if (page === 'character-sheet')  initCharacterSheetPage();
if (page === 'room')             initRoomPage();

/* ============================================================
   HOME
   ============================================================ */
function initHomePage() {
  initTheme();
  initSlideshow();
  initSettings();
  initSignInModal();
  initAuthStateUI();
}

/* ============================================================
   ROOMS
   ============================================================ */
function initRoomsPage() {
  initTheme();
  initSettings();
  initSignInModal();
  initAuthStateUI();

  const createBtn  = document.getElementById('create-room-btn');
  const createName = document.getElementById('room-name-input');
  const joinBtn    = document.getElementById('join-room-btn');
  const joinCode   = document.getElementById('join-code-input');
  const createErr  = document.getElementById('create-error');
  const joinErr    = document.getElementById('join-error');
  const authPrompt = document.getElementById('auth-prompt');

  onAuthReady(user => {
    if (authPrompt) {
      authPrompt.style.display = (user && !user.isAnonymous) ? 'none' : 'block';
    }
  });

  createBtn?.addEventListener('click', async () => {
    if (!isGoogleUser()) { openSignInModal(); return; }
    const roomName = createName?.value.trim();
    if (!roomName) { showFieldError(createErr, 'Enter a room name.'); return; }
    createBtn.disabled = true;
    createBtn.textContent = 'Creating…';
    try {
      const code = await createRoom(roomName);
      window.location.href = `room.html?id=${code}`;
    } catch (err) {
      showFieldError(createErr, err.message);
      createBtn.disabled = false;
      createBtn.textContent = 'Create Room';
    }
  });

  joinBtn?.addEventListener('click', async () => {
    if (!isGoogleUser()) { openSignInModal(); return; }
    const code = joinCode?.value.trim().toUpperCase();
    if (!code) { showFieldError(joinErr, 'Enter a room code.'); return; }
    joinBtn.disabled = true;
    joinBtn.textContent = 'Joining…';
    try {
      await ensureSignedIn();
      await joinRoom(code);
      window.location.href = `room.html?id=${code}`;
    } catch (err) {
      showFieldError(joinErr, err.message);
      joinBtn.disabled = false;
      joinBtn.textContent = 'Join Room';
    }
  });

  joinCode?.addEventListener('keydown',   e => { if (e.key === 'Enter') joinBtn?.click(); });
  createName?.addEventListener('keydown', e => { if (e.key === 'Enter') createBtn?.click(); });
}

/* ============================================================
   PLAYER TOOLS
   ============================================================ */
async function initPlayerToolsPage() {
  initTheme();
  initSettings();
  initSignInModal();
  initAuthStateUI();

  const content  = document.getElementById('tools-content');
  const newBtn   = document.getElementById('new-char-btn');
  const user = await waitForAuth();

  if (!user || user.isAnonymous) {
    renderSignInRequired(content);
    return;
  }

  newBtn.style.display = 'inline-flex';
  await renderCharacterList(content, newBtn);

  // Re-render after sign-in changes (e.g. sign out)
  onAuthReady(async u => {
    if (!u || u.isAnonymous) {
      newBtn.style.display = 'none';
      renderSignInRequired(content);
    }
  });
}

function renderSignInRequired(content) {
  content.innerHTML = `
    <div class="char-empty">
      <div class="char-empty-icon">🔒</div>
      <h3 class="char-empty-title">Sign In Required</h3>
      <p class="char-empty-sub">Sign in with Google to save and manage your characters.</p>
      <button id="tools-signin-btn" class="btn btn-primary">Sign In with Google</button>
    </div>
  `;
  document.getElementById('tools-signin-btn')?.addEventListener('click', openSignInModal);
}

async function renderCharacterList(content, newBtn) {
  content.innerHTML = `<div class="char-loading"><div class="spinner"></div></div>`;

  let characters;
  try {
    characters = await getCharacters();
  } catch (err) {
    content.innerHTML = `<p style="color:var(--danger);text-align:center;padding:var(--space-8);">${err.message}</p>`;
    return;
  }

  const atLimit = characters.length >= MAX_CHARACTERS;

  if (newBtn) {
    newBtn.disabled = atLimit;
    newBtn.textContent = atLimit
      ? `${MAX_CHARACTERS}/${MAX_CHARACTERS} Characters`
      : '+ New Character';
    newBtn.title = atLimit ? 'Character limit reached' : '';
    newBtn.onclick = () => { if (!atLimit) window.location.href = 'create-character.html'; };
  }

  if (characters.length === 0) {
    content.innerHTML = `
      <div class="char-empty">
        <div class="char-empty-icon">⚔️</div>
        <h3 class="char-empty-title">No Characters Yet</h3>
        <p class="char-empty-sub">Create your first character to begin your adventure.</p>
        <a href="create-character.html" class="btn btn-primary">Create Character</a>
      </div>
    `;
    return;
  }

  content.innerHTML = `<div class="char-grid" id="char-grid"></div>`;
  const grid = document.getElementById('char-grid');
  characters.forEach(char => grid.appendChild(buildCharCard(char)));

  grid.querySelectorAll('.char-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      confirmDelete(btn.dataset.id, btn.dataset.name, content, newBtn);
    });
  });
}

function buildCharCard(char) {
  const div = document.createElement('div');
  div.className = 'char-card';

  const initial      = (char.name || '?')[0].toUpperCase();
  const classLevel   = [char.class, char.level ? `Level ${char.level}` : null].filter(Boolean).join(' · ');
  const speciesBg    = [char.species, char.background].filter(Boolean).join(' · ');
  const charName     = sanitizeHTML(char.name || 'Unnamed');
  const charNameRaw  = char.name || 'this character';

  div.innerHTML = `
    <div class="char-portrait">
      <span class="char-portrait-letter">${initial}</span>
    </div>
    <div class="char-card-body">
      <div class="char-name">${charName}</div>
      ${classLevel   ? `<div class="char-class-level">${sanitizeHTML(classLevel)}</div>`  : ''}
      ${speciesBg    ? `<div class="char-species-bg">${sanitizeHTML(speciesBg)}</div>`    : ''}
    </div>
    <div class="char-card-actions">
      <a href="character-sheet.html?id=${char.id}" class="btn btn-primary char-view-btn">View Sheet</a>
      <button
        class="btn btn-ghost btn-icon char-delete-btn"
        data-id="${char.id}"
        data-name="${sanitizeHTML(charNameRaw)}"
        title="Delete character"
        ${char.lockedToCampaign ? 'disabled' : ''}
      >🗑</button>
    </div>
  `;
  return div;
}

function confirmDelete(charId, charName, content, newBtn) {
  const modal     = document.getElementById('confirm-modal');
  const msgEl     = document.getElementById('confirm-msg');
  const cancelBtn = document.getElementById('confirm-cancel');
  const deleteBtn = document.getElementById('confirm-delete');
  if (!modal) return;

  msgEl.textContent = `Are you sure you want to delete "${charName}"? This cannot be undone.`;
  modal.classList.remove('hidden');

  function cleanup() {
    modal.classList.add('hidden');
    cancelBtn.removeEventListener('click', onCancel);
    deleteBtn.removeEventListener('click', onDelete);
  }

  function onCancel() { cleanup(); }

  async function onDelete() {
    cleanup();
    try {
      await deleteCharacter(charId);
      showToast(`"${charName}" deleted.`);
      await renderCharacterList(content, newBtn);
    } catch (err) {
      showToast(err.message);
    }
  }

  cancelBtn.addEventListener('click', onCancel,  { once: true });
  deleteBtn.addEventListener('click', onDelete, { once: true });
}

/* ============================================================
   CHARACTER SHEET (stub — Phase 4)
   ============================================================ */
async function initCharacterSheetPage() {
  initTheme();
  initSettings();
  initAuthStateUI();

  const content = document.getElementById('sheet-content');
  const user    = await waitForAuth();

  if (!user || user.isAnonymous) {
    if (content) content.innerHTML = `
      <div class="char-empty">
        <div class="char-empty-icon">🔒</div>
        <h3 class="char-empty-title">Sign In Required</h3>
        <p class="char-empty-sub">Sign in to view your character sheet.</p>
      </div>`;
    return;
  }

  // Phase 4 will render the full sheet here
  if (content) content.innerHTML = `
    <div class="char-empty">
      <div class="char-empty-icon">📜</div>
      <h3 class="char-empty-title">Character Sheet</h3>
      <p class="char-empty-sub">Full sheet view coming in Phase 4.</p>
      <a href="player-tools.html" class="btn btn-ghost">← Back to Characters</a>
    </div>`;
}

/* ============================================================
   CHARACTER CREATOR
   ============================================================ */
async function initCreatorPage() {
  const user = await waitForAuth();
  if (!user || user.isAnonymous) {
    window.location.href = 'player-tools.html';
    return;
  }
  try {
    const { initWizard } = await import('./creator/wizard.js');
    initWizard();
  } catch (err) {
    console.error('Wizard failed to load:', err);
    const content = document.getElementById('creator-content');
    if (content) content.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:var(--space-4);padding:var(--space-8);text-align:center;">
        <div style="font-size:36px;opacity:0.4;">⚠️</div>
        <p style="font-size:13px;color:var(--danger);">Failed to load character creator: ${err.message}</p>
        <a href="player-tools.html" class="btn btn-ghost">← Back to Characters</a>
      </div>`;
  }
}

/* ============================================================
   INNER PAGES (dm-tools stubs)
   ============================================================ */
function initInnerPage() {
  initTheme();
  initSettings();
  initSignInModal();
  initAuthStateUI();
}

/* ============================================================
   ROOM PAGE
   ============================================================ */
async function initRoomPage() {
  const roomId = getRoomIdFromURL();
  if (!roomId) { window.location.href = 'index.html'; return; }

  await waitForAuth();
  if (!getCurrentUser()) { window.location.href = 'index.html'; return; }

  let room;
  try {
    room = await joinRoom(roomId);
  } catch {
    showToast('Room not found. Redirecting…');
    setTimeout(() => { window.location.href = 'index.html'; }, 2000);
    return;
  }

  const dm = isDM(room);

  const roomNameEl = document.getElementById('navbar-room-name');
  const roomCodeEl = document.getElementById('navbar-room-code');
  const dmBadge    = document.getElementById('dm-badge');

  if (roomNameEl) roomNameEl.textContent = room.name;
  if (roomCodeEl) {
    roomCodeEl.textContent = room.code;
    roomCodeEl.title = 'Click to copy';
    roomCodeEl.addEventListener('click', () => {
      navigator.clipboard.writeText(room.code).then(() => showToast('Room code copied!'));
    });
  }
  if (dmBadge) dmBadge.style.display = dm ? 'inline-flex' : 'none';

  document.getElementById('leave-btn')?.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  const { sendRollToChat } = initChat(roomId);
  initDicePanel(roomId, sendRollToChat);
  initInitiative(roomId, dm);
}

/* ============================================================
   SHARED HELPERS
   ============================================================ */
function waitForAuth() {
  return new Promise(resolve => {
    const unsub = onAuthReady(user => { unsub(); resolve(user); });
  });
}

function showFieldError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}
