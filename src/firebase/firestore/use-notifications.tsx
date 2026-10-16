"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";
import { useFirestore } from "../provider";

export interface AppNotification {
  id: string;
  type:
    | "new_recommendation"
    | "new_match"
    | "match_accepted"
    | "match_rejected"
    | "match_rejected_by_candidate"
    | "application_status_changed"
    | "interview_scheduled"
    | "interview_cancelled"
    | "job_removed"
    | "new_application";
  title: string;
  body: string;
  read: boolean;
  createdAt: any;
  href?: string;
}

/**
 * Escucha en tiempo real las notificaciones del usuario (generadas por el
 * backend vía Admin SDK en /users/{uid}/notifications).
 */
export function useNotifications(uid: string | null) {
  const firestore = useFirestore();
  const [data, setData] = useState<AppNotification[] | null>(null);
  const [loading, setLoading] = useState(!!uid);

  useEffect(() => {
    if (!firestore || !uid) {
      setData(null);
      setLoading(false);
      return;
    }

    const q = query(
      collection(firestore, "users", uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)));
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching notifications:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, uid]);

  const markAsRead = async (notifId: string) => {
    if (!firestore || !uid) return;
    await updateDoc(doc(firestore, "users", uid, "notifications", notifId), { read: true });
  };

  /** Marca como leídas, en una sola operación, todas las notificaciones pendientes. */
  const markAllAsRead = async () => {
    if (!firestore || !uid || !data) return;
    const unread = data.filter((n) => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(firestore);
    unread.forEach((n) => batch.update(doc(firestore, "users", uid, "notifications", n.id), { read: true }));
    await batch.commit();
  };

  return { data, loading, markAsRead, markAllAsRead };
}
