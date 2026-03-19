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

    // Lógica de negocio: emails específicos son admin
    const role: UserRole = email === 'admin@test.com' ? 'admin' : requestedRole;

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
  }
};
