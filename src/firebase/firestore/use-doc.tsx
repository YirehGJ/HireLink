// src/firebase/firestore/use-doc.tsx
"use client";

import { useState, useEffect } from "react";
import { onSnapshot, doc, type Firestore } from "firebase/firestore";
import { useFirestore } from "../provider";

interface UseDocResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and listen to a Firestore document in real-time.
 *
 * @param path The path to the document.
 * @returns An object containing the data, loading state, and error.
 */
export function useDoc<T>(path: string): UseDocResult<T> {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore || !path) {
        setLoading(false);
        return;
    };

    const docRef = doc(firestore, path);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setData({ id: docSnapshot.id, ...docSnapshot.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error(`Error fetching document at path: ${path}`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, path]);

  return { data, loading, error };
}
