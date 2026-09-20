import { NextResponse } from "next/server";
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verifyRequestUser } from "@/firebase/admin";
import type { UserRole } from "@/lib/types";

/** Error con código HTTP para responder de forma uniforme desde los Route Handlers. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  console.error("Error inesperado en API:", e);
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}

export interface AuthedUser {
  uid: string;
  role: UserRole;
  organizationRef?: string;
  fullName?: string;
  data: FirebaseFirestore.DocumentData;
}

/**
 * Verifica el ID token, exige que la cuenta exista y NO esté suspendida, y
 * opcionalmente que tenga uno de los roles indicados.
 */
export async function requireUser(request: Request, roles?: UserRole[]): Promise<AuthedUser> {
  let uid: string;
  try {
    uid = (await verifyRequestUser(request)).uid;
  } catch {
    throw new HttpError(401, "No autenticado");
  }
  const snap = await adminDb().collection("users").doc(uid).get();
  const data = snap.data();
  if (!data) throw new HttpError(403, "Cuenta no encontrada");
  if (data.status === "suspended") throw new HttpError(403, "Cuenta suspendida");
  if (roles && !roles.includes(data.role)) throw new HttpError(403, "No autorizado");
  return { uid, role: data.role, organizationRef: data.organizationRef, fullName: data.fullName, data };
}

/**
 * Límite de llamadas por usuario y acción en una ventana de tiempo, guardado en
 * Firestore (`rateLimits`, cerrado a los clientes) para que funcione entre
 * instancias serverless. Lanza 429 al excederlo.
 */
// Contador en memoria por instancia: frena ráfagas del mismo usuario sin tocar
// Firestore (evita que un solo usuario genere contención en su documento).
const localHits = new Map<string, { windowStart: number; count: number }>();
const BURST_MAX_PER_10S = 20;

function localBurstCheck(uid: string, key: string) {
  const now = Date.now();
  const k = `${uid}_${key}`;
  const h = localHits.get(k);
  if (!h || now - h.windowStart > 10_000) {
    localHits.set(k, { windowStart: now, count: 1 });
    if (localHits.size > 5000) {
      for (const [kk, v] of localHits) if (now - v.windowStart > 10_000) localHits.delete(kk);
    }
    return true;
  }
  h.count++;
  return h.count <= BURST_MAX_PER_10S;
}

export async function enforceRateLimit(
  db: Firestore,
  uid: string,
  key: string,
  max: number,
  windowSec: number
) {
  const tooMany = new HttpError(429, "Demasiadas solicitudes. Intenta de nuevo más tarde.");
  if (!localBurstCheck(uid, key)) throw tooMany;

  const ref = db.collection("rateLimits").doc(`${uid}_${key}`);
  const now = Date.now();
  // Máx. 3 intentos y 4 s: si hay contención (uso abusivo) se responde 429 en vez de colgar la petición.
  const txn = db.runTransaction(
    async (tx) => {
      const snap = await tx.get(ref);
      const d = snap.data();
      if (!d || now - d.windowStart > windowSec * 1000) {
        tx.set(ref, { windowStart: now, count: 1, updatedAt: FieldValue.serverTimestamp() });
        return true;
      }
      if (d.count >= max) return false;
      tx.update(ref, { count: d.count + 1 });
      return true;
    },
    { maxAttempts: 3 }
  );
  const timeout = new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), 4000));
  let allowed: boolean | "timeout";
  try {
    allowed = await Promise.race([txn, timeout]);
  } catch {
    allowed = false;
  }
  if (allowed !== true) throw tooMany;
}
