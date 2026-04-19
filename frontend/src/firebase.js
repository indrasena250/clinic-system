import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// 🔥 Your Firebase Config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "clinic-system-d745f.firebaseapp.com",
  projectId: "clinic-system-d745f",
  storageBucket: "clinic-system-d745f.firebasestorage.app",
  messagingSenderId: "1004074429342",
  appId: "1:1004074429342:web:bec0a2c27f1bff769d448f",
  measurementId: "G-BGFHRX44WH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔐 Authentication
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();