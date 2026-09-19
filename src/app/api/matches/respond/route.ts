import { NextResponse } from "next/server";
import { adminDb, verifyRequestUser } from "@/firebase/admin";
import { writeAuditLog } from "@/firebase/admin-audit";
import { FieldValue } from "firebase-admin/firestore";

/**
 * @fileOverview Ciclo de vida de un match generado por la IA.
 *
 *   pending (en espera) ──reclutador acepta──▶ accepted  (se abre la postulación)
 *                      ──reclutador rechaza──▶ rejected_by_recruiter
 *   cualquier estado  ──candidato rechaza───▶ rejected_by_candidate (en cualquier momento)
 *
 * Solo el servidor escribe `recommendations`, y aquí se verifica quién es el
 * que responde antes de aplicar el cambio.
 */
export async function POST(request: Request) {
  let uid: string;
  try {
    uid = (await verifyRequestUser(request)).uid;
  } catch {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { recId, action } = await request.json();
  if (!recId || !["accept", "reject"].includes(action)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const db = adminDb();
  const recRef = db.collection("recommendations").doc(recId);
  const [recSnap, callerSnap] = await Promise.all([recRef.get(), db.collection("users").doc(uid).get()]);
  const rec = recSnap.data();
  const caller = callerSnap.data();
  if (!rec || !caller) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const jobSnap = await db.collection("jobs").doc(rec.jobRef).get();
  const job = jobSnap.data();
  if (!job) return NextResponse.json({ error: "Vacante no encontrada" }, { status: 404 });

  const candidateUid: string = rec.candidateRef;
  const isCandidate = uid === candidateUid;
  const isCompany =
    caller.role === "admin" ||
    (caller.role === "recruiter" && caller.organizationRef === job.organizationRef);

  if (!isCandidate && !isCompany) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const current: string = rec.status ?? "pending";
  const now = FieldValue.serverTimestamp();
  const notify = (userId: string, data: { type: string; title: string; body: string; href: string }) =>
    db.collection("users").doc(userId).collection("notifications").add({ ...data, read: false, createdAt: now });

  const appRef = db.collection("jobs").doc(rec.jobRef).collection("applications").doc(candidateUid);
  const mirrorRef = db.collection("users").doc(candidateUid).collection("applications").doc(rec.jobRef);

  // ---- Candidato ----
  if (isCandidate && !isCompany) {
    if (action !== "reject") {
      return NextResponse.json({ error: "El candidato solo puede rechazar el match" }, { status: 403 });
    }
    await recRef.update({ status: "rejected_by_candidate", updatedAt: now });

    // Si el match ya se había convertido en postulación, se retira.
    const appSnap = await appRef.get();
    if (appSnap.exists && !["hired", "rejected", "withdrawn"].includes(appSnap.data()!.status)) {
      await appRef.update({ status: "withdrawn", updatedAt: now });
      if ((await mirrorRef.get()).exists) await mirrorRef.update({ status: "withdrawn", updatedAt: now });
    }

    const candSnap = await db.collection("candidates").doc(candidateUid).get();
    const name = candSnap.data()?.fullName || caller.fullName || "El candidato";
    const recruiters = await db
      .collection("users")
      .where("organizationRef", "==", job.organizationRef)
      .where("role", "==", "recruiter")
      .get();
    await Promise.all(
      recruiters.docs.map((r) =>
        notify(r.id, {
          type: "match_rejected_by_candidate",
          title: "Un candidato rechazó el match",
          body: `${name} rechazó el match con "${job.title}".`,
          href: `/dashboard/jobs/${rec.jobRef}`,
        })
      )
    );
    await writeAuditLog(db, uid, {
      action: "match_rejected_by_candidate",
      targetType: "match",
      targetId: recId,
      details: `Rechazó el match con "${job.title}"`,
    });
    return NextResponse.json({ ok: true, status: "rejected_by_candidate" });
  }

  // ---- Empresa (reclutador / admin) ----
  if (current === "rejected_by_candidate") {
    return NextResponse.json({ error: "El candidato ya rechazó este match" }, { status: 409 });
  }

  if (action === "reject") {
    await recRef.update({ status: "rejected_by_recruiter", updatedAt: now });
    await notify(candidateUid, {
      type: "match_rejected",
      title: "Actualización de tu match",
      body: `La empresa decidió no avanzar con tu match para "${job.title}".`,
      href: `/dashboard`,
    });
    await writeAuditLog(db, uid, {
      action: "match_rejected_by_recruiter",
      targetType: "match",
      targetId: recId,
      details: `Rechazó el match con "${job.title}"`,
    });
    return NextResponse.json({ ok: true, status: "rejected_by_recruiter" });
  }

  // accept: el match se convierte en una postulación en revisión.
  await recRef.update({ status: "accepted", updatedAt: now });
  const appSnap = await appRef.get();
  if (!appSnap.exists) {
    const base = {
      candidateRef: candidateUid,
      jobRef: rec.jobRef,
      status: "screening",
      source: "ai_match",
      cvRef: "",
      appliedAt: now,
      updatedAt: now,
    };
    await Promise.all([appRef.set(base), mirrorRef.set(base)]);
  } else if (appSnap.data()!.status === "withdrawn") {
    await appRef.update({ status: "screening", updatedAt: now });
    if ((await mirrorRef.get()).exists) await mirrorRef.update({ status: "screening", updatedAt: now });
  }

  await notify(candidateUid, {
    type: "match_accepted",
    title: "¡La empresa aceptó tu match!",
    body: `"${job.title}" quiere avanzar contigo. Revisa tus postulaciones.`,
    href: `/dashboard/applications`,
  });
  await writeAuditLog(db, uid, {
    action: "match_accepted",
    targetType: "match",
    targetId: recId,
    details: `Aceptó el match con "${job.title}"`,
  });
  return NextResponse.json({ ok: true, status: "accepted" });
}
