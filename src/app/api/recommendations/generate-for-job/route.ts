import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";
import { evaluateMatch, isUpToDate, matchHash, overlapScore } from "@/lib/server/matching";
import { mapWithConcurrency } from "@/lib/server/concurrency";
import { enforceRateLimit, errorResponse, HttpError, requireUser } from "@/lib/server/guard";

// Máximo permitido en el plan gratuito de Vercel; evita que la función se corte a la mitad.
export const maxDuration = 60;

// Tope para mantener acotado el costo/tiempo de una sola llamada.
const MAX_CANDIDATES = 40;
// Candidatos que se leen para elegir a quién evaluar primero (lectura barata; la IA solo ve a los elegidos).
const RANK_POOL = 200;

// El plan gratuito de Groq limita los tokens por minuto: pasado este tiempo no se lanzan
// evaluaciones nuevas, para responder antes de que Vercel corte la función (60 s).
const TIME_BUDGET_MS = 30_000;
const HARD_LIMIT_MS = 52_000;

/**
 * @fileOverview Calcula, para una vacante, la compatibilidad de los candidatos
 * registrados (S21: "Candidatos recomendados"). Se dispara en segundo plano al
 * publicar/editar una vacante o desde el botón "Buscar candidatos" del reclutador.
 */
export async function POST(request: Request) {
  try {
    const caller = await requireUser(request, ["recruiter", "admin"]);
    const db = adminDb();
    await enforceRateLimit(db, caller.uid, "gen-for-job", 15, 3600);

    const body = await request.json().catch(() => null);
    const jobId = typeof body?.jobId === "string" ? body.jobId : "";
    if (!jobId) throw new HttpError(400, "Falta jobId");

    const job = (await db.collection("jobs").doc(jobId).get()).data();
    if (!job) throw new HttpError(404, "Vacante no encontrada");

    const authorized =
      caller.role === "admin" ||
      (caller.role === "recruiter" && caller.organizationRef === job.organizationRef);
    if (!authorized) throw new HttpError(403, "No autorizado");
    if (job.status !== "published") throw new HttpError(409, "Solo se buscan candidatos para vacantes publicadas");

    // Se leen más candidatos de los que se alcanzan a evaluar para poder elegir a los mejores: primero los que
    // aún no tienen recomendación y, dentro de cada grupo, los que más coinciden con las habilidades de la
    // vacante. Así el tiempo limitado de la IA se gasta en los candidatos plausibles.
    const candidatesSnap = await db.collection("candidates").limit(RANK_POOL).get();
    const existing = await db.collection("recommendations").where("jobRef", "==", jobId).get();
    const known = new Map(existing.docs.map((d) => [d.data().candidateRef as string, d.data()]));
    // Los puntajes vigentes (perfil y vacante sin cambios desde que se calcularon) se reutilizan sin llamar a la
    // IA: no gastan tokens ni tiempo, así que no cuentan contra el presupuesto de la llamada.
    const evaluable = candidatesSnap.docs.filter((d) => d.data().skills?.length || d.data().headline);
    const stillValid = evaluable.filter((d) => isUpToDate(known.get(d.id), matchHash(d.data(), job)));
    const reused = new Set(stillValid.map((d) => d.id));
    const candidateDocs = evaluable
      .filter((d) => !reused.has(d.id))
      .map((d) => ({ d, evaluated: known.has(d.id), overlap: overlapScore(job, d.data()) }))
      .sort((a, b) => Number(a.evaluated) - Number(b.evaluated) || b.overlap - a.overlap)
      .slice(0, MAX_CANDIDATES)
      .map((x) => x.d);
    const cached = stillValid.length;
    let processed = cached;
    let skipped = 0;
    let quotaError: HttpError | undefined;
    const started = Date.now();

    const work = mapWithConcurrency(candidateDocs, 2, async (c) => {
      const candidate = c.data();
      // Sin cupo de IA no tiene caso seguir intentando con los demás candidatos.
      if (quotaError) return;
      if (Date.now() - started > TIME_BUDGET_MS) {
        skipped++;
        return;
      }
      try {
        await evaluateMatch(db, c.id, candidate, jobId, job);
        processed++;
      } catch (err) {
        if (err instanceof HttpError && err.status === 503) quotaError = err;
        else console.error(`Error calculando match de ${c.id} para ${jobId}:`, err);
      }
    });

    // Límite duro: se responde con lo ya calculado antes de que Vercel corte la función.
    await Promise.race([work, new Promise((resolve) => setTimeout(resolve, HARD_LIMIT_MS))]);

    // Si no se pudo evaluar a nadie porque la IA se quedó sin cupo, se avisa con un mensaje claro; si ya había
    // puntajes vigentes se responde con ellos y `aiLimit` indica que la IA no alcanzó a evaluar a los demás.
    if (quotaError && processed === 0) throw quotaError;

    return NextResponse.json({ processed, cached, skipped, aiLimit: !!quotaError });
  } catch (e) {
    return errorResponse(e);
  }
}
