
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA3F088BzZu-3ZouJ1glaSTPJGrpb0WtNo",
  authDomain: "hirelink-fd1fe.firebaseapp.com",
  projectId: "hirelink-fd1fe",
  storageBucket: "hirelink-fd1fe.firebasestorage.app",
  messagingSenderId: "530876866828",
  appId: "1:530876866828:web:59c127b835560e4da3a929",
  measurementId: "G-00PMV2RXDC"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, analytics };
