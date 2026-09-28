import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/firebase/admin";

/**
 * Diagnóstico de despliegue: indica qué variables de entorno están presentes
 * (solo sí/no, nunca sus valores) y si Firebase Admin y la IA quedaron bien
 * configurados. No requiere sesión ni expone datos de usuarios.
 */
export async function GET() {
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

  return NextResponse.json({ env, privateKeyShape, adminInit }, { headers: { "Cache-Control": "no-store" } });
}
