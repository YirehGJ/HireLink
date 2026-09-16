"use client";

import { useEffect, useState } from "react";
import { collectionGroup, query, where, orderBy, onSnapshot } from "firebase/firestore";
import type { Application } from "@/lib/types";
import { useFirestore } from "../provider";

/**
 * Hook para escuchar en tiempo real todas las postulaciones de un candidato,
 * sin importar bajo qué vacante estén anidadas (usa una collectionGroup query).
 */
export function useCandidateApplications(candidateUid: string | null) {
  const firestore = useFirestore();
  const [data, setData] = useState<Application[] | null>(null);
  const [loading, setLoading] = useState(!!candidateUid);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore || !candidateUid) {
      setData(null);
      setLoading(false);
      return;
    }

    const q = query(
      collectionGroup(firestore, "applications"),
      where("candidateRef", "==", candidateUid),
      orderBy("appliedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Application)));
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching candidate applications:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, candidateUid]);

  return { data, loading, error };
}
