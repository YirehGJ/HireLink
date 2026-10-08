import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";
import { evaluateMatch } from "@/lib/server/matching";
import { mapWithConcurrency } from "@/lib/server/concurrency";
import { enforceRateLimit, errorResponse, HttpError, requireUser } from "@/lib/server/guard";

// Máximo permitido en el plan gratuito de Vercel; evita que la función se corte a la mitad.
export const maxDuration = 60;

// Tope de vacantes evaluadas por llamada (las más recientes) para acotar tiempo y costo.
const MAX_JOBS = 30;

// El plan gratuito de Groq limita los tokens por minuto: si una llamada ya tardó más de esto, se
// dejan de lanzar evaluaciones nuevas para responder antes de que Vercel corte la función (60 s).
const TIME_BUDGET_MS = 30_000;

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

    const jobsSnap = await db
      .collection("jobs")
      .where("status", "==", "published")
      .limit(MAX_JOBS)
      .get();

    // Las vacantes que aún no tienen recomendación para este candidato van primero: si se acaba el
    // tiempo, lo que queda sin evaluar son las que ya tenían un puntaje anterior.
    const existing = await db.collection("recommendations").where("candidateRef", "==", uid).get();
    const have = new Set(existing.docs.map((d) => d.data().jobRef));
    const jobDocs = [...jobsSnap.docs].sort((a, b) => Number(have.has(a.id)) - Number(have.has(b.id)));

    const started = Date.now();
    const evaluated = await mapWithConcurrency(jobDocs, 2, async (jobDoc) => {
      if (Date.now() - started > TIME_BUDGET_MS) return "skipped" as const;
      try {
        const match = await evaluateMatch(db, uid, candidate, jobDoc.id, jobDoc.data());
        return { jobId: jobDoc.id, score: match.score };
      } catch (err) {
        console.error(`Error calculando match para job ${jobDoc.id}:`, err);
        return null;
      }
    });
    const results = evaluated.filter((r): r is { jobId: string; score: number } => r !== null && r !== "skipped");
    const skipped = evaluated.filter((r) => r === "skipped").length;

    return NextResponse.json({ processed: results.length, skipped, results });
  } catch (e) {
    return errorResponse(e);
  }
}
