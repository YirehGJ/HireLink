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
  type CollectionReference,
  type Query,
  type WhereFilterOp,
} from "firebase/firestore";
import { useFirestore } from "../provider";

/** [campo, operador, valor] */
export type WhereClause = [string, WhereFilterOp, any];

interface UseCollectionOptions {
  /** Una condición o varias (todas se combinan con AND). */
  where?: WhereClause | WhereClause[];
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
  path: string | null,
  options: UseCollectionOptions = {}
): UseCollectionResult<T> {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore || !path) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      let q: Query | CollectionReference = collection(firestore, path);

      if (options.where) {
        const clauses: WhereClause[] = Array.isArray(options.where[0])
          ? (options.where as WhereClause[])
          : [options.where as WhereClause];
        for (const clause of clauses) q = query(q, where(...clause));
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
