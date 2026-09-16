// src/firebase/firestore/use-doc.tsx
"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config";

export function useDoc<T = any>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!path);
  useEffect(() => {
    if (!path) { setData(null); setLoading(false); return; }
    // `path` can flip from null to a real value after mount (e.g. once the
    // user's role finishes loading elsewhere), so reset loading here instead
    // of relying on useState's mount-only initial value.
    setLoading(true);
    const ref = doc(db, path);
    const unsub = onSnapshot(ref, snap => {
      setData(snap.exists() ? (snap.data() as T) : null);
      setLoading(false);
    });
    return () => unsub();
  }, [path]);
  return { data, loading };
}
