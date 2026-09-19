import { addDoc, collection, deleteDoc, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { InterviewType } from "@/lib/types";

/**
 * @fileOverview Servicio para agendar entrevistas. Viven en la colección
 * top-level `interviews`; la regla de seguridad deja al reclutador de la
 * organización crearlas y al candidato leer las suyas.
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
  async schedule(firestore: Firestore, data: InterviewInput) {
    const { scheduledStart, notes, ...rest } = data;
    const ref = await addDoc(collection(firestore, "interviews"), {
      ...rest,
      ...(notes ? { notes } : {}),
      scheduledStart: Timestamp.fromDate(scheduledStart),
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  async cancel(firestore: Firestore, interviewId: string) {
    await deleteDoc(doc(firestore, "interviews", interviewId));
  },
};
