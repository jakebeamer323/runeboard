import { ensureSignedIn, onAuthReady, setDisplayName, getCurrentUser, isGoogleUser, signInWithGoogle } from './firebase/auth.js';
import { createRoom, joinRoom, isDM } from './firebase/rooms.js';
import { initChat } from './modules/chat.js';
import { initDicePanel } from './modules/dice.js';
import { initInitiative } from './modules/initiative.js';
import { showToast } from './ui/notifications.js';
import { getRoomIdFromURL } from './utils/helpers.js';
import { initTheme, initSlideshow, initSettings, initSignInModal, initAuthStateUI, openSignInModal } from './ui/shared-ui.js';

const page = document.body.dataset.page;

if (page === 'home')         initHomePage();
if (page === 'rooms')        initRoomsPage();
if (page === 'player-tools') initInnerPage();
if (page === 'dm-tools')     initInnerPage();
if (page === 'room')         initRoomPage();

/* ============================================================
   HOME (landing page)
   ============================================================ */
function initHomePage() {
  initTheme();
  initSlideshow();
  initSettings();
  initSignInModal();
  initAuthStateUI();
}

/* ============================================================
   ROOMS PAGE
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

  // Show/hide auth prompt based on sign-in state
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

  joinCode?.addEventListener('keydown', e => { if (e.key === 'Enter') joinBtn?.click(); });
  createName?.addEventListener('keydown', e => { if (e.key === 'Enter') createBtn?.click(); });
}

/* ============================================================
   INNER PAGES (player-tools, dm-tools) — shared stub init
   ============================================================ */
function initInnerPage() {
  initTheme();
  initSettings();
  initSignInModal();
  initAuthStateUI();
}

/* ============================================================
   ROOM PAGE (game room)
   ============================================================ */
async function initRoomPage() {
  const roomId = getRoomIdFromURL();
  if (!roomId) { window.location.href = 'index.html'; return; }

  await new Promise(resolve => {
    const unsub = onAuthReady(user => { unsub(); resolve(user); });
  });

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
   Helpers
   ============================================================ */
function showFieldError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}
