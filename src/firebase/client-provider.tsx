// src/firebase/client-provider.tsx
"use client";

import { useMemo } from "react";
import { FirebaseProvider } from "./provider";
import { initializeFirebase } from ".";

/**
 * Provides the Firebase app, auth, and firestore instances to the client components.
 * This ensures that Firebase is initialized only once on the client.
 */
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { app, auth, firestore } = useMemo(initializeFirebase, []);

  return (
    <FirebaseProvider app={app} auth={auth} firestore={firestore}>
      {children}
    </FirebaseProvider>
  );
}
