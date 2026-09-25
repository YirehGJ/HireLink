import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";
import { writeAuditLog } from "@/firebase/admin-audit";
import { FieldValue } from "firebase-admin/firestore";
import { enforceRateLimit, errorResponse, HttpError, requireUser } from "@/lib/server/guard";
import { notifyUser } from "@/lib/server/notify";

/**
 * @fileOverview Cuando un candidato postula, avisa en tiempo real a todos los
 * reclutadores de la organización dueña de la vacante y deja el evento en la
 * auditoría. Verifica en el servidor que la postulación exista y sea del usuario
 * autenticado, y es idempotente (`notifiedAt`) para que no se pueda usar para
 * inundar de notificaciones a los reclutadores.
 */
export async function POST(request: Request) {
  try {
    const { uid } = await requireUser(request, ["candidate"]);
    const db = adminDb();
    await enforceRateLimit(db, uid, "notify-new", 60, 3600);

    const body = await request.json().catch(() => null);
    const jobId = typeof body?.jobId === "string" ? body.jobId : "";
    if (!jobId) throw new HttpError(400, "Falta jobId");

    const appRef = db.collection("jobs").doc(jobId).collection("applications").doc(uid);
    const [jobSnap, appSnap, candidateSnap] = await Promise.all([
      db.collection("jobs").doc(jobId).get(),
      appRef.get(),
      db.collection("candidates").doc(uid).get(),
    ]);

    const job = jobSnap.data();
    if (!job || !appSnap.exists) throw new HttpError(404, "Postulación no encontrada");
    if (appSnap.data()!.notifiedAt) return NextResponse.json({ ok: true, notified: 0, duplicate: true });

    // Marca primero para que llamadas concurrentes no dupliquen los avisos.
    await appRef.update({ notifiedAt: FieldValue.serverTimestamp() });

    const candidateName =
      candidateSnap.data()?.fullName || candidateSnap.data()?.headline || "Un candidato";

    const recruiters = await db
      .collection("users")
      .where("organizationRef", "==", job.organizationRef)
      .where("role", "==", "recruiter")
      .get();

    await Promise.all(
      recruiters.docs.map((r) =>
        notifyUser(db, r.id, {
          type: "new_application",
          title: "Nueva postulación",
          body: `${candidateName} aplicó a "${job.title}"`,
          href: `/dashboard/jobs/${jobId}`,
        })
      )
    );

    await writeAuditLog(db, uid, {
      action: "application_created",
      targetType: "application",
      targetId: `${jobId}/${uid}`,
      details: `Postulación a "${job.title}"`,
    });

    return NextResponse.json({ ok: true, notified: recruiters.size });
  } catch (e) {
    return errorResponse(e);
  }
}
