// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQm0OOssxldFQWAZJju_AVMVCNYoF3mcY",
  authDomain: "wonderfall-3a49e.firebaseapp.com",
  projectId: "wonderfall-3a49e",
  storageBucket: "wonderfall-3a49e.firebasestorage.app",
  messagingSenderId: "474324497072",
  appId: "1:474324497072:android:d55a86f80589f51cab4175",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
