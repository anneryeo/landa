// webapp/src/firebase.js
import { initializeApp } from "firebase/app";
import { getApp, getApps } from "firebase/app";
// NEW: We need to import these specific database tools
import { getDatabase, ref, onValue, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDjmaZ3zwef5JbsZOMrs-WXAtEHCQBEBDA",
  authDomain: "landa-demo.firebaseapp.com",
  databaseURL: "https://landa-demo-default-rtdb.firebaseio.com/",
  projectId: "landa-demo",
  storageBucket: "landa-demo.firebasestorage.app",
  messagingSenderId: "367087430963",
  appId: "1:367087430963:web:d27baf909936ba6114e246"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// NEW: Create the database connection and EXPORT it so the hook can see it
export const database = getDatabase(app);

// NEW: Export these helper functions too
export { ref, onValue, set };