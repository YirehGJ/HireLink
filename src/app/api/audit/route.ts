import { NextResponse } from "next/server";
import { adminDb, verifyRequestUser } from "@/firebase/admin";
import { writeAuditLog } from "@/firebase/admin-audit";

const ALLOWED_ACTIONS = new Set([
  "job_created",
  "job_updated",
  "job_status_changed",
  "job_deleted",
  "user_role_changed",
  "user_status_changed",
  "user_organization_changed",
  "organization_created",
  "organization_updated",
  "interview_scheduled",
  "cv_analyzed",
]);

/**
 * Registra en `auditLogs` una acción relevante hecha desde el cliente
 * (creación/edición/eliminación de vacantes, cambios de rol o estado, etc.).
 */
export async function POST(request: Request) {
  let uid: string;
  try {
    uid = (await verifyRequestUser(request)).uid;
  } catch {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { action, targetType, targetId, details } = await request.json();
  if (!ALLOWED_ACTIONS.has(action) || !targetType || !targetId) {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  await writeAuditLog(adminDb(), uid, {
    action,
    targetType: String(targetType),
    targetId: String(targetId),
    details: details ? String(details) : "",
  });
  return NextResponse.json({ ok: true });
}
