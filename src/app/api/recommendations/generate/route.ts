import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";
import { evaluateMatch, isUpToDate, matchHash, overlapScore } from "@/lib/server/matching";
import { mapWithConcurrency } from "@/lib/server/concurrency";
import { enforceRateLimit, errorResponse, HttpError, requireUser } from "@/lib/server/guard";

// Máximo permitido en el plan gratuito de Vercel; evita que la función se corte a la mitad.
export const maxDuration = 60;

// Tope de vacantes evaluadas por llamada (las más recientes) para acotar tiempo y costo.
const MAX_JOBS = 30;

// El plan gratuito de Groq limita los tokens por minuto: si una llamada ya tardó más de esto, se
// dejan de lanzar evaluaciones nuevas para responder antes de que Vercel corte la función (60 s).
const TIME_BUDGET_MS = 30_000;
const HARD_LIMIT_MS = 52_000;

/**
 * @fileOverview Módulo de Sistemas Inteligentes + Sistemas Distribuidos.
 *
 * Se dispara de forma asíncrona (fire-and-forget) después de que un candidato
 * guarda su perfil, para no bloquear la UI. Corre server-side con el Admin SDK
 * porque la colección `recommendations` no admite escritura desde el cliente.
 * La IA considera el perfil y el CV analizado del candidato contra cada vacante
 * publicada; los matches fuertes quedan "en espera" para el reclutador.
 */
export async function POST(request: Request) {
  try {
    const { uid } = await requireUser(request, ["candidate"]);
    const db = adminDb();
    // Cada guardado de perfil dispara IA: se limita para evitar abuso de la cuota.
    await enforceRateLimit(db, uid, "gen-recs", 10, 3600);

    const candidateSnap = await db.collection("candidates").doc(uid).get();
    if (!candidateSnap.exists) throw new HttpError(404, "Perfil de candidato no encontrado");
    const candidate = candidateSnap.data()!;

    // Se toman las MAX_JOBS vacantes publicadas más recientes. Se ordena en memoria (en vez de usar
    // orderBy) para no depender de un índice compuesto de Firestore; antes el límite tomaba 30 al azar.
    const jobsSnap = await db.collection("jobs").where("status", "==", "published").get();
    const createdAt = (d: FirebaseFirestore.QueryDocumentSnapshot) => d.data().createdAt?.toMillis?.() ?? 0;
    const recent = [...jobsSnap.docs].sort((a, b) => createdAt(b) - createdAt(a)).slice(0, MAX_JOBS);

    const existing = await db.collection("recommendations").where("candidateRef", "==", uid).get();
    const known = new Map(existing.docs.map((d) => [d.data().jobRef as string, d.data()]));
    // Los puntajes vigentes (perfil y vacante sin cambios desde que se calcularon) se reutilizan sin llamar a la
    // IA: no gastan tokens ni tiempo, así que no cuentan contra el presupuesto de la llamada.
    const results: { jobId: string; score: number }[] = [];
    const pending = recent.filter((d) => {
      const rec = known.get(d.id);
      if (!isUpToDate(rec, matchHash(candidate, d.data()))) return true;
      results.push({ jobId: d.id, score: rec!.score });
      return false;
    });
    const cached = results.length;
    // Las vacantes que aún no tienen recomendación para este candidato van primero: si se acaba el tiempo,
    // lo que queda sin evaluar son las que ya tenían un puntaje anterior. Dentro de cada grupo, primero las que
    // más coinciden con las habilidades del candidato.
    const jobDocs = pending
      .map((d) => ({ d, evaluated: known.has(d.id), overlap: overlapScore(d.data(), candidate) }))
      .sort((a, b) => Number(a.evaluated) - Number(b.evaluated) || b.overlap - a.overlap)
      .map((x) => x.d);

    const started = Date.now();
    let skipped = 0;
    // Evaluaciones que fallaron por otra causa (p. ej. la IA devolvió una respuesta incompleta): se cuentan para decirlo.
    let failed = 0;
    let quotaError: HttpError | undefined;
    const work = mapWithConcurrency(jobDocs, 2, async (jobDoc) => {
      // Sin cupo de IA no tiene caso seguir intentando con las demás vacantes.
      if (quotaError) return;
      if (Date.now() - started > TIME_BUDGET_MS) {
        skipped++;
        return;
      }
      try {
        const match = await evaluateMatch(db, uid, candidate, jobDoc.id, jobDoc.data());
        results.push({ jobId: jobDoc.id, score: match.score });
      } catch (err) {
        if (err instanceof HttpError && err.status === 503) quotaError = err;
        else {
          failed++;
          console.error(`Error calculando match para job ${jobDoc.id}:`, err);
        }
      }
    });
    // Límite duro: se responde con lo ya calculado antes de que Vercel corte la función.
    await Promise.race([work, new Promise((resolve) => setTimeout(resolve, HARD_LIMIT_MS))]);

    // Si no se pudo evaluar nada porque la IA se quedó sin cupo, se avisa con un mensaje claro.
    if (quotaError && results.length === 0) throw quotaError;

    return NextResponse.json({ processed: results.length, cached, skipped, failed, aiLimit: !!quotaError, results });
  } catch (e) {
    return errorResponse(e);
  }
}
