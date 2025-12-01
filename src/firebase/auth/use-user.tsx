// src/firebase/auth/use-user.tsx
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../config";

interface UseUserResult {
  user: User | null;
  loading: boolean;
}

/**
 * Hook to get the current authenticated user from Firebase.
 *
 * @returns An object containing the user and a loading state.
 */
export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { user, loading };
}
