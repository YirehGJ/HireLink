/**
 * @fileOverview Plantillas de correo. Reutilizan el mismo texto que ya se
 * muestra en las notificaciones in-app (título + cuerpo) y lo envuelven en un
 * layout HTML de marca, con una versión en texto plano como respaldo.
 */
export type NotificationType =
  | "new_recommendation"
  | "new_match"
  | "match_accepted"
  | "match_rejected"
  | "match_rejected_by_candidate"
  | "application_status_changed"
  | "interview_scheduled"
  | "new_application";

export interface TemplateInput {
  recipientName: string;
  title: string;
  body: string;
  href: string;
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://hire-link-dun.vercel.app").replace(/\/$/, "");

const CTA_LABEL: Partial<Record<NotificationType, string>> = {
  new_recommendation: "Ver vacante",
  new_match: "Revisar candidato",
  match_accepted: "Ver mis postulaciones",
  match_rejected: "Ver mis recomendaciones",
  match_rejected_by_candidate: "Ver vacante",
  application_status_changed: "Ver mis postulaciones",
  interview_scheduled: "Ver mi agenda",
  new_application: "Ver postulantes",
};

/** Construye el HTML/texto de un correo a partir de los mismos datos de la notificación in-app. */
export function emailTemplateFor(type: NotificationType, input: TemplateInput): EmailContent {
  const firstName = input.recipientName?.trim().split(/\s+/)[0];
  const greeting = firstName ? `Hola ${firstName},` : "Hola,";
  const url = input.href.startsWith("http") ? input.href : `${APP_URL}${input.href}`;
  const ctaLabel = CTA_LABEL[type] ?? "Ver en HireLink";

  return {
    subject: input.title,
    html: baseLayout({ greeting, message: input.body, ctaLabel, url }),
    text: `${greeting}\n\n${input.body}\n\n${ctaLabel}: ${url}\n\n— HireLink`,
  };
}

function baseLayout({ greeting, message, ctaLabel, url }: { greeting: string; message: string; ctaLabel: string; url: string }) {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#0b0b12;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#15151f;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:24px 32px;background:linear-gradient(135deg,#7c3aed,#a855f7);">
                <span style="font-size:20px;font-weight:700;color:#ffffff;">HireLink</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#e5e5f0;">
                <p style="margin:0 0 16px;font-size:15px;">${escapeHtml(greeting)}</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.5;">${escapeHtml(message)}</p>
                <a href="${escapeAttr(url)}" style="display:inline-block;padding:12px 24px;background-color:#7c3aed;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">${escapeHtml(ctaLabel)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #2a2a38;">
                <p style="margin:0;font-size:12px;color:#8a8a9a;">Recibiste este correo porque tienes una cuenta en HireLink. Puedes ajustar tus preferencias en Configuración → Notificaciones.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c]);
}

function escapeAttr(s: string) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}
