import { NextResponse } from "next/server";
import { adminDb, verifyRequestUser } from "@/firebase/admin";
import { matchCandidateToJob } from "@/ai/flows/match-candidate-job-flow";
import { FieldValue } from "firebase-admin/firestore";

// Tope para mantener acotado el costo/tiempo de una sola llamada.
const MAX_CANDIDATES = 40;

/**
 * @fileOverview Calcula, para una vacante, la compatibilidad de los candidatos
 * registrados (S21: "Candidatos recomendados"). Se dispara en segundo plano al
 * publicar/editar una vacante o desde el botón "Recalcular" del reclutador.
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
  const [userSnap, jobSnap] = await Promise.all([
    db.collection("users").doc(uid).get(),
    db.collection("jobs").doc(jobId).get(),
  ]);
  const caller = userSnap.data();
  const job = jobSnap.data();
  if (!caller || !job) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const authorized =
    caller.role === "admin" ||
    (caller.role === "recruiter" && caller.organizationRef === job.organizationRef);
  if (!authorized) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const candidatesSnap = await db.collection("candidates").limit(MAX_CANDIDATES).get();
  let processed = 0;

  for (const c of candidatesSnap.docs) {
    const candidate = c.data();
    if (!candidate.skills?.length && !candidate.headline) continue;
    try {
      const match = await matchCandidateToJob({
        candidateHeadline: candidate.headline ?? "",
        candidateSkills: candidate.skills ?? [],
        candidateYearsOfExperience: candidate.yearsOfExperience ?? 0,
        jobTitle: job.title,
        jobDescriptionMd: job.descriptionMd,
        jobSearchTags: job.searchTags ?? [],
        jobSeniority: job.seniority,
      });

      const recRef = db.collection("recommendations").doc(`${c.id}_${jobId}`);
      const existing = await recRef.get();
      await recRef.set({
        candidateRef: c.id,
        jobRef: jobId,
        score: match.score,
        reasons: match.reasons,
        engineVersion: "groq-gpt-oss-120b",
        createdAt: existing.exists ? existing.data()!.createdAt : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      if (!existing.exists && match.score >= 0.6) {
        await db.collection("users").doc(c.id).collection("notifications").add({
          type: "new_recommendation",
          title: "Nueva recomendación de empleo",
          body: `${job.title} — ${(match.score * 100).toFixed(0)}% de compatibilidad`,
          href: `/dashboard/jobs/${jobId}`,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      processed++;
    } catch (err) {
      console.error(`Error calculando match de ${c.id} para ${jobId}:`, err);
    }
  }

  return NextResponse.json({ processed });
}
