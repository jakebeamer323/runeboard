import { db } from '../firebase/config.js';
import { getCurrentUser } from '../firebase/auth.js';
import { sanitizeHTML, formatTime, scrollToBottom } from '../utils/helpers.js';
import { MAX_CHAT_MESSAGES } from '../utils/constants.js';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let unsubscribe = null;

export function initChat(roomId) {
  const messages = document.getElementById('chat-messages');
  const input    = document.getElementById('chat-input');
  const sendBtn  = document.getElementById('chat-send-btn');

  if (!messages || !input || !sendBtn) return;

  // Listen for new messages
  const q = query(
    collection(db, 'rooms', roomId, 'messages'),
    orderBy('timestamp', 'asc'),
    limit(MAX_CHAT_MESSAGES)
  );

  unsubscribe = onSnapshot(q, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        renderMessage(messages, change.doc.data());
      }
    });
    scrollToBottom(messages);
  });

  // Send on button click or Enter
  async function send() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    const user = getCurrentUser();
    await addDoc(collection(db, 'rooms', roomId, 'messages'), {
      authorId:   user.uid,
      authorName: user.displayName || 'Adventurer',
      text,
      type:       'chat',
      timestamp:  serverTimestamp()
    });
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  return { sendRollToChat };

  async function sendRollToChat(result) {
    const user = getCurrentUser();
    const label = result.isCrit ? '🎲 CRITICAL HIT' :
                  result.isFail ? '🎲 CRITICAL FAIL' :
                  '🎲 Roll';

    await addDoc(collection(db, 'rooms', roomId, 'messages'), {
      authorId:   user.uid,
      authorName: user.displayName || 'Adventurer',
      text:       `${label}: ${result.notation.toUpperCase()} → **${result.total}**`,
      type:       'roll',
      rollData:   {
        notation: result.notation,
        rolls:    result.rolls,
        modifier: result.modifier,
        total:    result.total,
        isCrit:   result.isCrit,
        isFail:   result.isFail
      },
      timestamp:  serverTimestamp()
    });
  }
}

function renderMessage(container, data) {
  const div = document.createElement('div');

  if (data.type === 'system') {
    div.className = 'chat-msg msg-system';
    div.textContent = data.text;
    container.appendChild(div);
    return;
  }

  const isRoll = data.type === 'roll';
  div.className = 'chat-msg';

  const timeStr = formatTime(data.timestamp);

  if (isRoll) {
    const rollClass = data.rollData?.isCrit ? 'crit' : data.rollData?.isFail ? 'fail' : '';
    div.innerHTML = `
      <div>
        <span class="chat-author">${sanitizeHTML(data.authorName)}</span>
        <span class="chat-time">${timeStr}</span>
      </div>
      <div class="roll-result ${rollClass}">${formatRollText(data.text)}</div>
    `;
  } else {
    div.innerHTML = `
      <div>
        <span class="chat-author">${sanitizeHTML(data.authorName)}</span>
        <span class="chat-time">${timeStr}</span>
      </div>
      <div class="chat-text">${sanitizeHTML(data.text)}</div>
    `;
  }

  container.appendChild(div);
}

function formatRollText(text) {
  // Bold the total number (wrapped in **)
  return sanitizeHTML(text).replace(/\*\*(\d+)\*\*/g, '<strong>$1</strong>');
}

export function destroyChat() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
