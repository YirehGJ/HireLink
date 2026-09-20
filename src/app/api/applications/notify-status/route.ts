import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { writeAuditLog } from "@/firebase/admin-audit";
import { enforceRateLimit, errorResponse, HttpError, requireUser } from "@/lib/server/guard";

const INTERVIEW_TYPE_LABEL: Record<string, string> = {
  phone: "llamada",
  video: "videollamada",
  onsite: "presencial",
};

const STATUS_LABEL: Record<string, string> = {
  applied: "Postulado",
  screening: "En Revisión",
  assessment: "Evaluación",
  interview: "Entrevista",
  offer: "Oferta",
  hired: "Contratado",
  rejected: "Rechazado",
  withdrawn: "Retirado",
};

/**
 * @fileOverview Notifica al candidato en tiempo real cuando un reclutador
 * cambia el estado de su postulación. La colección de notificaciones del
 * candidato solo admite escritura vía Admin SDK, así que este endpoint verifica
 * que quien llama sea el reclutador (activo) dueño de la vacante, que la
 * postulación exista y que su estado realmente sea el que se dice notificar —
 * así no se puede usar para mandar avisos falsos a usuarios arbitrarios.
 */
export async function POST(request: Request) {
  try {
    const caller = await requireUser(request, ["recruiter", "admin"]);
    const db = adminDb();
    await enforceRateLimit(db, caller.uid, "notify-status", 300, 3600);

    const body = await request.json().catch(() => null);
    const { jobId, candidateUid, newStatus, interviewAt, interviewType } = body ?? {};
    if (
      typeof jobId !== "string" || typeof candidateUid !== "string" ||
      typeof newStatus !== "string" || !STATUS_LABEL[newStatus]
    ) {
      throw new HttpError(400, "Parámetros inválidos");
    }

    const jobSnap = await db.collection("jobs").doc(jobId).get();
    const job = jobSnap.data();
    if (!job) throw new HttpError(404, "Vacante no encontrada");

    const isAuthorized =
      caller.role === "admin" ||
      (caller.role === "recruiter" && caller.organizationRef === job.organizationRef);
    if (!isAuthorized) throw new HttpError(403, "No autorizado");

    const appRef = db.collection("jobs").doc(jobId).collection("applications").doc(candidateUid);
    const appSnap = await appRef.get();
    if (!appSnap.exists) throw new HttpError(404, "Postulación no encontrada");
    if (appSnap.data()!.status !== newStatus) {
      throw new HttpError(409, "El estado de la postulación no coincide");
    }

    let interviewDate: Date | null = null;
    if (interviewAt !== undefined) {
      interviewDate = new Date(interviewAt);
      if (Number.isNaN(interviewDate.getTime())) throw new HttpError(400, "Fecha de entrevista inválida");
    }

    // Mantiene sincronizada la copia que el candidato lee en tiempo real.
    const mirrorRef = db.collection("users").doc(candidateUid).collection("applications").doc(jobId);
    if ((await mirrorRef.get()).exists) {
      await mirrorRef.update({ status: newStatus, updatedAt: FieldValue.serverTimestamp() });
    }

    const interviewBody = interviewDate
      ? `${job.title}: te agendaron una entrevista (${INTERVIEW_TYPE_LABEL[interviewType] ?? "entrevista"}) el ${interviewDate.toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" })}`
      : null;

    await db.collection("users").doc(candidateUid).collection("notifications").add({
      type: interviewBody ? "interview_scheduled" : "application_status_changed",
      title: interviewBody ? "Entrevista agendada" : "Actualización de tu postulación",
      body: interviewBody ?? `${job.title}: ahora está en estado "${STATUS_LABEL[newStatus]}"`,
      href: `/dashboard/applications`,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    await writeAuditLog(db, caller.uid, {
      action: interviewBody ? "interview_scheduled" : "application_status_changed",
      targetType: "application",
      targetId: `${jobId}/${candidateUid}`,
      details: interviewBody ?? `${job.title} → ${STATUS_LABEL[newStatus]}`,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
