# Seguimiento de errores con Sentry (S25)

## Qué hay hecho

- SDK oficial `@sentry/nextjs` instalado y conectado a las tres superficies de
  Next.js: cliente ([`sentry.client.config.ts`](../sentry.client.config.ts)),
  servidor ([`sentry.server.config.ts`](../sentry.server.config.ts)) y edge
  ([`sentry.edge.config.ts`](../sentry.edge.config.ts)), registrados mediante el
  hook estándar de Next.js ([`src/instrumentation.ts`](../src/instrumentation.ts);
  debe estar dentro de `src/` porque el proyecto usa esa carpeta, de lo contrario
  Next.js lo ignora y el servidor nunca inicializa Sentry).
- `next.config.mjs` envuelto con `withSentryConfig` (desde `@sentry/nextjs/config`,
  la ruta pensada para archivos de configuración ESM) para instrumentar
  automáticamente Route Handlers y Server Components.
- Captura centralizada de errores de API en
  [`errorResponse()`](../src/lib/server/guard.ts): solo se reportan errores
  **inesperados** (bugs reales). Los `HttpError` esperados (401/403/429, control
  de flujo normal) no se reportan para no gastar la cuota gratuita en ruido.
- [`src/app/global-error.tsx`](../src/app/global-error.tsx) captura errores
  irrecuperables del cliente (fallas del layout raíz) y muestra una pantalla de
  error en español en vez de la pantalla en blanco por defecto de Next.js.

## Estado actual

**Activo en producción desde el 8 de octubre de 2026.** Las variables `SENTRY_DSN` y
`NEXT_PUBLIC_SENTRY_DSN` están configuradas en Vercel y el proyecto `hirelink` de
Sentry ya recibió un evento real del servidor (un error de ruta inválida provocado a
propósito en `POST /api/applications/notify-new`). Para que el evento llegue antes de
que la función serverless se congele, `errorResponse()` espera `Sentry.flush(2000)`.

Sin esas variables el SDK queda inactivo (`Sentry.init({ dsn: undefined })`): no hace
llamadas de red ni tiene costo, y la app funciona igual.

## Cómo activarlo desde cero (5 minutos)

1. Crea una cuenta gratis en [sentry.io](https://sentry.io) (plan Developer:
   5 000 errores/mes gratis, más que suficiente para un proyecto académico).
2. Crea un proyecto de tipo **Next.js**. Sentry te da un DSN (una URL tipo
   `https://xxxx@xxxx.ingest.sentry.io/xxxx`).
3. En Vercel → tu proyecto → **Settings → Environment Variables**, agrega:
   - `SENTRY_DSN` = el DSN que te dio Sentry.
   - `NEXT_PUBLIC_SENTRY_DSN` = el mismo DSN (debe ser público porque lo usa el
     navegador; Sentry está diseñado para que el DSN sea seguro de exponer).
4. Redeploy. Desde ese momento, cualquier error no manejado en el servidor, el
   edge o el cliente llega al dashboard de Sentry.

## Qué falta para estar 100% completo (v2)

- Subida de source maps al build (requiere `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` y
  `SENTRY_PROJECT`; sin esas variables el build funciona igual, solo que los
  stack traces en Sentry muestran el código minificado en vez del original).
- Alertas por correo/Slack configuradas en el dashboard de Sentry cuando ocurre
  un error nuevo (se configura del lado de Sentry, no en el código).
- Session Replay o Performance Monitoring más allá del `tracesSampleRate: 0.1`
  actual (10% de las peticiones), si se necesita más detalle de diagnóstico.
