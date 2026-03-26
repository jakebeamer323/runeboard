import { ensureSignedIn, onAuthReady, setDisplayName, getCurrentUser } from './firebase/auth.js';
import { createRoom, joinRoom, isDM } from './firebase/rooms.js';
import { initChat } from './modules/chat.js';
import { initDicePanel } from './modules/dice.js';
import { initInitiative } from './modules/initiative.js';
import { showToast } from './ui/notifications.js';
import { getRoomIdFromURL } from './utils/helpers.js';

const page = document.body.dataset.page;

if (page === 'home')  initHome();
if (page === 'room')  initRoomPage();

/* ============================================================
   HOME PAGE
   ============================================================ */
function initHome() {
  const nameInput    = document.getElementById('display-name');
  const createBtn    = document.getElementById('create-room-btn');
  const createName   = document.getElementById('room-name-input');
  const joinBtn      = document.getElementById('join-room-btn');
  const joinCode     = document.getElementById('join-code-input');
  const createErr    = document.getElementById('create-error');
  const joinErr      = document.getElementById('join-error');

  // Pre-fill name from localStorage
  const savedName = localStorage.getItem('rb_display_name');
  if (savedName && nameInput) nameInput.value = savedName;

  createBtn?.addEventListener('click', async () => {
    const name     = nameInput?.value.trim();
    const roomName = createName?.value.trim();

    if (!name) { showError(createErr, 'Enter your name first.'); return; }
    if (!roomName) { showError(createErr, 'Enter a room name.'); return; }

    createBtn.disabled = true;
    createBtn.textContent = 'Creating…';

    try {
      await ensureSignedIn();
      await setDisplayName(name);
      localStorage.setItem('rb_display_name', name);

      const code = await createRoom(roomName);
      window.location.href = `room.html?id=${code}`;
    } catch (err) {
      showError(createErr, err.message);
      createBtn.disabled = false;
      createBtn.textContent = 'Create Room';
    }
  });

  joinBtn?.addEventListener('click', async () => {
    const name = nameInput?.value.trim();
    const code = joinCode?.value.trim().toUpperCase();

    if (!name) { showError(joinErr, 'Enter your name first.'); return; }
    if (!code) { showError(joinErr, 'Enter a room code.'); return; }

    joinBtn.disabled = true;
    joinBtn.textContent = 'Joining…';

    try {
      await ensureSignedIn();
      await setDisplayName(name);
      localStorage.setItem('rb_display_name', name);

      await joinRoom(code);
      window.location.href = `room.html?id=${code}`;
    } catch (err) {
      showError(joinErr, err.message);
      joinBtn.disabled = false;
      joinBtn.textContent = 'Join Room';
    }
  });

  // Allow Enter on inputs
  joinCode?.addEventListener('keydown', e => {
    if (e.key === 'Enter') joinBtn?.click();
  });
  createName?.addEventListener('keydown', e => {
    if (e.key === 'Enter') createBtn?.click();
  });
}

/* ============================================================
   ROOM PAGE
   ============================================================ */
async function initRoomPage() {
  const roomId = getRoomIdFromURL();
  if (!roomId) {
    window.location.href = 'index.html';
    return;
  }

  // Wait for auth
  await new Promise(resolve => {
    const unsub = onAuthReady(user => {
      unsub();
      resolve(user);
    });
  });

  // If not signed in, redirect home
  if (!getCurrentUser()) {
    window.location.href = 'index.html';
    return;
  }

  let room;
  try {
    room = await joinRoom(roomId);
  } catch {
    showToast('Room not found. Redirecting…');
    setTimeout(() => { window.location.href = 'index.html'; }, 2000);
    return;
  }

  const dm = isDM(room);

  // Update navbar
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

  // Leave room button
  document.getElementById('leave-btn')?.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Init modules
  const { sendRollToChat } = initChat(roomId);
  initDicePanel(roomId, sendRollToChat);
  initInitiative(roomId, dm);
}

/* ============================================================
   Helpers
   ============================================================ */
function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}
