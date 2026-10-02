import * as Sentry from "@sentry/nextjs";

/**
 * Captura de errores del servidor (Route Handlers). Sin `SENTRY_DSN` el SDK
 * queda inactivo: sin llamadas de red ni costo. Ver docs/SENTRY_SETUP.md.
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
});
