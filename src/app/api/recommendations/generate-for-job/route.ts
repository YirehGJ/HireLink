import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";
import { evaluateMatch } from "@/lib/server/matching";
import { mapWithConcurrency } from "@/lib/server/concurrency";
import { enforceRateLimit, errorResponse, HttpError, requireUser } from "@/lib/server/guard";

// Máximo permitido en el plan gratuito de Vercel; evita que la función se corte a la mitad.
export const maxDuration = 60;

// Tope para mantener acotado el costo/tiempo de una sola llamada.
const MAX_CANDIDATES = 40;

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

    const candidatesSnap = await db.collection("candidates").limit(MAX_CANDIDATES).get();
    let processed = 0;

    await mapWithConcurrency(candidatesSnap.docs, 4, async (c) => {
      const candidate = c.data();
      if (!candidate.skills?.length && !candidate.headline) return;
      try {
        await evaluateMatch(db, c.id, candidate, jobId, job);
        processed++;
      } catch (err) {
        console.error(`Error calculando match de ${c.id} para ${jobId}:`, err);
      }
    });

    return NextResponse.json({ processed });
  } catch (e) {
    return errorResponse(e);
  }
}
