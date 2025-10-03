// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);