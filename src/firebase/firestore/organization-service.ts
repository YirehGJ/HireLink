import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

/**
 * @fileOverview Servicio para el perfil de la organización del reclutador.
 */

export interface OrganizationInput {
  name: string;
  website?: string;
  description?: string;
  logoUrl?: string;
}

export const organizationService = {
  /**
   * Guarda los datos de una organización existente.
   */
  async updateOrganization(firestore: Firestore, orgId: string, data: OrganizationInput) {
    const ref = doc(firestore, "organizations", orgId);
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  /**
   * Crea una organización nueva (para un reclutador que aún no tiene una)
   * y devuelve su id para enlazarla al usuario vía `organizationRef`.
   */
  async createOrganization(firestore: Firestore, data: OrganizationInput) {
    const ref = await addDoc(collection(firestore, "organizations"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },
};
