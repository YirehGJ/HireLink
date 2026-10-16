import { createHash } from "crypto";
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { matchCandidateToJob } from "@/ai/flows/match-candidate-job-flow";
import { ENGINE_VERSION } from "@/ai/model";

import { MATCH_THRESHOLD } from "@/lib/constants";
import { runAi } from "@/lib/server/ai-runner";
import { notifyUser } from "@/lib/server/notify";

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Qué fracción de las habilidades que pide la vacante (`searchTags`) aparece en el perfil del candidato
 * (habilidades, titular, resumen o CV). Es una medida barata y sin IA que sirve solo para decidir A QUIÉN
 * EVALUAR PRIMERO: con el plan gratuito de Groq cada llamada alcanza a evaluar de 7 a 9 pares antes de
 * agotar el tiempo, y el orden anterior era el de los identificadores del documento, así que el candidato
 * ideal (por ejemplo, la desarrolladora iOS para una vacante de iOS) podía quedar fuera de la evaluación.
 */
export function overlapScore(job: FirebaseFirestore.DocumentData, candidate: FirebaseFirestore.DocumentData): number {
  const tags: string[] = (job.searchTags ?? []).map((t: string) => normalize(String(t))).filter(Boolean);
  if (tags.length === 0) return 0;
  const haystack = normalize(
    [
      candidate.headline,
      ...(candidate.skills ?? []).map((s: { name?: string }) => s?.name),
      candidate.cvSummary,
      String(candidate.cvText ?? "").slice(0, 3000),
    ]
      .filter(Boolean)
      .join(" ")
  );
  return tags.filter((t) => haystack.includes(t)).length / tags.length;
}

/**
 * Huella de todo lo que ve el modelo (perfil, CV, vacante y versión del motor). Si coincide con la guardada en
 * la recomendación, el puntaje anterior sigue siendo válido y se reutiliza SIN llamar a la IA. Antes cada
 * guardado del perfil y cada «Buscar candidatos» volvían a evaluar todos los pares aunque nada hubiera cambiado,
 * y con el cupo gratuito de Groq (200 000 tokens al día para toda la cuenta) bastaban unas decenas de guardados
 * para dejar la IA sin servicio durante el resto del día.
 */
const inputHash = (input: unknown) =>
  createHash("sha256").update(ENGINE_VERSION).update(JSON.stringify(input)).digest("hex").slice(0, 24);

/** Lo que ve el modelo para este par (candidato y vacante); de aquí sale la huella. */
function matchInput(candidate: FirebaseFirestore.DocumentData, job: FirebaseFirestore.DocumentData) {
  return {
    candidateHeadline: candidate.headline ?? "",
    candidateSkills: (candidate.skills ?? []).map((s: { name: string; level: number; years: number }) => ({
      name: s.name,
      level: s.level,
      years: s.years,
    })),
    candidateYearsOfExperience: candidate.yearsOfExperience ?? 0,
    candidateCvSummary: candidate.cvSummary,
    candidateCvText: candidate.cvText,
    jobTitle: job.title,
    jobDescriptionMd: job.descriptionMd,
    jobSearchTags: job.searchTags ?? [],
    jobSeniority: job.seniority,
  };
}

/** Huella del par candidato ↔ vacante tal como lo ve el modelo. */
export const matchHash = (candidate: FirebaseFirestore.DocumentData, job: FirebaseFirestore.DocumentData) =>
  inputHash(matchInput(candidate, job));

/** ¿La recomendación guardada sigue vigente? (el perfil y la vacante no cambiaron desde que se calculó). */
export const isUpToDate = (rec: FirebaseFirestore.DocumentData | undefined, hash: string) =>
  !!rec && rec.inputHash === hash && typeof rec.score === "number";

/**
 * Calcula con la IA la compatibilidad candidato ↔ vacante (perfil + CV analizado)
 * y guarda la recomendación. Si es la primera vez que hay un match fuerte:
 *  - queda "en espera" (status = pending) para que el reclutador lo acepte o rechace,
 *  - se avisa al candidato y a los reclutadores de la organización.
 * Al recalcular NO se pisa el estado ya decidido (aceptado/rechazado).
 * Si ni el perfil ni la vacante cambiaron desde el último cálculo, se devuelve el puntaje guardado (`cached`).
 */
export async function evaluateMatch(
  db: Firestore,
  candidateUid: string,
  candidate: FirebaseFirestore.DocumentData,
  jobId: string,
  job: FirebaseFirestore.DocumentData
) {
  const input = matchInput(candidate, job);
  const hash = inputHash(input);
  const recRef = db.collection("recommendations").doc(`${candidateUid}_${jobId}`);

  const previous = (await recRef.get()).data();
  if (previous && isUpToDate(previous, hash)) {
    return { score: previous.score as number, reasons: (previous.reasons ?? []) as string[], cached: true };
  }

  const match = { ...(await runAi(() => matchCandidateToJob(input))), cached: false };

  // La IA tarda decenas de segundos: si la vacante se eliminó mientras tanto, no se guarda una
  // recomendación huérfana (antes quedaban documentos de vacantes que ya no existían).
  if (!(await db.collection("jobs").doc(jobId).get()).exists) return match;

  const existing = await recRef.get();

  if (existing.exists) {
    await recRef.update({
      score: match.score,
      reasons: match.reasons,
      inputHash: hash,
      engineVersion: ENGINE_VERSION,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await recRef.set({
      candidateRef: candidateUid,
      jobRef: jobId,
      score: match.score,
      reasons: match.reasons,
      inputHash: hash,
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
