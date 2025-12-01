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
    const ref = doc(db, path);
    const unsub = onSnapshot(ref, snap => {
      setData(snap.exists() ? (snap.data() as T) : null);
      setLoading(false);
    });
    return () => unsub();
  }, [path]);
  return { data, loading };
}
