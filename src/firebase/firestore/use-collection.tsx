// src/firebase/firestore/use-collection.tsx
"use client";

import { useState, useEffect } from "react";
import {
  onSnapshot,
  query,
  collection,
  where,
  orderBy,
  limit,
  startAfter,
  type Firestore,
  type CollectionReference,
  type Query,
} from "firebase/firestore";
import { useFirestore } from "../provider";

interface UseCollectionOptions {
  where?: [string, any, any];
  orderBy?: [string, "asc" | "desc"];
  limit?: number;
  startAfter?: any;
}

interface UseCollectionResult<T> {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and listen to a Firestore collection in real-time.
 *
 * @param path The path to the collection.
 * @param options Optional query constraints.
 * @returns An object containing the data, loading state, and error.
 */
export function useCollection<T>(
  path: string,
  options: UseCollectionOptions = {}
): UseCollectionResult<T> {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore) return;

    try {
      let q: Query | CollectionReference = collection(firestore, path);

      if (options.where) {
        q = query(q, where(...options.where));
      }
      if (options.orderBy) {
        q = query(q, orderBy(...options.orderBy));
      }
      if (options.limit) {
        q = query(q, limit(options.limit));
      }
      if (options.startAfter) {
        q = query(q, startAfter(options.startAfter));
      }

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const docs = querySnapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as T)
          );
          setData(docs);
          setLoading(false);
        },
        (err) => {
          console.error(`Error fetching collection at path: ${path}`, err);
          setError(err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
        console.error(`Error building query for path: ${path}`, err);
        setError(err);
        setLoading(false);
        return;
    }
  }, [firestore, path, JSON.stringify(options)]); // Poor man's deep-equal

  return { data, loading, error };
}
