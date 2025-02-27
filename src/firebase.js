import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  // Você obterá estas configurações no console do Firebase
  apiKey: "AIzaSyCrLp0rVcUlgrC6LgAnwt3_-LFpDLsB-XY",
  authDomain: "daibeer.firebaseapp.com",
  projectId: "daibeer",
  storageBucket: "daibeer.appspot.com",
  messagingSenderId: "29826784348",
  appId: "1:29826784348:web:10ce6842c528033133da99",
  measurementId: "G-V8VEFKKEQY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app); 