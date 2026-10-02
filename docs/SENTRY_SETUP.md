# Seguimiento de errores con Sentry (S25)

## Qué hay hecho

- SDK oficial `@sentry/nextjs` instalado y conectado a las tres superficies de
  Next.js: cliente ([`sentry.client.config.ts`](../sentry.client.config.ts)),
  servidor ([`sentry.server.config.ts`](../sentry.server.config.ts)) y edge
  ([`sentry.edge.config.ts`](../sentry.edge.config.ts)), registrados mediante el
  hook estándar de Next.js ([`instrumentation.ts`](../instrumentation.ts)).
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

## Por qué no hay nada reportándose todavía

**No hay ninguna cuenta de Sentry conectada.** La integración está implementada
pero apagada a propósito: sin las variables de entorno `SENTRY_DSN` (servidor/edge)
y `NEXT_PUBLIC_SENTRY_DSN` (cliente), `Sentry.init({ dsn: undefined })` deja el SDK
inactivo — no hace ninguna llamada de red ni tiene costo. La app sigue
funcionando exactamente igual que antes; solo deja de capturarse el detalle del
error (que de todas formas ya se registra con `console.error` en los logs de
Vercel).

## Cómo activarlo (5 minutos)

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
