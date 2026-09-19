"use client";

import { useMemo } from "react";
import type { Application } from "@/lib/types";
import { useCollection } from "./use-collection";

function toMillis(v: any): number {
  if (!v) return 0;
  if (typeof v.toMillis === "function") return v.toMillis();
  if (typeof v.seconds === "number") return v.seconds * 1000;
  return new Date(v).getTime() || 0;
}

/**
 * Escucha en tiempo real las postulaciones de un candidato leyendo su copia en
 * /users/{uid}/applications (no requiere índices), ordenadas de la más reciente.
 */
export function useCandidateApplications(candidateUid: string | null) {
  const { data, loading, error } = useCollection<Application>(
    candidateUid ? `users/${candidateUid}/applications` : null
  );

  const sorted = useMemo(
    () => (data ? [...data].sort((a, b) => toMillis(b.appliedAt) - toMillis(a.appliedAt)) : null),
    [data]
  );

  return { data: sorted, loading, error };
}
