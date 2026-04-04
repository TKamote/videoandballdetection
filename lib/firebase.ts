// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, memoryLocalCache } from "firebase/firestore";

// Your Firebase configuration for Expo app
const firebaseConfig = {
  apiKey: "AIzaSyB5Mpei187CTg-ILaMuFev8b4nxTfqR-hI",
  authDomain: "barako-tournament.firebaseapp.com",
  projectId: "barako-tournament",
  storageBucket: "barako-tournament.firebasestorage.app",
  messagingSenderId: "686748232951",
  appId: "1:686748232951:web:23b88cbc413dabf4ddf7f2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore with in-memory cache for React Native
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
});

export default app;

