# Notificaciones por correo (S24)

## Qué hay hecho

- Plantillas de correo con la marca de HireLink (HTML + texto plano):
  [`src/lib/server/email/templates.ts`](../src/lib/server/email/templates.ts).
- Envío real vía la API de [Resend](https://resend.com) sin dependencias nuevas
  (usa `fetch`): [`src/lib/server/email/send-email.ts`](../src/lib/server/email/send-email.ts).
- Punto único `notifyUser()` ([`src/lib/server/notify.ts`](../src/lib/server/notify.ts))
  que reemplazó las escrituras directas a `notifications` en los 4 endpoints que
  generan avisos (nuevo match, aceptar/rechazar match, cambio de estado de
  postulación, entrevista agendada, nueva postulación). Cada vez que se crea una
  notificación in-app, **también se intenta enviar el correo equivalente**.
- Respeta las preferencias de Configuración → Notificaciones
  (`users/{uid}/settings/notifications`): si el usuario desactivó "Coincidencias
  de la IA" o "Actualizaciones de Postulaciones", no se le envía ese correo (pero
  la notificación in-app se sigue creando).

## Por qué no hay correos saliendo todavía

**No hay ninguna cuenta de proveedor de correo conectada.** El envío está
implementado pero apagado a propósito: si no existe la variable de entorno
`RESEND_API_KEY`, `sendEmail()` no hace ninguna llamada de red y lo reporta como
`{ sent: false, reason: "RESEND_API_KEY no configurada" }`. Nada se rompe ni se
bloquea por esto; la app sigue funcionando solo con notificaciones in-app, igual
que antes.

## Cómo activarlo (5–10 minutos)

1. Crea una cuenta gratis en [resend.com](https://resend.com) (100 correos/día,
   3 000/mes gratis).
2. En **API Keys**, crea una clave y cópiala.
3. En Vercel → tu proyecto → **Settings → Environment Variables**, agrega:
   - `RESEND_API_KEY` = la clave que copiaste.
   - `EMAIL_FROM` = `HireLink <onboarding@resend.dev>` (dirección de prueba de
     Resend, funciona sin verificar dominio propio). Si más adelante tienen un
     dominio propio, se verifica en Resend y se cambia esta variable por
     `HireLink <notificaciones@tudominio.com>`.
   - `NEXT_PUBLIC_APP_URL` = `https://hire-link-dun.vercel.app` (o el dominio que
     use la app; los botones del correo usan esta URL).
4. Redeploy. Desde ese momento, cada notificación nueva intenta también mandar
   el correo — no hace falta ningún otro cambio de código.

## Qué falta para estar 100% completo (v2)

- Conectar las preferencias **"Noticias y Marketing"** y **"Alertas de
  Seguridad"** del panel de Configuración a eventos reales (hoy son visuales,
  sin ningún disparador en el servidor).
- Verificar un dominio propio en Resend en vez de usar la dirección de prueba
  `onboarding@resend.dev` (esa dirección tiene límites de envío más bajos).
- Reintentos con cola si Resend falla (hoy, si falla, solo se registra en el log
  del servidor y no se reintenta).
