"use client";

import { useEffect, useState } from "react";
import { collectionGroup, onSnapshot } from "firebase/firestore";
import type { Application } from "@/lib/types";
import { useFirestore } from "../provider";

/**
 * Solo admin: escucha todas las postulaciones de la plataforma
 * (/jobs/{jobId}/applications/*). Una collectionGroup sin filtros no requiere
 * índices; se descartan las copias en /users/{uid}/applications.
 */
export function useAllApplications(enabled: boolean) {
  const firestore = useFirestore();
  const [data, setData] = useState<Application[] | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!firestore || !enabled) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      collectionGroup(firestore, "applications"),
      (snap) => {
        setData(
          snap.docs
            .filter((d) => d.ref.path.startsWith("jobs/"))
            .map((d) => ({ id: d.id, ...d.data() } as Application))
        );
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching all applications:", err);
        setData([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [firestore, enabled]);

  return { data, loading };
}
