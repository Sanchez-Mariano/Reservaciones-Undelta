import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZv7H_Q-A4qkUX9kSp5Yq778uLkGgm7sM",
  authDomain: "reservaciones-undelta.firebaseapp.com",
  projectId: "reservaciones-undelta",
  storageBucket: "reservaciones-undelta.firebasestorage.app",
  messagingSenderId: "413332659749",
  appId: "1:413332659749:web:87a5849b6e20771a19e9cc",
  measurementId: "G-7ESSFHXJL7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// export
export const db = getFirestore(app);
export const functions = getFunctions(app);