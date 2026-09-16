// src/firebase/provider.tsx
"use client";

import { createContext, useContext } from "react";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";

interface FirebaseContextValue {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

interface FirebaseProviderProps extends FirebaseContextValue {
  children: React.ReactNode;
}

/**
 * Provider component that makes Firebase services available to the rest of the app.
 */
export function FirebaseProvider({
  app,
  auth,
  firestore,
  storage,
  children,
}: FirebaseProviderProps) {
  const value = { app, auth, firestore, storage };
  return (
    <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>
  );
}

/**
 * Hook to access the raw Firebase context value (app, auth, firestore).
 * Throws an error if used outside of a FirebaseProvider.
 */
export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
}

/**
 * Hook to access the Firebase App instance.
 */
export function useFirebaseApp() {
  return useFirebase().app;
}

/**
 * Hook to access the Firebase Auth instance.
 */
export function useAuth() {
  return useFirebase().auth;
}

/**
 * Hook to access the Firestore instance.
 */
export function useFirestore() {
  return useFirebase().firestore;
}

/**
 * Hook to access the Firebase Storage instance.
 */
export function useStorage() {
  return useFirebase().storage;
}
