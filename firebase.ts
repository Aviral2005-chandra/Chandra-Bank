// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJROAgJk8g9dywrIMK8mWfu1id4-LEJH0",
  authDomain: "bank-mgmt-68988.firebaseapp.com",
  projectId: "bank-mgmt-68988",
  storageBucket: "bank-mgmt-68988.firebasestorage.app",
  messagingSenderId: "317921901949",
  appId: "1:317921901949:web:0010781482a2442df76014",
  measurementId: "G-5VEV0EW1B7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;