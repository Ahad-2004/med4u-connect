// Firebase config for Med4U (shared)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDkF8qikz85LYrg7LTePY0oYM4J7b_P6rU",
  authDomain: "med4u-connect.firebaseapp.com",
  projectId: "med4u-connect",
  storageBucket: "med4u-connect.firebasestorage.app",
  messagingSenderId: "823405625851",
  appId: "1:823405625851:web:9815bd4dc1d21cfd7a8b5e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
