import { doc, setDoc, updateDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { ApplicationStatus } from "@/lib/types";

/**
 * @fileOverview Servicio para postulaciones. Viven como subcolección
 * de cada vacante: /jobs/{jobId}/applications/{appId}. Se usa el uid del
 * candidato como id del documento para que cada candidato tenga a lo sumo
 * una postulación por vacante (operación idempotente). Además se escribe una
 * copia en /users/{uid}/applications/{jobId} que el candidato escucha en
 * tiempo real sin necesitar índices collection-group.
 */

export const applicationService = {
  async applyToJob(firestore: Firestore, jobId: string, candidateUid: string, resumeRef?: string) {
    const batch = writeBatch(firestore);
    const base = {
      candidateRef: candidateUid,
      jobRef: jobId,
      status: "applied" as ApplicationStatus,
      source: "recommendation",
      cvRef: resumeRef ?? "",
      appliedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    batch.set(doc(firestore, "jobs", jobId, "applications", candidateUid), base);
    batch.set(doc(firestore, "users", candidateUid, "applications", jobId), base);
    await batch.commit();
    return candidateUid;
  },

  async updateStatus(firestore: Firestore, jobId: string, appId: string, status: ApplicationStatus) {
    const ref = doc(firestore, "jobs", jobId, "applications", appId);
    await updateDoc(ref, { status, updatedAt: serverTimestamp() });
  },

  /**
   * Notas privadas y shortlist de la reclutadora. Viven en `/jobs/{jobId}/applicantNotes/{appId}` y no en la
   * postulación, porque ese documento lo lee la propia candidata.
   */
  async updateRecruiterFields(
    firestore: Firestore,
    jobId: string,
    appId: string,
    data: { shortlisted?: boolean; recruiterNotes?: string }
  ) {
    const ref = doc(firestore, "jobs", jobId, "applicantNotes", appId);
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },
};
