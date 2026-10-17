// src/firebase/index.ts
import { app, auth, db } from "./config";

/**
 * Devuelve la app, Authentication y Firestore. Todo se inicializa una sola vez en `./config`.
 * (Storage ya no se carga: el PDF del CV no se sube, ver docs/DECISION_STORAGE_CV.md.)
 */
export function initializeFirebase() {
  return { app, auth, firestore: db };
}

// Export providers and hooks for easy access
export { FirebaseProvider, useFirebase, useFirebaseApp, useAuth, useFirestore } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useCandidateApplications } from './firestore/use-candidate-applications';
export { useAllApplications } from './firestore/use-all-applications';
