import * as Sentry from "@sentry/nextjs";

/**
 * Captura de errores del lado del cliente (navegador). Sin `NEXT_PUBLIC_SENTRY_DSN`
 * el SDK queda inactivo: no hay llamadas de red ni costo mientras no se configure.
 * Ver docs/SENTRY_SETUP.md para activarlo.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
});
