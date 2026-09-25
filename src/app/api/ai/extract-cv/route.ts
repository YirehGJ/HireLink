import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";
import { extractCvData } from "@/ai/flows/extract-cv-data-flow";
import { enforceRateLimit, errorResponse, HttpError, requireUser } from "@/lib/server/guard";
import { runAi } from "@/lib/server/ai-runner";

export const maxDuration = 60;

/**
 * Analiza con IA el texto de un CV. Requiere sesión de candidato activa, valida
 * el tamaño de la entrada y limita las llamadas por usuario (protege el costo y
 * la cuota del proveedor de IA).
 */
export async function POST(request: Request) {
  try {
    const { uid } = await requireUser(request, ["candidate"]);
    await enforceRateLimit(adminDb(), uid, "extract-cv", 10, 3600);

    const body = await request.json().catch(() => null);
    const cvText = typeof body?.cvText === "string" ? body.cvText.trim() : "";
    if (cvText.length < 30) throw new HttpError(400, "El CV no contiene texto suficiente.");
    // 8000 caracteres cubre cualquier CV real (1-3 páginas) y evita agotar el
    // presupuesto de tokens por minuto de la cuenta de Groq con un solo análisis.
    if (cvText.length > 8000) throw new HttpError(413, "El CV es demasiado largo.");

    const data = await runAi(() => extractCvData({ cvText }));
    return NextResponse.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}
