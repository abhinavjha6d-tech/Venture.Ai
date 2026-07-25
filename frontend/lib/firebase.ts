import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBfe78OZb2_a7-UkrYl6hlXX3WvOEVPgqo",
  authDomain: "venture-ai-69352.firebaseapp.com",
  projectId: "venture-ai-69352",
  storageBucket: "venture-ai-69352.firebasestorage.app",
  messagingSenderId: "101930148347",
  appId: "1:101930148347:web:b26387b47e7471932ab75c"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup, signOut };