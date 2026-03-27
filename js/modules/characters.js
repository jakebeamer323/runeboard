import { db } from '../firebase/config.js';
import { getCurrentUser } from '../firebase/auth.js';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

export const MAX_CHARACTERS = 5;

function userCharsRef() {
  const user = getCurrentUser();
  if (!user || user.isAnonymous) throw new Error('Must be signed in.');
  return collection(db, 'users', user.uid, 'characters');
}

export async function getCharacters() {
  const user = getCurrentUser();
  if (!user || user.isAnonymous) return [];
  const q = query(userCharsRef(), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getCharacter(charId) {
  const user = getCurrentUser();
  if (!user || user.isAnonymous) throw new Error('Must be signed in.');
  const snap = await getDoc(doc(db, 'users', user.uid, 'characters', charId));
  if (!snap.exists()) throw new Error('Character not found.');
  return { id: snap.id, ...snap.data() };
}

export async function createCharacter(data) {
  const existing = await getCharacters();
  if (existing.length >= MAX_CHARACTERS) {
    throw new Error(`You've reached the ${MAX_CHARACTERS} character limit.`);
  }
  const ref = doc(userCharsRef());
  await setDoc(ref, {
    ...data,
    lockedToCampaign: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
}

export async function updateCharacter(charId, data) {
  const user = getCurrentUser();
  if (!user || user.isAnonymous) throw new Error('Must be signed in.');
  await updateDoc(doc(db, 'users', user.uid, 'characters', charId), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deleteCharacter(charId) {
  const user = getCurrentUser();
  if (!user || user.isAnonymous) throw new Error('Must be signed in.');
  await deleteDoc(doc(db, 'users', user.uid, 'characters', charId));
}
