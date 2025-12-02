// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration for Expo app
const firebaseConfig = {
  apiKey: "AIzaSyBvqvuSC9Ta6zIhdLIxOJmGvJfZiZxLUl8",
  authDomain: "overlayapp-cb8b5.firebaseapp.com",
  projectId: "overlayapp-cb8b5",
  storageBucket: "overlayapp-cb8b5.firebasestorage.app",
  messagingSenderId: "273980807792",
  appId: "1:273980807792:web:54c13fc0d6585c5aa8f2b5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore
export const db = getFirestore(app);

export default app;

