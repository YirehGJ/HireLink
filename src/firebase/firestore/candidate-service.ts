import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { Candidate } from "@/lib/types";

/**
 * @fileOverview Servicio para el perfil profesional del candidato.
 * El documento de `candidates/{uid}` usa el uid del usuario como id,
 * consistente con la regla de seguridad `isOwner(candidateId)`.
 */

export type CandidateProfileInput = Pick<
  Candidate,
  "headline" | "location" | "yearsOfExperience" | "available" | "skills"
> & { resumeRef?: string; fullName?: string; email?: string; cvSummary?: string; cvText?: string };

export const candidateService = {
  async saveProfile(firestore: Firestore, uid: string, data: CandidateProfileInput) {
    const ref = doc(firestore, "candidates", uid);
    // Firestore's setDoc rejects `undefined` field values, so drop resumeRef
    // entirely when no CV has been uploaded yet instead of sending it as undefined.
    const { resumeRef, fullName, email, cvSummary, cvText, ...rest } = data;
    await setDoc(
      ref,
      {
        userRef: uid,
        // Nombre y correo visibles para los reclutadores (botón "Contactar").
        ...(fullName ? { fullName } : {}),
        ...(email ? { email } : {}),
        ...(cvSummary ? { cvSummary } : {}),
        ...(cvText ? { cvText } : {}),
        ...rest,
        ...(resumeRef !== undefined ? { resumeRef } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },
};
