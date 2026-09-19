import { NextResponse } from "next/server";
import { adminDb, verifyRequestUser } from "@/firebase/admin";
import { matchCandidateToJob } from "@/ai/flows/match-candidate-job-flow";
import { FieldValue } from "firebase-admin/firestore";

/**
 * @fileOverview Módulo de Sistemas Inteligentes + Sistemas Distribuidos.
 *
 * Se dispara de forma asíncrona (fire-and-forget) después de que un candidato
 * guarda su perfil, para no bloquear la UI. Corre server-side con el Admin SDK
 * porque la colección `recommendations` no admite escritura desde el cliente.
 *
 * Requiere las credenciales de servicio descritas en src/firebase/admin.ts.
 */
export async function POST(request: Request) {
  let uid: string;
  try {
    const decoded = await verifyRequestUser(request);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const db = adminDb();

  const candidateSnap = await db.collection("candidates").doc(uid).get();
  if (!candidateSnap.exists) {
    return NextResponse.json({ error: "Perfil de candidato no encontrado" }, { status: 404 });
  }
  const candidate = candidateSnap.data()!;

  const jobsSnap = await db.collection("jobs").where("status", "==", "published").get();

  const results: { jobId: string; score: number }[] = [];

  for (const jobDoc of jobsSnap.docs) {
    const job = jobDoc.data();
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

      const recId = `${uid}_${jobDoc.id}`;
      const recRef = db.collection("recommendations").doc(recId);
      const existing = await recRef.get();

      await recRef.set({
        candidateRef: uid,
        jobRef: jobDoc.id,
        score: match.score,
        reasons: match.reasons,
        engineVersion: "groq-gpt-oss-120b",
        createdAt: existing.exists ? existing.data()!.createdAt : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Notifica solo la primera vez que aparece una recomendación fuerte.
      if (!existing.exists && match.score >= 0.6) {
        await db.collection("users").doc(uid).collection("notifications").add({
          type: "new_recommendation",
          title: "Nueva recomendación de empleo",
          body: `${job.title} — ${(match.score * 100).toFixed(0)}% de compatibilidad`,
          href: `/dashboard/jobs/${jobDoc.id}`,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      results.push({ jobId: jobDoc.id, score: match.score });
    } catch (err) {
      console.error(`Error calculando match para job ${jobDoc.id}:`, err);
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
