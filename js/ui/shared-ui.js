import { onAuthReady, signInWithGoogle, signOutUser, setDisplayName } from '../firebase/auth.js';
import { showToast } from './notifications.js';

const BG_COUNT = 13;
const BG_EXT   = 'jpg'; // change if your images use a different extension

const GOOGLE_SVG = `<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
</svg>`;

// ── Theme ────────────────────────────────────────────────────────────────────

export function initTheme() {
  const saved = localStorage.getItem('rb_theme') || 'dark';
  applyTheme(saved, false);
}

function applyTheme(theme, save = true) {
  document.documentElement.dataset.theme = theme;
  if (save) localStorage.setItem('rb_theme', theme);
  const icon  = document.getElementById('theme-toggle-icon');
  const label = document.getElementById('theme-toggle-label');
  if (icon)  icon.textContent  = theme === 'dark' ? '☀️' : '🌙';
  if (label) label.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
}

// ── Background slideshow ─────────────────────────────────────────────────────

export function initSlideshow() {
  const bgA = document.getElementById('bg-a');
  const bgB = document.getElementById('bg-b');
  if (!bgA || !bgB) return;

  const images = Array.from({ length: BG_COUNT }, (_, i) =>
    `assets/images/background (${i + 1}).${BG_EXT}`
  ).sort(() => Math.random() - 0.5);

  let idx  = 0;
  let useA = true;

  bgA.style.backgroundImage = `url("${images[0]}")`;
  bgA.classList.add('active');

  setInterval(() => {
    idx = (idx + 1) % images.length;
    const next = useA ? bgB : bgA;
    const prev = useA ? bgA : bgB;
    next.style.backgroundImage = `url("${images[idx]}")`;
    next.classList.add('active');
    prev.classList.remove('active');
    useA = !useA;
  }, 8000);
}

// ── Settings panel ───────────────────────────────────────────────────────────

export function initSettings() {
  const btn   = document.getElementById('settings-btn');
  const panel = document.getElementById('settings-panel');
  const close = document.getElementById('settings-close');

  if (!btn || !panel) return;

  btn.addEventListener('click', e => {
    e.stopPropagation();
    panel.classList.toggle('open');
  });

  close?.addEventListener('click', () => panel.classList.remove('open'));

  document.addEventListener('click', e => {
    if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== btn) {
      panel.classList.remove('open');
    }
  });

  // Theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // Display name
  document.getElementById('settings-save-name')?.addEventListener('click', async () => {
    const input = document.getElementById('settings-name');
    const name  = input?.value.trim();
    if (!name) return;
    await setDisplayName(name);
    localStorage.setItem('rb_display_name', name);
    showToast('Display name saved.');
  });
}

// ── Sign-in modal ────────────────────────────────────────────────────────────

export function initSignInModal() {
  const modal     = document.getElementById('signin-modal');
  const openBtn   = document.getElementById('signin-btn');
  const closeBtn  = document.getElementById('signin-close');
  const googleBtn = document.getElementById('google-signin-btn');
  const errorEl   = document.getElementById('signin-error');

  if (!modal) return;

  function openModal()  { modal.classList.remove('hidden'); }
  function closeModal() { modal.classList.add('hidden'); }

  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  googleBtn?.addEventListener('click', async () => {
    if (errorEl) errorEl.style.display = 'none';
    googleBtn.disabled = true;
    googleBtn.textContent = 'Signing in…';
    try {
      await signInWithGoogle();
      closeModal();
      showToast('Welcome to Runeboard!');
    } catch (err) {
      if (errorEl) { errorEl.textContent = err.message; errorEl.style.display = 'block'; }
      googleBtn.disabled = false;
      googleBtn.innerHTML = `${GOOGLE_SVG} Continue with Google`;
    }
  });

  // Also wire up any extra sign-in trigger buttons on the page
  document.addEventListener('click', e => {
    if (e.target.id === 'extra-signin-btn') openModal();
  });
}

export function openSignInModal() {
  document.getElementById('signin-modal')?.classList.remove('hidden');
}

// ── Auth state → update nav ──────────────────────────────────────────────────

export function initAuthStateUI() {
  onAuthReady(user => {
    const signinBtn = document.getElementById('signin-btn');
    const userBtn   = document.getElementById('user-btn');
    const authRow   = document.getElementById('settings-auth-row');
    const nameInput = document.getElementById('settings-name');

    const isGoogle = user && !user.isAnonymous;

    if (signinBtn) signinBtn.style.display = isGoogle ? 'none' : 'inline-flex';
    if (userBtn) {
      userBtn.style.display = isGoogle ? 'inline-flex' : 'none';
      if (isGoogle) userBtn.textContent = user.displayName || user.email || 'Account';
    }

    if (nameInput) {
      nameInput.value = (isGoogle ? user.displayName : localStorage.getItem('rb_display_name')) || '';
    }

    if (authRow) {
      if (isGoogle) {
        authRow.innerHTML = `
          <span style="font-size:12px; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${user.displayName || user.email}</span>
          <button id="signout-btn" class="btn btn-ghost" style="font-size:12px; flex-shrink:0;">Sign Out</button>
        `;
        document.getElementById('signout-btn')?.addEventListener('click', async () => {
          await signOutUser();
          showToast('Signed out.');
        });
      } else {
        authRow.innerHTML = `<span style="font-size:12px; color:var(--text-muted);">Not signed in</span>`;
      }
    }
  });
}
