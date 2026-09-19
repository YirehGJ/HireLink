import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

/**
 * @fileOverview Escribe un registro en `auditLogs` (solo servidor). El actor se
 * toma del ID token verificado, nunca del cuerpo de la solicitud, para que el
 * historial no se pueda falsificar desde el cliente.
 */
export async function writeAuditLog(
  db: Firestore,
  actorUid: string,
  entry: { action: string; targetType: string; targetId: string; details?: string }
) {
  const actorSnap = await db.collection("users").doc(actorUid).get();
  const actor = actorSnap.data();
  await db.collection("auditLogs").add({
    actorUid,
    actorEmail: actor?.email ?? "",
    actorRole: actor?.role ?? "candidate",
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    details: (entry.details ?? "").slice(0, 300),
    createdAt: FieldValue.serverTimestamp(),
  });
}
