// src/firebase/firestore/use-doc.tsx
"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config";

export function useDoc<T = any>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    if (!path) { setData(null); setLoading(false); setError(null); return; }
    // `path` can flip from null to a real value after mount (e.g. once the
    // user's role finishes loading elsewhere), so reset loading here instead
    // of relying on useState's mount-only initial value.
    setLoading(true);
    setError(null);
    const ref = doc(db, path);
    const unsub = onSnapshot(
      ref,
      snap => {
        setData(snap.exists() ? (snap.data() as T) : null);
        setLoading(false);
      },
      err => {
        // Security rules that reference `resource.data` on a document that
        // doesn't exist yet (e.g. "have I applied?" checks) deny with
        // permission-denied instead of just returning no data. Without this
        // handler the listener would get stuck in `loading: true` forever.
        console.error(`Error fetching doc at path: ${path}`, err);
        setData(null);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [path]);
  return { data, loading, error };
}
