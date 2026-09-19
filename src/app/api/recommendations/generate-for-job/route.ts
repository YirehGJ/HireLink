import { NextResponse } from "next/server";
import { adminDb, verifyRequestUser } from "@/firebase/admin";
import { evaluateMatch } from "@/lib/server/matching";

// Tope para mantener acotado el costo/tiempo de una sola llamada.
const MAX_CANDIDATES = 40;

/**
 * @fileOverview Calcula, para una vacante, la compatibilidad de los candidatos
 * registrados (S21: "Candidatos recomendados"). Se dispara en segundo plano al
 * publicar/editar una vacante o desde el botón "Recalcular" del reclutador.
 */
export async function POST(request: Request) {
  let uid: string;
  try {
    uid = (await verifyRequestUser(request)).uid;
  } catch {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { jobId } = await request.json();
  if (!jobId) return NextResponse.json({ error: "Falta jobId" }, { status: 400 });

  const db = adminDb();
  const [userSnap, jobSnap] = await Promise.all([
    db.collection("users").doc(uid).get(),
    db.collection("jobs").doc(jobId).get(),
  ]);
  const caller = userSnap.data();
  const job = jobSnap.data();
  if (!caller || !job) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const authorized =
    caller.role === "admin" ||
    (caller.role === "recruiter" && caller.organizationRef === job.organizationRef);
  if (!authorized) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const candidatesSnap = await db.collection("candidates").limit(MAX_CANDIDATES).get();
  let processed = 0;

  for (const c of candidatesSnap.docs) {
    const candidate = c.data();
    if (!candidate.skills?.length && !candidate.headline) continue;
    try {
      await evaluateMatch(db, c.id, candidate, jobId, job);
      processed++;
    } catch (err) {
      console.error(`Error calculando match de ${c.id} para ${jobId}:`, err);
    }
  }

  return NextResponse.json({ processed });
}
