import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";
import { extractCvData } from "@/ai/flows/extract-cv-data-flow";
import { enforceRateLimit, errorResponse, HttpError, requireUser } from "@/lib/server/guard";
import { runAi } from "@/lib/server/ai-runner";

export const maxDuration = 60;

const clampInt = (n: unknown, min: number, max: number) => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;
};
const cut = (s: unknown, max: number) => String(s ?? "").trim().slice(0, max);

/**
 * El modelo devuelve años con decimales (4.8, 2.5), niveles fuera de rango y textos más largos que los
 * límites del formulario. Con eso el formulario del perfil quedaba inválido y «Guardar Perfil» no hacía
 * nada (el navegador bloquea los números con decimales sin mostrar el error en pantalla): fallaba con 7 de
 * 10 CV de prueba. Aquí se normaliza al formato que espera el perfil (enteros, 1 a 5, 0 a 60, textos acotados).
 */
function sanitizeCvData(d: Awaited<ReturnType<typeof extractCvData>>) {
  return {
    headline: cut(d.headline, 200),
    location: cut(d.location, 200),
    yearsOfExperience: clampInt(d.yearsOfExperience, 0, 60),
    summary: cut(d.summary, 2500),
    skills: (d.skills ?? [])
      .map((s) => ({ name: cut(s.name, 60), level: clampInt(s.level, 1, 5), years: clampInt(s.years, 0, 60) }))
      .filter((s) => s.name),
    // Se descartan las entradas sin puesto o sin institución: el formulario las rechazaría.
    experience: (d.experience ?? [])
      .map((e) => ({
        title: cut(e.title, 150), company: cut(e.company, 150), startDate: cut(e.startDate, 40), endDate: cut(e.endDate, 40), description: cut(e.description, 500),
      }))
      .filter((e) => e.title),
    education: (d.education ?? [])
      .map((e) => ({
        institution: cut(e.institution, 150), degree: cut(e.degree, 150), field: cut(e.field, 150), startDate: cut(e.startDate, 40), endDate: cut(e.endDate, 40),
      }))
      .filter((e) => e.institution),
  };
}

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
    return NextResponse.json(sanitizeCvData(data));
  } catch (e) {
    return errorResponse(e);
  }
}
