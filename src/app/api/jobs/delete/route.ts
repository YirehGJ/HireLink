import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";
import { writeAuditLog } from "@/firebase/admin-audit";
import { canManageOrg, enforceRateLimit, errorResponse, HttpError, requireUser } from "@/lib/server/guard";
import { deleteJobCascade } from "@/lib/server/job-cascade";

export const maxDuration = 60;

/**
 * @fileOverview Elimina una vacante junto con todo lo que depende de ella. Firestore no borra las
 * subcolecciones al eliminar un documento, así que antes quedaban sueltas las postulaciones, sus copias
 * en el perfil de cada candidato, las recomendaciones y las entrevistas: inflaban las métricas del
 * administrador y dejaban filas "Vacante eliminada" a los candidatos. Aquí se verifica que quien llama
 * sea una reclutadora aprobada de la empresa dueña (o un admin), se avisa a los candidatos con una
 * postulación en curso, se borra todo (ver `deleteJobCascade`) y queda constancia en la auditoría.
 */
export async function POST(request: Request) {
  try {
    const caller = await requireUser(request, ["recruiter", "admin"]);
    const db = adminDb();
    await enforceRateLimit(db, caller.uid, "job-delete", 30, 3600);

    const body = await request.json().catch(() => null);
    const jobId = typeof body?.jobId === "string" ? body.jobId : "";
    if (!jobId || jobId.includes("/")) throw new HttpError(400, "Falta jobId");

    const job = (await db.collection("jobs").doc(jobId).get()).data();
    if (!job) throw new HttpError(404, "Vacante no encontrada");

    if (!canManageOrg(caller, job.organizationRef)) throw new HttpError(403, "No autorizado");

    const removed = await deleteJobCascade(db, jobId, job);

    await writeAuditLog(db, caller.uid, {
      action: "job_deleted",
      targetType: "job",
      targetId: jobId,
      details: `${job.title} (${removed.applications} postulaciones, ${removed.recommendations} recomendaciones y ${removed.interviews} entrevistas eliminadas)`,
    });

    return NextResponse.json({
      ok: true,
      removed: { applications: removed.applications, recommendations: removed.recommendations, interviews: removed.interviews },
      notified: removed.notified,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
