import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBN3tFMBVtbBIcmxyje6KqSNeV0r308gcQ",
  authDomain: "med4u-86c5f.firebaseapp.com",
  projectId: "med4u-86c5f",
  storageBucket: "med4u-86c5f.firebasestorage.app",
  messagingSenderId: "270674828572",
  appId: "1:270674828572:web:18285e1989c4303f91aed9",
  measurementId: "G-DFMVS6XLCS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };


