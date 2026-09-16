import { NextResponse } from "next/server";
import { adminDb, verifyRequestUser } from "@/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

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

  const { jobId, candidateUid, newStatus } = await request.json();
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

  await db.collection("users").doc(candidateUid).collection("notifications").add({
    type: "application_status_changed",
    title: "Actualización de tu postulación",
    body: `${job.title}: ahora está en estado "${STATUS_LABEL[newStatus] ?? newStatus}"`,
    href: `/dashboard/jobs/${jobId}`,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
