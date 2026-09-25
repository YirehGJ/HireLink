import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { matchCandidateToJob } from "@/ai/flows/match-candidate-job-flow";

import { MATCH_THRESHOLD } from "@/lib/constants";
import { runAi } from "@/lib/server/ai-runner";
import { notifyUser } from "@/lib/server/notify";

const ENGINE_VERSION = "groq-gpt-oss-120b";

/**
 * Calcula con la IA la compatibilidad candidato ↔ vacante (perfil + CV analizado)
 * y guarda la recomendación. Si es la primera vez que hay un match fuerte:
 *  - queda "en espera" (status = pending) para que el reclutador lo acepte o rechace,
 *  - se avisa al candidato y a los reclutadores de la organización.
 * Al recalcular NO se pisa el estado ya decidido (aceptado/rechazado).
 */
export async function evaluateMatch(
  db: Firestore,
  candidateUid: string,
  candidate: FirebaseFirestore.DocumentData,
  jobId: string,
  job: FirebaseFirestore.DocumentData
) {
  const match = await runAi(() =>
    matchCandidateToJob({
      candidateHeadline: candidate.headline ?? "",
      candidateSkills: candidate.skills ?? [],
      candidateYearsOfExperience: candidate.yearsOfExperience ?? 0,
      candidateCvSummary: candidate.cvSummary,
      candidateCvText: candidate.cvText,
      jobTitle: job.title,
      jobDescriptionMd: job.descriptionMd,
      jobSearchTags: job.searchTags ?? [],
      jobSeniority: job.seniority,
    })
  );

  const recRef = db.collection("recommendations").doc(`${candidateUid}_${jobId}`);
  const existing = await recRef.get();

  if (existing.exists) {
    await recRef.update({
      score: match.score,
      reasons: match.reasons,
      engineVersion: ENGINE_VERSION,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await recRef.set({
      candidateRef: candidateUid,
      jobRef: jobId,
      score: match.score,
      reasons: match.reasons,
      status: "pending",
      engineVersion: ENGINE_VERSION,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (match.score >= MATCH_THRESHOLD) {
      const pct = `${(match.score * 100).toFixed(0)}%`;
      await notifyUser(db, candidateUid, {
        type: "new_recommendation",
        title: "Nueva recomendación de empleo",
        body: `${job.title} — ${pct} de compatibilidad. Está en espera de la revisión de la empresa.`,
        href: `/dashboard/jobs/${jobId}`,
      });

      const recruiters = await db
        .collection("users")
        .where("organizationRef", "==", job.organizationRef)
        .where("role", "==", "recruiter")
        .get();
      const name = candidate.fullName || candidate.headline || "Un candidato";
      await Promise.all(
        recruiters.docs.map((r) =>
          notifyUser(db, r.id, {
            type: "new_match",
            title: "Nuevo match en espera",
            body: `${name} es ${pct} compatible con "${job.title}". Acepta o rechaza el match.`,
            href: `/dashboard/jobs/${jobId}`,
          })
        )
      );
    }
  }

  return match;
}
