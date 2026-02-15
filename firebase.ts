import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBiFE4Fp0dlVZjpx6bAf1GI15Daur75B4o",
  authDomain: "facebots-ce620.firebaseapp.com",
  databaseURL: "https://facebots-ce620-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "facebots-ce620",
  storageBucket: "facebots-ce620.firebasestorage.app",
  messagingSenderId: "663710812812",
  appId: "1:663710812812:web:2c347627faf500814189a9",
  measurementId: "G-L8FEJ3400P"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const analytics = getAnalytics(app);