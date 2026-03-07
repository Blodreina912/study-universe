import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getDatabase, ref, set, push, onValue, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAp6ThPdrKTMtCDWaRuh_h5aatQmcmm35k",
  authDomain: "studyverse-4d3ac.firebaseapp.com",
  projectId: "studyverse-4d3ac",
  storageBucket: "studyverse-4d3ac.firebasestorage.app",
  messagingSenderId: "154008682561",
  appId: "1:154008682561:web:9a3f3581dbb31ec3bfc6c0",
  databaseURL: "https://studyverse-4d3ac-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const provider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, provider);
export const logOut = () => signOut(auth);
