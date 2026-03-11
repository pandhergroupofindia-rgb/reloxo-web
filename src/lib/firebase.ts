import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAdxUZP4-Yveo9AsSCDtsCX4ytg1395Bhc",
  authDomain: "reloxo-app.firebaseapp.com",
  projectId: "reloxo-app",
  storageBucket: "reloxo-app.firebasestorage.app",
  messagingSenderId: "333444322866",
  appId: "1:333444322866:web:c7b61850c80a237f81ce2b"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
