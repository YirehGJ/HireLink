import { addDoc, collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { Job } from "@/lib/types";

/**
 * @fileOverview Servicio para publicar y editar vacantes.
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
};
