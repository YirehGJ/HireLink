import { NextResponse } from "next/server";
import { adminDb, verifyRequestUser } from "@/firebase/admin";
import { evaluateMatch } from "@/lib/server/matching";

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
  let uid: string;
  try {
    const decoded = await verifyRequestUser(request);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const db = adminDb();

  const candidateSnap = await db.collection("candidates").doc(uid).get();
  if (!candidateSnap.exists) {
    return NextResponse.json({ error: "Perfil de candidato no encontrado" }, { status: 404 });
  }
  const candidate = candidateSnap.data()!;

  const jobsSnap = await db.collection("jobs").where("status", "==", "published").get();

  const results: { jobId: string; score: number }[] = [];

  for (const jobDoc of jobsSnap.docs) {
    try {
      const match = await evaluateMatch(db, uid, candidate, jobDoc.id, jobDoc.data());
      results.push({ jobId: jobDoc.id, score: match.score });
    } catch (err) {
      console.error(`Error calculando match para job ${jobDoc.id}:`, err);
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
