import { initializeApp } from "firebase/app";
import { getDatabase, onValue, ref, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDjmaZ3zwef5JbsZOMrs-WXAtEHCQBEBDA",
  authDomain: "landa-demo.firebaseapp.com",
  databaseURL: "https://landa-demo-default-rtdb.firebaseio.com",
  projectId: "landa-demo",
  storageBucket: "landa-demo.firebasestorage.app",
  messagingSenderId: "367087430963",
  appId: "1:367087430963:web:d27baf909936ba6114e246",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, onValue, ref, set };
