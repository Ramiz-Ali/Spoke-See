// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAlG5qT3cy38na77KmIBTxb3lNnNU-JGgw",
  authDomain: "login-auth-93224.firebaseapp.com",
  databaseURL: "https://login-auth-93224-default-rtdb.firebaseio.com",
  projectId: "login-auth-93224",
  storageBucket: "login-auth-93224.firebasestorage.app",
  messagingSenderId: "414344780518",
  appId: "1:414344780518:web:47bd8349022199816cb927"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);