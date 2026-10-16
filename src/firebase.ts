import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyADFk75bvScT28rj8AukdvFeY0UhcgPVtM",
  authDomain: "alex-3dee0.firebaseapp.com",
  projectId: "alex-3dee0",
  storageBucket: "alex-3dee0.firebasestorage.app",
  messagingSenderId: "754491161459",
  appId: "1:754491161459:web:6437f3b6168290974b6306",
  measurementId: "G-NFED8NHYJN"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export default app;
