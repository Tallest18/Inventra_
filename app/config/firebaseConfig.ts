


import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  browserLocalPersistence,
  getAuth,
  initializeAuth,
} from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyCrKxvjzrgxn0oyGS8arRtZgyfU3CBgDvc",
  authDomain: "wonderfall-be388.firebaseapp.com",
  projectId: "wonderfall-be388",
  storageBucket: "wonderfall-be388.appspot.com", // ✅ fixed
  messagingSenderId: "474324497072",
  appId: "1:474324497072:web:a0b1c2d3e4f5g6h7i8j9k0",
};

// --- App Initialization ---
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// --- Auth Initialization ---
let firebaseAuth: Auth;

try {
  // Try to reuse existing Auth instance
  firebaseAuth = getAuth(app);
} catch {
  // Fallback for first load or race conditions
  firebaseAuth = initializeAuth(app, {
    persistence: Platform.OS === 'web' ? browserLocalPersistence : undefined,
  });
}

// --- Other Services ---
const firebaseDb: Firestore = getFirestore(app);
const firebaseStorage: FirebaseStorage = getStorage(app);

// --- Exports ---
export {
  firebaseAuth as auth, firebaseConfig as config, firebaseDb as db, app as firebaseApp, firebaseDb as firestore, // alias
  firebaseStorage as storage
};

// --- Types ---
  export type { Auth, FirebaseStorage, Firestore };

