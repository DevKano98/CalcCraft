// Import the functions you need from the SDKs you need
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCCpeldyiTsQN5xyDjPxpaCAs8QQHdIRLk",
  authDomain: "feedback-geekynerds-03-93212.firebaseapp.com",
  databaseURL: "https://feedback-geekynerds-03-93212-default-rtdb.firebaseio.com",
  projectId: "feedback-geekynerds-03-93212",
  storageBucket: "feedback-geekynerds-03-93212.firebasestorage.app",
  messagingSenderId: "774493138029",
  appId: "1:774493138029:web:2aa80a90695b149806e364"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const db = getFirestore(app);