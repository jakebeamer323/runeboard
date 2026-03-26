import { auth } from './config.js';
import {
  signInAnonymously,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

export function getCurrentUser() {
  return auth.currentUser;
}

export function onAuthReady(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function ensureSignedIn() {
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

export async function setDisplayName(name) {
  if (!auth.currentUser) return;
  await updateProfile(auth.currentUser, { displayName: name });
}
