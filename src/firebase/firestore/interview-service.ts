import { collection, deleteDoc, doc, serverTimestamp, Timestamp, writeBatch } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { ApplicationStatus, InterviewType } from "@/lib/types";

/**
 * @fileOverview Servicio para agendar entrevistas. Viven en la colección
 * top-level `interviews`; la regla de seguridad deja a la reclutadora aprobada de la
 * organización crearlas (solo para quien ya se postuló) y a la candidata leer las suyas.
 */

export interface InterviewInput {
  jobRef: string;
  jobTitle: string;
  organizationRef: string;
  candidateRef: string;
  candidateName: string;
  interviewerRef: string;
  type: InterviewType;
  scheduledStart: Date;
  location: string;
  notes?: string;
}

export const interviewService = {
  /**
   * Crea la entrevista y, en la MISMA operación, cambia el estado de la postulación (si se indica): o se guardan
   * las dos cosas o ninguna. Antes eran dos escrituras y, si fallaba la segunda, la entrevista quedaba creada
   * mientras la pantalla decía que no se pudo agendar (y reintentar la duplicaba).
   */
  async schedule(
    firestore: Firestore,
    data: InterviewInput,
    alsoSetStatus?: { jobId: string; appId: string; status: ApplicationStatus }
  ) {
    const { scheduledStart, notes, ...rest } = data;
    const batch = writeBatch(firestore);
    const ref = doc(collection(firestore, "interviews"));
    batch.set(ref, {
      ...rest,
      ...(notes ? { notes } : {}),
      scheduledStart: Timestamp.fromDate(scheduledStart),
      createdAt: serverTimestamp(),
    });
    if (alsoSetStatus) {
      batch.update(doc(firestore, "jobs", alsoSetStatus.jobId, "applications", alsoSetStatus.appId), {
        status: alsoSetStatus.status,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
    return ref.id;
  },

  async cancel(firestore: Firestore, interviewId: string) {
    await deleteDoc(doc(firestore, "interviews", interviewId));
  },
};
