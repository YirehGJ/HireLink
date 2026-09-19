import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { User, UserRole } from "@/lib/types";

/**
 * @fileOverview Servicio para la gestión de datos de usuario en Firestore.
 * Aplica el principio de responsabilidad única (SRP).
 */

export const userService = {
  /**
   * Asegura que un documento de usuario exista en Firestore.
   */
  async ensureProfileExists(
    firestore: Firestore,
    uid: string,
    email: string,
    fullName: string,
    requestedRole: UserRole = 'candidate'
  ): Promise<User> {
    const userDocRef = doc(firestore, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return { id: uid, ...userDoc.data() } as User;
    }

    // El rol admin nunca se asigna en el registro; solo otro admin puede otorgarlo.
    const role: UserRole = requestedRole === 'recruiter' ? 'recruiter' : 'candidate';

    const newUserProfile: User = {
      id: uid,
      email: email,
      fullName: fullName,
      role: role,
      status: "active",
    };

    await setDoc(userDocRef, newUserProfile);
    return newUserProfile;
  },

  /**
   * Actualiza los datos básicos del perfil.
   */
  async updateBasicProfile(
    firestore: Firestore,
    uid: string,
    data: Partial<Pick<User, 'fullName' | 'phone'>>
  ) {
    const userDocRef = doc(firestore, "users", uid);
    return updateDoc(userDocRef, data);
  },

  /**
   * Enlaza a un reclutador con la organización que acaba de crear.
   */
  async setOrganizationRef(firestore: Firestore, uid: string, organizationRef: string) {
    const userDocRef = doc(firestore, "users", uid);
    return updateDoc(userDocRef, { organizationRef });
  }
};
