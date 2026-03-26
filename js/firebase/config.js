import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyBPgdBc_H_qFgJ1U3DTRGArhHOHGuHNGwc",
  authDomain: "runeboard.firebaseapp.com",
  projectId: "runeboard",
  storageBucket: "runeboard.firebasestorage.app",
  messagingSenderId: "82604413197",
  appId: "1:82604413197:web:a79be2d5365d908c106044"
};

const app = initializeApp(firebaseConfig);

export const db   = getFirestore(app);
export const auth = getAuth(app);
