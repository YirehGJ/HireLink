import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";
import { writeAuditLog } from "@/firebase/admin-audit";
import { enforceRateLimit, errorResponse, HttpError, requireUser } from "@/lib/server/guard";
import { notifyUser } from "@/lib/server/notify";
import { formatDateTimeEs, safeTimeZone } from "@/lib/server/datetime";

/**
 * @fileOverview Cancela una entrevista agendada. Antes el reclutador la borraba directamente desde el
 * navegador y el candidato no se enteraba. Aquí se verifica que quien llama sea un reclutador activo de la
 * empresa dueña de la entrevista (o un admin), se elimina, se avisa al candidato y queda en la auditoría.
 */
export async function POST(request: Request) {
  try {
    const caller = await requireUser(request, ["recruiter", "admin"]);
    const db = adminDb();
    await enforceRateLimit(db, caller.uid, "interview-cancel", 120, 3600);

    const body = await request.json().catch(() => null);
    const interviewId = typeof body?.interviewId === "string" ? body.interviewId : "";
    if (!interviewId || interviewId.includes("/")) throw new HttpError(400, "Falta interviewId");

    const ref = db.collection("interviews").doc(interviewId);
    const interview = (await ref.get()).data();
    if (!interview) throw new HttpError(404, "Entrevista no encontrada");

    const authorized =
      caller.role === "admin" ||
      (caller.role === "recruiter" && caller.organizationRef === interview.organizationRef);
    if (!authorized) throw new HttpError(403, "No autorizado");

    await ref.delete();

    const start: Date | null = typeof interview.scheduledStart?.toDate === "function" ? interview.scheduledStart.toDate() : null;
    const when = start && !Number.isNaN(start.getTime()) ? ` del ${formatDateTimeEs(start, safeTimeZone(body?.timeZone))}` : "";
    const title: string = interview.jobTitle ?? "la vacante";

    if (typeof interview.candidateRef === "string" && interview.candidateRef) {
      await notifyUser(db, interview.candidateRef, {
        type: "interview_cancelled",
        title: "Entrevista cancelada",
        body: `${title}: la empresa canceló la entrevista${when}. Te avisaremos si se agenda una nueva fecha.`,
        href: "/dashboard/applications",
      });
    }

    await writeAuditLog(db, caller.uid, {
      action: "interview_cancelled",
      targetType: "interview",
      targetId: interviewId,
      details: `Canceló la entrevista de "${title}"`,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
