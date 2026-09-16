import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { ApplicationStatus } from "@/lib/types";

/**
 * @fileOverview Servicio para postulaciones. Viven como subcolección
 * de cada vacante: /jobs/{jobId}/applications/{appId}. Se usa el uid del
 * candidato como id del documento para que cada candidato tenga a lo sumo
 * una postulación por vacante (operación idempotente).
 */

export const applicationService = {
  async applyToJob(firestore: Firestore, jobId: string, candidateUid: string, resumeRef?: string) {
    const ref = doc(firestore, "jobs", jobId, "applications", candidateUid);
    await setDoc(ref, {
      candidateRef: candidateUid,
      jobRef: jobId,
      status: "applied" as ApplicationStatus,
      source: "recommendation",
      cvRef: resumeRef ?? "",
      appliedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return candidateUid;
  },

  async updateStatus(firestore: Firestore, jobId: string, appId: string, status: ApplicationStatus) {
    const ref = doc(firestore, "jobs", jobId, "applications", appId);
    await updateDoc(ref, { status, updatedAt: serverTimestamp() });
  },
};
