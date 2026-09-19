import type { Auth } from "firebase/auth";
import { callAuthedApi } from "@/lib/api-client";

/**
 * Registra una acción en la auditoría (colección `auditLogs`, escrita por el
 * servidor). No bloquea la UI: si falla solo se deja constancia en consola.
 */
export function logAudit(
  auth: Auth | null | undefined,
  entry: { action: string; targetType: string; targetId: string; details?: string }
) {
  if (!auth) return;
  callAuthedApi(auth, "/api/audit", entry).catch((err) =>
    console.error("No se pudo registrar la auditoría:", err)
  );
}
