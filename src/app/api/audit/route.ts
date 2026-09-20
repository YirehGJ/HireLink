import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";
import { writeAuditLog } from "@/firebase/admin-audit";
import { enforceRateLimit, errorResponse, HttpError, requireUser } from "@/lib/server/guard";
import type { UserRole } from "@/lib/types";

const RECRUITER_ACTIONS = [
  "job_created",
  "job_updated",
  "job_status_changed",
  "job_deleted",
  "organization_created",
  "organization_updated",
];
const ADMIN_ONLY_ACTIONS = ["user_role_changed", "user_status_changed", "user_organization_changed"];

/** Qué acciones puede registrar cada rol (un candidato no puede fabricar eventos de admin). */
const ALLOWED: Record<UserRole, Set<string>> = {
  candidate: new Set<string>(),
  recruiter: new Set(RECRUITER_ACTIONS),
  admin: new Set([...RECRUITER_ACTIONS, ...ADMIN_ONLY_ACTIONS]),
};

/**
 * Registra en `auditLogs` una acción relevante hecha desde el cliente. El actor
 * sale del token verificado; la acción debe estar permitida para su rol.
 */
export async function POST(request: Request) {
  try {
    const { uid, role } = await requireUser(request);
    const db = adminDb();
    await enforceRateLimit(db, uid, "audit", 120, 3600);

    const body = await request.json().catch(() => null);
    const { action, targetType, targetId, details } = body ?? {};
    if (typeof action !== "string" || !ALLOWED[role].has(action)) {
      throw new HttpError(403, "Acción no permitida para tu rol");
    }
    if (typeof targetType !== "string" || typeof targetId !== "string" || !targetType || !targetId) {
      throw new HttpError(400, "Parámetros inválidos");
    }

    await writeAuditLog(db, uid, {
      action,
      targetType: targetType.slice(0, 40),
      targetId: targetId.slice(0, 200),
      details: typeof details === "string" ? details : "",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
