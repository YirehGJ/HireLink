"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useFirestore } from "../provider";

export interface AppNotification {
  id: string;
  type: "new_recommendation" | "application_status_changed";
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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, uid]);

  const markAsRead = async (notifId: string) => {
    if (!firestore || !uid) return;
    await updateDoc(doc(firestore, "users", uid, "notifications", notifId), { read: true });
  };

  return { data, loading, markAsRead };
}
