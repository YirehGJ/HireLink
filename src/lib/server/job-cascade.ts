import type { DocumentReference, Firestore } from "firebase-admin/firestore";
import { notifyUser } from "@/lib/server/notify";

/** Postulaciones que ya no están en juego: no tiene sentido avisar de que la vacante desapareció. */
const CLOSED_STATUSES = ["rejected", "withdrawn", "hired"];

/** Borra documentos por lotes (Firestore admite 500 operaciones por lote; se usan 400 por margen). */
export async function deleteInBatches(db: Firestore, refs: DocumentReference[]) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = db.batch();
    refs.slice(i, i + 400).forEach((r) => batch.delete(r));
    await batch.commit();
  }
}

export interface JobCascadeResult {
  applications: number;
  notes: number;
  recommendations: number;
  interviews: number;
  notified: number;
}

/**
 * Elimina una vacante junto con todo lo que depende de ella. Firestore no borra las subcolecciones al eliminar
 * un documento, así que se borran aquí las postulaciones, sus copias en el perfil de cada candidata, las notas
 * privadas de la reclutadora, las recomendaciones y las entrevistas. Avisa a quienes tenían una postulación en
 * curso (salvo que `notify` sea falso). La usan `/api/jobs/delete` y la eliminación de cuentas.
 */
export async function deleteJobCascade(
  db: Firestore,
  jobId: string,
  job: FirebaseFirestore.DocumentData,
  notify = true
): Promise<JobCascadeResult> {
  const jobRef = db.collection("jobs").doc(jobId);
  const [appsSnap, notesSnap, recsSnap, interviewsSnap] = await Promise.all([
    jobRef.collection("applications").get(),
    jobRef.collection("applicantNotes").get(),
    db.collection("recommendations").where("jobRef", "==", jobId).get(),
    db.collection("interviews").where("jobRef", "==", jobId).get(),
  ]);

  // Avisa antes de borrar a quienes aún tenían una postulación activa.
  const toNotify = notify ? appsSnap.docs.filter((d) => !CLOSED_STATUSES.includes(d.data().status)) : [];
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

  await deleteInBatches(db, [
    ...appsSnap.docs.map((d) => d.ref),
    // Copia de cada candidato en /users/{uid}/applications/{jobId}
    ...appsSnap.docs.map((d) => db.doc(`users/${d.data().candidateRef ?? d.id}/applications/${jobId}`)),
    ...notesSnap.docs.map((d) => d.ref),
    ...recsSnap.docs.map((d) => d.ref),
    ...interviewsSnap.docs.map((d) => d.ref),
  ]);
  await jobRef.delete();

  return {
    applications: appsSnap.size,
    notes: notesSnap.size,
    recommendations: recsSnap.size,
    interviews: interviewsSnap.size,
    notified: toNotify.length,
  };
}
