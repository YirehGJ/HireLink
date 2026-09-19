import { NextResponse } from "next/server";
import { adminDb, verifyRequestUser } from "@/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { writeAuditLog } from "@/firebase/admin-audit";

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
 * candidato solo admite escritura vía Admin SDK, así que este endpoint
 * verifica que quien llama sea realmente el reclutador dueño de la vacante
 * antes de escribir en nombre del sistema.
 */
export async function POST(request: Request) {
  let recruiterUid: string;
  try {
    const decoded = await verifyRequestUser(request);
    recruiterUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { jobId, candidateUid, newStatus, interviewAt, interviewType } = await request.json();
  if (!jobId || !candidateUid || !newStatus) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const db = adminDb();

  const [recruiterSnap, jobSnap] = await Promise.all([
    db.collection("users").doc(recruiterUid).get(),
    db.collection("jobs").doc(jobId).get(),
  ]);

  const recruiter = recruiterSnap.data();
  const job = jobSnap.data();
  if (!recruiter || !job) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const isAuthorized =
    recruiter.role === "admin" ||
    (recruiter.role === "recruiter" && recruiter.organizationRef === job.organizationRef);

  if (!isAuthorized) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Mantiene sincronizada la copia que el candidato lee en tiempo real.
  const mirrorRef = db.collection("users").doc(candidateUid).collection("applications").doc(jobId);
  if ((await mirrorRef.get()).exists) {
    await mirrorRef.update({ status: newStatus, updatedAt: FieldValue.serverTimestamp() });
  }

  const interviewBody =
    interviewAt
      ? `${job.title}: te agendaron una entrevista (${INTERVIEW_TYPE_LABEL[interviewType] ?? "entrevista"}) el ${new Date(interviewAt).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" })}`
      : null;

  await db.collection("users").doc(candidateUid).collection("notifications").add({
    type: interviewBody ? "interview_scheduled" : "application_status_changed",
    title: interviewBody ? "Entrevista agendada" : "Actualización de tu postulación",
    body: interviewBody ?? `${job.title}: ahora está en estado "${STATUS_LABEL[newStatus] ?? newStatus}"`,
    href: `/dashboard/applications`,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  await writeAuditLog(db, recruiterUid, {
    action: interviewBody ? "interview_scheduled" : "application_status_changed",
    targetType: "application",
    targetId: `${jobId}/${candidateUid}`,
    details: interviewBody ? interviewBody : `${job.title} → ${STATUS_LABEL[newStatus] ?? newStatus}`,
  });

  return NextResponse.json({ ok: true });
}
