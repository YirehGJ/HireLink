import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import { deleteInBatches, deleteJobCascade } from "@/lib/server/job-cascade";

/**
 * @fileOverview Operaciones de servidor sobre cuentas: contar administradoras activas y eliminar una cuenta
 * con todo lo que depende de ella. Las usan `/api/admin/users` (administradora) y `/api/account/delete`
 * (la propia persona).
 */

/** Cuántas administradoras activas hay (no se puede dejar la plataforma sin ninguna). */
export async function activeAdminCount(db: Firestore): Promise<number> {
  const snap = await db.collection("users").where("role", "==", "admin").get();
  return snap.docs.filter((d) => d.data().status !== "suspended").length;
}

export interface AccountCascadeResult {
  applications: number;
  recommendations: number;
  interviews: number;
  /** Vacantes eliminadas junto con la empresa (solo si era la última reclutadora de su organización). */
  jobs: number;
}

/**
 * Elimina una cuenta y lo que depende de ella: perfil de candidata, postulaciones (y sus notas), recomendaciones,
 * entrevistas, avisos y preferencias; si era la última reclutadora de su empresa, también la empresa y sus
 * vacantes. Corta el acceso primero (cuenta de Auth deshabilitada y sesiones revocadas), borra los datos y al
 * final elimina la cuenta de Auth: si algo falla a la mitad, se puede repetir sin consecuencias.
 *
 * La auditoría conserva el registro de que la cuenta existió; no se borra.
 */
export async function deleteAccountCascade(
  db: Firestore,
  auth: Auth,
  uid: string,
  user: FirebaseFirestore.DocumentData
): Promise<AccountCascadeResult> {
  const ignoreMissing = (e: any) => {
    if (e?.code !== "auth/user-not-found") throw e;
  };

  // 1) Corta el acceso de inmediato.
  await auth.updateUser(uid, { disabled: true }).catch(ignoreMissing);
  await auth.revokeRefreshTokens(uid).catch(ignoreMissing);

  // 2) Postulaciones: la copia del perfil dice a qué vacantes se postuló (el id del documento es la vacante).
  const mirrorSnap = await db.collection("users").doc(uid).collection("applications").get();
  const appRefs = mirrorSnap.docs.flatMap((d) => [
    db.doc(`jobs/${d.id}/applications/${uid}`),
    db.doc(`jobs/${d.id}/applicantNotes/${uid}`),
  ]);

  const [recsSnap, interviewsSnap, notificationsSnap, settingsSnap, skillsSnap] = await Promise.all([
    db.collection("recommendations").where("candidateRef", "==", uid).get(),
    db.collection("interviews").where("candidateRef", "==", uid).get(),
    db.collection("users").doc(uid).collection("notifications").get(),
    db.collection("users").doc(uid).collection("settings").get(),
    db.collection("candidates").doc(uid).collection("skills").get(),
  ]);

  await deleteInBatches(db, [
    ...appRefs,
    ...mirrorSnap.docs.map((d) => d.ref),
    ...recsSnap.docs.map((d) => d.ref),
    ...interviewsSnap.docs.map((d) => d.ref),
    ...notificationsSnap.docs.map((d) => d.ref),
    ...settingsSnap.docs.map((d) => d.ref),
    ...skillsSnap.docs.map((d) => d.ref),
    db.doc(`candidates/${uid}`),
  ]);

  // 3) Si era la última reclutadora de su empresa, se va la empresa con sus vacantes.
  let jobs = 0;
  const orgId = typeof user.organizationRef === "string" ? user.organizationRef : "";
  if (user.role === "recruiter" && orgId) {
    const members = await db.collection("users").where("organizationRef", "==", orgId).get();
    if (members.docs.every((d) => d.id === uid)) {
      const jobsSnap = await db.collection("jobs").where("organizationRef", "==", orgId).get();
      for (const j of jobsSnap.docs) {
        await deleteJobCascade(db, j.id, j.data());
        jobs++;
      }
      await db.doc(`organizations/${orgId}`).delete();
    }
  }

  // 4) Por último, el documento de usuario y la cuenta de Auth.
  await db.doc(`users/${uid}`).delete();
  await auth.deleteUser(uid).catch(ignoreMissing);

  return {
    applications: mirrorSnap.size,
    recommendations: recsSnap.size,
    interviews: interviewsSnap.size,
    jobs,
  };
}
