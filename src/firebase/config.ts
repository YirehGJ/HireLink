// src/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FB_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FB_MEASUREMENT_ID,
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

/**
 * Authentication sin el «popupRedirectResolver» por defecto. `getAuth()` lo incluye y, al arrancar, carga un iframe de
 * Google (`/__/auth/iframe` y `gapi`, unos 130 kB y varias solicitudes) en CADA página, aunque la persona nunca use
 * «Continuar con Google». Aquí la sesión se restaura sin ese iframe y el resolvedor se pasa solo cuando se pulsa el botón
 * de Google (ver `signInWithPopup(..., browserPopupRedirectResolver)` en login y registro).
 */
function createAuth(): Auth {
  if (typeof window === 'undefined') return getAuth(app); // servidor: sin almacenamiento del navegador
  try {
    return initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
    });
  } catch {
    return getAuth(app); // ya estaba inicializado (recarga en caliente)
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
