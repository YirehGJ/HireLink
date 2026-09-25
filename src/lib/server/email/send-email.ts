/**
 * @fileOverview Envío de correo vía la API HTTP de Resend (https://resend.com),
 * sin dependencias nuevas (usa `fetch`).
 *
 * Si no hay `RESEND_API_KEY` configurada, la función no hace nada y lo reporta
 * en el resultado: la app sigue funcionando solo con notificaciones in-app
 * hasta que se active. Ver docs/EMAIL_SETUP.md para activarlo en producción.
 */
export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  sent: boolean;
  reason?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, reason: "RESEND_API_KEY no configurada (envío de correo desactivado)" };
  }
  if (!input.to) {
    return { sent: false, reason: "El destinatario no tiene correo registrado" };
  }

  const from = process.env.EMAIL_FROM || "HireLink <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend respondió ${res.status}: ${detail.slice(0, 300)}`);
  }
  return { sent: true };
}
