/**
 * @fileOverview Punto único donde se crean las notificaciones de un usuario:
 * siempre escribe el documento in-app (tiempo real, como hasta ahora) y,
 * además, intenta enviar el correo equivalente si:
 *   1) el usuario tiene un correo registrado,
 *   2) hay un proveedor de correo configurado (`RESEND_API_KEY`; ver
 *      docs/EMAIL_SETUP.md), y
 *   3) el usuario no desactivó ese tipo de aviso en Configuración → Notificaciones.
 *
 * El correo nunca bloquea ni hace fallar la notificación in-app: si falla,
 * solo se registra en el log del servidor.
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { sendEmail } from "@/lib/server/email/send-email";
import { emailTemplateFor, type NotificationType } from "@/lib/server/email/templates";

export interface NotifyInput {
  type: NotificationType;
  title: string;
  body: string;
  href: string;
}

// Reutiliza las dos preferencias de correo que ya existen en Configuración
// (src/components/dashboard/settings/notification-settings.tsx): coincidencias
// recomendadas por la IA, y avisos sobre el progreso de una postulación.
const EMAIL_TOGGLE_FOR: Partial<Record<NotificationType, "communication_emails" | "marketing_emails">> = {
  new_recommendation: "communication_emails",
  new_match: "communication_emails",
  match_accepted: "marketing_emails",
  match_rejected: "marketing_emails",
  match_rejected_by_candidate: "marketing_emails",
  application_status_changed: "marketing_emails",
  interview_scheduled: "marketing_emails",
  new_application: "marketing_emails",
};

export async function notifyUser(db: Firestore, userId: string, data: NotifyInput) {
  await db.collection("users").doc(userId).collection("notifications").add({
    ...data,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Fire-and-forget: nunca debe tumbar el flujo que llamó a notifyUser.
  sendNotificationEmail(db, userId, data).catch((err) =>
    console.error(`No se pudo enviar el correo de notificación (${data.type}) a ${userId}:`, err)
  );
}

async function sendNotificationEmail(db: Firestore, userId: string, data: NotifyInput) {
  const toggleKey = EMAIL_TOGGLE_FOR[data.type];
  if (!toggleKey) return; // este tipo de aviso todavía no tiene versión por correo

  const [userSnap, prefsSnap] = await Promise.all([
    db.collection("users").doc(userId).get(),
    db.collection("users").doc(userId).collection("settings").doc("notifications").get(),
  ]);
  const user = userSnap.data();
  if (!user?.email) return;

  // Sin preferencia guardada todavía = se envía por defecto (opt-out, no opt-in).
  const prefs = prefsSnap.data();
  if (prefs && prefs[toggleKey] === false) return;

  const template = emailTemplateFor(data.type, {
    recipientName: user.fullName ?? "",
    title: data.title,
    body: data.body,
    href: data.href,
  });
  const result = await sendEmail({ to: user.email, ...template });
  if (!result.sent) {
    // Caso normal cuando RESEND_API_KEY no está configurada: no es un error.
    console.info(`Correo omitido (${data.type} → ${user.email}): ${result.reason}`);
  }
}
