import { auth } from './config.js';
import {
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const googleProvider = new GoogleAuthProvider();

export function getCurrentUser() {
  return auth.currentUser;
}

export function isGoogleUser() {
  const user = auth.currentUser;
  return !!(user && !user.isAnonymous);
}

export function onAuthReady(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function ensureSignedIn() {
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

export async function signInWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function signOutUser() {
  await signOut(auth);
}

export async function setDisplayName(name) {
  if (!auth.currentUser) return;
  await updateProfile(auth.currentUser, { displayName: name });
}
