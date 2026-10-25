import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/firebase/admin";
import { writeAuditLog } from "@/firebase/admin-audit";
import { enforceRateLimit, errorResponse, HttpError, requireUser } from "@/lib/server/guard";
import { activeAdminCount, deleteAccountCascade } from "@/lib/server/user-admin";

export const maxDuration = 60;

/** La persona debe escribir esta palabra para confirmar (la pantalla la pide). */
const CONFIRM_WORD = "ELIMINAR";

/**
 * @fileOverview «Eliminar mi cuenta»: la propia persona borra su cuenta y todo lo que depende de ella (perfil,
 * postulaciones, notas, recomendaciones, entrevistas y avisos; si era la última reclutadora de su empresa, también
 * la empresa y sus vacantes). Es el derecho de cancelación del aviso de privacidad. La auditoría conserva el
 * registro de que la cuenta existió.
 */
export async function POST(request: Request) {
  try {
    const caller = await requireUser(request);
    const db = adminDb();
    await enforceRateLimit(db, caller.uid, "account-delete", 5, 3600);

    const body = await request.json().catch(() => null);
    if (body?.confirm !== CONFIRM_WORD) throw new HttpError(400, `Escribe ${CONFIRM_WORD} para confirmar`);
    if (caller.role === "admin" && (await activeAdminCount(db)) <= 1) {
      throw new HttpError(409, "Eres la única administradora activa: antes hay que nombrar a otra.");
    }

    // La auditoría se escribe antes: después ya no existiría el documento de la persona que actúa.
    await writeAuditLog(db, caller.uid, {
      action: "user_deleted",
      targetType: "user",
      targetId: caller.uid,
      details: `${caller.data.email ?? caller.uid} eliminó su propia cuenta`,
    });
    const removed = await deleteAccountCascade(db, adminAuth(), caller.uid, caller.data);
    return NextResponse.json({ ok: true, removed });
  } catch (e) {
    return errorResponse(e);
  }
}
