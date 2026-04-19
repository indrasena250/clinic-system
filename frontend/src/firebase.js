import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// 🔥 Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB3BLBIrxIB8mAOBtSv1U8kDqPtvNF6sLk",
  authDomain: "clinic-system-d745f.firebaseapp.com",
  projectId: "clinic-system-d745f",
  storageBucket: "clinic-system-d745f.firebasestorage.app",
  messagingSenderId: "1004074429342",
  appId: "1:1004074429342:web:ed800c6bdb10d8159d448f",
  measurementId: "G-X1JHV9T1ES"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔐 Authentication
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();