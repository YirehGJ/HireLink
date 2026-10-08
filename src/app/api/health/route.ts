import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/firebase/admin";

/**
 * Diagnóstico de despliegue: indica qué variables de entorno están presentes
 * (solo sí/no, nunca sus valores) y si Firebase Admin y la IA quedaron bien
 * configurados. No requiere sesión ni expone datos de usuarios.
 */
// Sin esto Next.js lo prerenderiza en el build y el diagnóstico quedaría congelado.
export const dynamic = "force-dynamic";

// Resultado de la prueba de Groq en memoria, para que el endpoint público no pueda usarse para martillar al proveedor.
let groqCache: { at: number; value: Record<string, unknown> } | null = null;

async function probeGroq(): Promise<Record<string, unknown>> {
  const key = process.env.GROQ_API_KEY ?? "";
  if (!key) return { ok: false, reason: "GROQ_API_KEY no configurada" };
  if (groqCache && Date.now() - groqCache.at < 60_000) return groqCache.value;
  let value: Record<string, unknown>;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    value = { ok: res.ok, status: res.status };
    if (res.ok) {
      const json = await res.json();
      value.modelAvailable = !!json?.data?.some((m: { id: string }) => m.id === "openai/gpt-oss-120b");
    }
  } catch (e: any) {
    value = { ok: false, reason: String(e?.message ?? e).slice(0, 120) };
  }
  // TEMPORAL: llamada mínima por Genkit para ver el error real de las funciones de IA en Vercel.
  try {
    const { ai, GROQ_MODEL } = await import("@/ai/genkit");
    const out = await Promise.race([
      ai.generate({ prompt: "Responde solo con la palabra: ok", model: GROQ_MODEL }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout de 20 s")), 20000)),
    ]);
    value.genkit = { ok: true, text: String((out as any).text ?? "").slice(0, 40) };
  } catch (e: any) {
    value.genkit = {
      ok: false,
      name: String(e?.name ?? "").slice(0, 60),
      message: String(e?.message ?? e).slice(0, 300),
      status: e?.status ?? e?.cause?.status ?? null,
    };
  }
  groqCache = { at: Date.now(), value };
  return value;
}

export async function GET(request: Request) {
  const deep = new URL(request.url).searchParams.get("deep") === "1";
  const env = {
    FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
  };

  const pk = process.env.FIREBASE_PRIVATE_KEY ?? "";
  const privateKeyShape = {
    startsWithBegin: pk.replace(/\\n/g, "\n").trim().startsWith("-----BEGIN PRIVATE KEY-----"),
    endsWithEnd: pk.replace(/\\n/g, "\n").trim().endsWith("-----END PRIVATE KEY-----"),
    hasQuotesAround: /^["']|["']$/.test(pk.trim()),
  };

  let adminInit: { ok: boolean; reason?: string } = { ok: false };
  try {
    adminAuth();
    await adminDb().collection("users").limit(1).get();
    adminInit = { ok: true };
  } catch (e: any) {
    adminInit = { ok: false, reason: String(e?.message ?? e).slice(0, 160) };
  }

  const groqKey = process.env.GROQ_API_KEY ?? "";
  const groqKeyShape = {
    startsWithGsk: groqKey.startsWith("gsk_"),
    hasWhitespace: /\s/.test(groqKey) || groqKey !== groqKey.trim(),
  };
  const groq = deep ? await probeGroq() : undefined;

  return NextResponse.json(
    { env, privateKeyShape, groqKeyShape, adminInit, ...(groq ? { groq } : {}) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
