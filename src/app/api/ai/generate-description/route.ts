import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";
import { generateJobDescription } from "@/ai/flows/generate-job-description-flow";
import { enforceRateLimit, errorResponse, HttpError, requireUser } from "@/lib/server/guard";
import { runAi } from "@/lib/server/ai-runner";

export const maxDuration = 60;

/**
 * Genera la descripción de una vacante con IA. Solo reclutadores/admins activos,
 * entrada acotada y límite de uso por usuario.
 */
export async function POST(request: Request) {
  try {
    const { uid } = await requireUser(request, ["recruiter", "admin"]);
    await enforceRateLimit(adminDb(), uid, "gen-description", 20, 3600);

    const body = await request.json().catch(() => null);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const seniority = typeof body?.seniority === "string" ? body.seniority.trim() : "";
    const tags = Array.isArray(body?.searchTags) ? body.searchTags : [];
    if (!title || !seniority) throw new HttpError(400, "Faltan título o seniority.");
    if (title.length > 200 || seniority.length > 30 || tags.length > 40) {
      throw new HttpError(413, "Entrada demasiado grande.");
    }
    const searchTags = tags.filter((t: unknown) => typeof t === "string").map((t: string) => t.slice(0, 60));

    const data = await runAi(() => generateJobDescription({ title, seniority, searchTags }));
    return NextResponse.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}
