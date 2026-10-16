import { addDoc, collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { Job, JobStatus } from "@/lib/types";

/**
 * @fileOverview Servicio para publicar, editar y cerrar vacantes.
 */

export type JobInput = Pick<
  Job,
  "title" | "location" | "seniority" | "remoteAllowed" | "descriptionMd" | "searchTags"
>;

export const jobService = {
  async createJob(firestore: Firestore, organizationRef: string, data: JobInput) {
    const ref = await addDoc(collection(firestore, "jobs"), {
      ...data,
      organizationRef,
      contractType: "Full-time",
      status: "published",
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  async updateJob(firestore: Firestore, jobId: string, data: Partial<JobInput>) {
    const ref = doc(firestore, "jobs", jobId);
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  /** Cierre/reapertura lógica: la vacante se conserva, solo cambia su estado. */
  async setStatus(firestore: Firestore, jobId: string, status: JobStatus) {
    const ref = doc(firestore, "jobs", jobId);
    await setDoc(ref, { status, updatedAt: serverTimestamp() }, { merge: true });
  },

  // La eliminación de una vacante se hace en el servidor (POST /api/jobs/delete), que además borra sus
  // postulaciones, recomendaciones y entrevistas. Borrar solo el documento dejaba datos huérfanos.
};
