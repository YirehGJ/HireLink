import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/firebase/admin";
import { writeAuditLog } from "@/firebase/admin-audit";
import { enforceRateLimit, errorResponse, HttpError, requireUser } from "@/lib/server/guard";
import { activeAdminCount, deleteAccountCascade } from "@/lib/server/user-admin";
import type { UserRole } from "@/lib/types";

export const maxDuration = 60;

const ROLES: UserRole[] = ["candidate", "recruiter", "admin"];
const ROLE_LABEL: Record<UserRole, string> = { admin: "Admin", recruiter: "Reclutador", candidate: "Candidato" };

/**
 * @fileOverview Operaciones de una administradora sobre otras cuentas: aprobar o revocar a una reclutadora,
 * suspender o reactivar, cambiar el rol o la organización y eliminar la cuenta con todo lo que depende de ella.
 * Se hacen aquí, con el SDK de administración, y no desde el navegador: así la auditoría no se puede omitir
 * ni declarar a medias, la suspensión deshabilita de verdad la cuenta de Authentication y se cuida que nunca
 * quede la plataforma sin una administradora activa. Las reglas de Firestore ya no dejan a ningún cliente
 * escribir el rol, el estado ni la aprobación.
 */
export async function POST(request: Request) {
  try {
    const caller = await requireUser(request, ["admin"]);
    const db = adminDb();
    const auth = adminAuth();
    await enforceRateLimit(db, caller.uid, "admin-users", 120, 3600);

    const body = await request.json().catch(() => null);
    const uid = typeof body?.uid === "string" ? body.uid : "";
    const action = typeof body?.action === "string" ? body.action : "";
    if (!uid || uid.includes("/")) throw new HttpError(400, "Falta uid");

    const userRef = db.collection("users").doc(uid);
    const target = (await userRef.get()).data();
    if (!target) throw new HttpError(404, "Usuario no encontrado");
    const isSelf = uid === caller.uid;
    const who = String(target.email ?? uid);
    const audit = (auditAction: string, details: string) =>
      writeAuditLog(db, caller.uid, { action: auditAction, targetType: "user", targetId: uid, details });
    const missingAuth = (e: any) => {
      // Cuentas sembradas o ya borradas de Authentication: el documento sigue siendo lo que manda.
      if (e?.code !== "auth/user-not-found") throw e;
    };
    /** Una administradora activa menos no puede dejar la plataforma sin ninguna. */
    const ensureAnotherAdmin = async () => {
      if (target.role === "admin" && target.status !== "suspended" && (await activeAdminCount(db)) <= 1) {
        throw new HttpError(409, "Es la única administradora activa: antes hay que nombrar a otra.");
      }
    };

    switch (action) {
      case "approve_recruiter":
      case "revoke_recruiter": {
        if (target.role !== "recruiter") throw new HttpError(400, "Solo se aprueba a reclutadoras");
        const approved = action === "approve_recruiter";
        await userRef.update({ recruiterApproved: approved });
        await audit("user_recruiter_approved", `${who} → ${approved ? "aprobada" : "aprobación revocada"}`);
        return NextResponse.json({ ok: true, recruiterApproved: approved });
      }

      case "suspend":
      case "reactivate": {
        if (isSelf) throw new HttpError(409, "No puedes suspender tu propia cuenta");
        const suspend = action === "suspend";
        if (suspend) await ensureAnotherAdmin();
        await userRef.update({ status: suspend ? "suspended" : "active" });
        // Además de la marca en Firestore, se deshabilita la cuenta y se revocan las sesiones abiertas.
        await auth.updateUser(uid, { disabled: suspend }).catch(missingAuth);
        if (suspend) await auth.revokeRefreshTokens(uid).catch(missingAuth);
        await audit("user_status_changed", `${who} → ${suspend ? "suspended" : "active"}`);
        return NextResponse.json({ ok: true, status: suspend ? "suspended" : "active" });
      }

      case "set_role": {
        const role = body?.role as UserRole;
        if (!ROLES.includes(role)) throw new HttpError(400, "Rol inválido");
        if (isSelf) throw new HttpError(409, "No puedes cambiar tu propio rol");
        if (role === target.role) return NextResponse.json({ ok: true, unchanged: true });
        if (role !== "admin") await ensureAnotherAdmin();
        const update: Record<string, unknown> = { role };
        if (role === "recruiter") {
          // La administradora que nombra a una reclutadora ya la está aprobando.
          update.recruiterApproved = true;
        } else {
          // Quien deja de ser reclutadora pierde su empresa y su aprobación (antes seguía leyendo sus postulaciones).
          update.organizationRef = FieldValue.delete();
          update.recruiterApproved = FieldValue.delete();
        }
        await userRef.update(update);
        await audit("user_role_changed", `${who}: ${ROLE_LABEL[target.role as UserRole] ?? target.role} → ${ROLE_LABEL[role]}`);
        return NextResponse.json({ ok: true, role });
      }

      case "set_organization": {
        if (target.role !== "recruiter") throw new HttpError(400, "Solo las reclutadoras tienen organización");
        const orgId = body?.organizationRef;
        if (orgId !== null && (typeof orgId !== "string" || !orgId || orgId.includes("/"))) {
          throw new HttpError(400, "Organización inválida");
        }
        let orgName = "sin organización";
        if (orgId) {
          const org = (await db.collection("organizations").doc(orgId).get()).data();
          if (!org) throw new HttpError(404, "La organización no existe");
          orgName = String(org.name ?? orgId);
        }
        await userRef.update({ organizationRef: orgId ?? FieldValue.delete() });
        await audit("user_organization_changed", `${who} → ${orgName}`);
        return NextResponse.json({ ok: true });
      }

      case "delete": {
        if (isSelf) throw new HttpError(409, "Para eliminar tu propia cuenta usa «Eliminar mi cuenta» en Configuración");
        await ensureAnotherAdmin();
        const removed = await deleteAccountCascade(db, auth, uid, target);
        await audit(
          "user_deleted",
          `${who} (${removed.applications} postulaciones, ${removed.recommendations} recomendaciones, ${removed.interviews} entrevistas y ${removed.jobs} vacantes eliminadas)`
        );
        return NextResponse.json({ ok: true, removed });
      }

      default:
        throw new HttpError(400, "Acción inválida");
    }
  } catch (e) {
    return errorResponse(e);
  }
}
