import { NextResponse } from "next/server";
import type { DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin";
import { writeAuditLog } from "@/firebase/admin-audit";
import { enforceRateLimit, errorResponse, HttpError, requireUser } from "@/lib/server/guard";
import { notifyUser } from "@/lib/server/notify";

export const maxDuration = 60;

/** Postulaciones que ya no están en juego: no tiene sentido avisar de que la vacante desapareció. */
const CLOSED_STATUSES = ["rejected", "withdrawn", "hired"];

/**
 * @fileOverview Elimina una vacante junto con todo lo que depende de ella. Firestore no borra las
 * subcolecciones al eliminar un documento, así que antes quedaban sueltas las postulaciones, sus copias
 * en el perfil de cada candidato, las recomendaciones y las entrevistas: inflaban las métricas del
 * administrador y dejaban filas "Vacante eliminada" a los candidatos. Aquí se verifica que quien llama
 * sea un reclutador de la empresa dueña (o un admin), se avisa a los candidatos con una postulación en
 * curso, se borra todo y queda constancia en la auditoría.
 */
export async function POST(request: Request) {
  try {
    const caller = await requireUser(request, ["recruiter", "admin"]);
    const db = adminDb();
    await enforceRateLimit(db, caller.uid, "job-delete", 30, 3600);

    const body = await request.json().catch(() => null);
    const jobId = typeof body?.jobId === "string" ? body.jobId : "";
    if (!jobId || jobId.includes("/")) throw new HttpError(400, "Falta jobId");

    const jobRef = db.collection("jobs").doc(jobId);
    const job = (await jobRef.get()).data();
    if (!job) throw new HttpError(404, "Vacante no encontrada");

    const authorized =
      caller.role === "admin" ||
      (caller.role === "recruiter" && caller.organizationRef === job.organizationRef);
    if (!authorized) throw new HttpError(403, "No autorizado");

    const [appsSnap, recsSnap, interviewsSnap] = await Promise.all([
      jobRef.collection("applications").get(),
      db.collection("recommendations").where("jobRef", "==", jobId).get(),
      db.collection("interviews").where("jobRef", "==", jobId).get(),
    ]);

    // Avisa antes de borrar a quienes aún tenían una postulación activa.
    const toNotify = appsSnap.docs.filter((d) => !CLOSED_STATUSES.includes(d.data().status));
    await Promise.all(
      toNotify.map((d) =>
        notifyUser(db, d.data().candidateRef ?? d.id, {
          type: "job_removed",
          title: "Vacante ya no disponible",
          body: `La empresa eliminó la vacante "${job.title}", por lo que tu postulación se cerró.`,
          href: "/dashboard/explore",
        })
      )
    );

    const refs: DocumentReference[] = [
      ...appsSnap.docs.map((d) => d.ref),
      // Copia de cada candidato en /users/{uid}/applications/{jobId}
      ...appsSnap.docs.map((d) => db.doc(`users/${d.data().candidateRef ?? d.id}/applications/${jobId}`)),
      ...recsSnap.docs.map((d) => d.ref),
      ...interviewsSnap.docs.map((d) => d.ref),
    ];
    for (let i = 0; i < refs.length; i += 400) {
      const batch = db.batch();
      refs.slice(i, i + 400).forEach((r) => batch.delete(r));
      await batch.commit();
    }
    await jobRef.delete();

    await writeAuditLog(db, caller.uid, {
      action: "job_deleted",
      targetType: "job",
      targetId: jobId,
      details: `${job.title} (${appsSnap.size} postulaciones, ${recsSnap.size} recomendaciones y ${interviewsSnap.size} entrevistas eliminadas)`,
    });

    return NextResponse.json({
      ok: true,
      removed: { applications: appsSnap.size, recommendations: recsSnap.size, interviews: interviewsSnap.size },
      notified: toNotify.length,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
