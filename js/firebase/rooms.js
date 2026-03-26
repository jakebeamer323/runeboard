import { db } from './config.js';
import { getCurrentUser } from './auth.js';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { generateRoomCode } from '../utils/helpers.js';

export async function createRoom(roomName) {
  const code = generateRoomCode();
  const user = getCurrentUser();

  await setDoc(doc(db, 'rooms', code), {
    name: roomName,
    code,
    dmUserId: user.uid,
    dmName: user.displayName || 'DM',
    createdAt: serverTimestamp()
  });

  return code;
}

export async function joinRoom(code) {
  const ref = doc(db, 'rooms', code.toUpperCase().trim());
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Room not found. Check the code and try again.');
  return snap.data();
}

export function isDM(room) {
  const user = getCurrentUser();
  return !!(user && room && room.dmUserId === user.uid);
}
