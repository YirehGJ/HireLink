'use client';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config';

export interface CandidateProfile {
  title?: string;
  location?: string;
  yearsExperience?: number;
  available?: boolean;
  skills?: { name: string; years?: number; level?: number }[];
  // añade otros campos guardados
  [key: string]: any;
}

export function useCandidateProfile(userId: string | undefined) {
  const [data, setData] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(!!userId);

  useEffect(() => {
    if (!userId) { setData(null); setLoading(false); return; }
    const ref = doc(db, 'users', userId); // asegura que guardas ahí
    const unsub = onSnapshot(ref, snap => {
      setData(snap.exists() ? (snap.data() as CandidateProfile) : null);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  return { profile: data, loading };
}