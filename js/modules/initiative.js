import { db } from '../firebase/config.js';
import { getCurrentUser } from '../firebase/auth.js';
import { sanitizeHTML } from '../utils/helpers.js';
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  getDocs
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let unsubscribe = null;
let currentRoomId = null;
let isDMUser = false;

export function initInitiative(roomId, isDM) {
  currentRoomId = roomId;
  isDMUser = isDM;

  const list       = document.getElementById('init-list');
  const addForm    = document.getElementById('init-add-form');
  const nameInput  = document.getElementById('init-name');
  const initInput  = document.getElementById('init-value');
  const hpInput    = document.getElementById('init-hp');
  const addBtn     = document.getElementById('init-add-btn');
  const nextBtn    = document.getElementById('init-next-btn');
  const clearBtn   = document.getElementById('init-clear-btn');

  if (!list) return;

  // Show DM-only controls
  if (isDM) {
    if (addForm)  addForm.style.display  = 'flex';
    if (nextBtn)  nextBtn.style.display  = 'inline-flex';
    if (clearBtn) clearBtn.style.display = 'inline-flex';
  }

  // Listen for combatants
  const q = query(
    collection(db, 'rooms', roomId, 'initiative'),
    orderBy('initiative', 'desc')
  );

  unsubscribe = onSnapshot(q, snapshot => {
    const combatants = [];
    snapshot.forEach(d => combatants.push({ id: d.id, ...d.data() }));
    renderList(list, combatants, isDM);
  });

  // Add combatant
  if (addBtn && isDM) {
    addBtn.addEventListener('click', async () => {
      const name = nameInput?.value.trim();
      const init = parseInt(initInput?.value) || 0;
      const hp   = parseInt(hpInput?.value)   || 0;
      if (!name) return;

      await addDoc(collection(db, 'rooms', roomId, 'initiative'), {
        name,
        initiative: init,
        hp,
        maxHp: hp,
        isActive: false
      });

      if (nameInput) nameInput.value = '';
      if (initInput) initInput.value = '';
      if (hpInput)   hpInput.value   = '';
      nameInput?.focus();
    });

    // Enter key on name field submits
    nameInput?.addEventListener('keydown', e => {
      if (e.key === 'Enter') addBtn.click();
    });
  }

  // Next turn
  if (nextBtn && isDM) {
    nextBtn.addEventListener('click', () => advanceTurn(roomId));
  }

  // Clear all
  if (clearBtn && isDM) {
    clearBtn.addEventListener('click', () => clearInitiative(roomId));
  }
}

function renderList(container, combatants, isDM) {
  container.innerHTML = '';

  if (combatants.length === 0) {
    container.innerHTML = '<div class="empty-state">No combatants yet.</div>';
    return;
  }

  combatants.forEach(c => {
    const div = document.createElement('div');
    div.className = `init-entry${c.isActive ? ' active' : ''}`;
    div.innerHTML = `
      <span class="init-badge">${c.initiative}</span>
      <span class="init-name">${sanitizeHTML(c.name)}</span>
      <span class="init-hp">${c.hp}/${c.maxHp} HP</span>
      ${isDM ? `<button class="btn-icon init-remove-btn" data-id="${c.id}" title="Remove">×</button>` : ''}
    `;
    container.appendChild(div);
  });

  if (isDM) {
    container.querySelectorAll('.init-remove-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await deleteDoc(doc(db, 'rooms', currentRoomId, 'initiative', btn.dataset.id));
      });
    });
  }
}

async function advanceTurn(roomId) {
  const snap = await getDocs(
    query(collection(db, 'rooms', roomId, 'initiative'), orderBy('initiative', 'desc'))
  );

  const combatants = [];
  snap.forEach(d => combatants.push({ id: d.id, ...d.data() }));

  if (combatants.length === 0) return;

  const activeIdx = combatants.findIndex(c => c.isActive);
  const nextIdx   = (activeIdx + 1) % combatants.length;

  const batch = writeBatch(db);
  combatants.forEach((c, i) => {
    batch.update(doc(db, 'rooms', roomId, 'initiative', c.id), {
      isActive: i === nextIdx
    });
  });
  await batch.commit();
}

async function clearInitiative(roomId) {
  const snap = await getDocs(collection(db, 'rooms', roomId, 'initiative'));
  const batch = writeBatch(db);
  snap.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

export function destroyInitiative() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
