import { NextResponse } from "next/server";
import { adminDb, verifyRequestUser } from "@/firebase/admin";
import { writeAuditLog } from "@/firebase/admin-audit";
import { FieldValue } from "firebase-admin/firestore";

/**
 * @fileOverview Cuando un candidato postula, avisa en tiempo real a todos los
 * reclutadores de la organización dueña de la vacante y deja el evento en la
 * auditoría. Verifica en el servidor que la postulación realmente exista y sea
 * del usuario autenticado.
 */
export async function POST(request: Request) {
  let uid: string;
  try {
    uid = (await verifyRequestUser(request)).uid;
  } catch {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { jobId } = await request.json();
  if (!jobId) return NextResponse.json({ error: "Falta jobId" }, { status: 400 });

  const db = adminDb();
  const [jobSnap, appSnap, candidateSnap] = await Promise.all([
    db.collection("jobs").doc(jobId).get(),
    db.collection("jobs").doc(jobId).collection("applications").doc(uid).get(),
    db.collection("candidates").doc(uid).get(),
  ]);

  const job = jobSnap.data();
  if (!job || !appSnap.exists) {
    return NextResponse.json({ error: "Postulación no encontrada" }, { status: 404 });
  }

  const candidateName =
    candidateSnap.data()?.fullName || candidateSnap.data()?.headline || "Un candidato";

  const recruiters = await db
    .collection("users")
    .where("organizationRef", "==", job.organizationRef)
    .where("role", "==", "recruiter")
    .get();

  await Promise.all(
    recruiters.docs.map((r) =>
      r.ref.collection("notifications").add({
        type: "new_application",
        title: "Nueva postulación",
        body: `${candidateName} aplicó a "${job.title}"`,
        href: `/dashboard/jobs/${jobId}`,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      })
    )
  );

  await writeAuditLog(db, uid, {
    action: "application_created",
    targetType: "application",
    targetId: `${jobId}/${uid}`,
    details: `Postulación a "${job.title}"`,
  });

  return NextResponse.json({ ok: true, notified: recruiters.size });
}
