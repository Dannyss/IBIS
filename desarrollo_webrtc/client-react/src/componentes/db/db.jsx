import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// 1. Configuración dinámica leída desde Vercel y tu .env.local
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 2. PATRÓN SINGLETON: Si la app ya existe en el navegador, la reutiliza. 
// Si no existe (es la primera vez), la inicializa limpia. Así nunca se duplica.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 3. Exportamos la base de datos limpia para tu App.jsx
export const db = getFirestore(app);
