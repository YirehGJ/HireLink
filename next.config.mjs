import { withSentryConfig } from '@sentry/nextjs/config';

/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';
const googleLogin = process.env.NEXT_PUBLIC_GOOGLE_LOGIN === 'true';
// Válvula de escape: con CSP_REPORT_ONLY=true (y un nuevo despliegue) la política solo avisa en la consola del navegador
// y no bloquea nada. Sirve si algún día un cambio necesita un origen que la política aún no permite.
const cspHeaderName = process.env.CSP_REPORT_ONLY === 'true' ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';

// Política de contenido: la página solo carga código, estilos, fuentes e imágenes de sí misma. Lo único externo que
// contacta el navegador es Firebase (Auth y Firestore, siempre bajo googleapis.com) y Sentry. Next.js inserta scripts
// en línea para hidratar cada página, por eso script-src conserva 'unsafe-inline' (una política con nonce obligaría a
// generar todas las páginas en cada visita); 'wasm-unsafe-eval' lo necesita pdf.js. Al activar el acceso con Google
// (NEXT_PUBLIC_GOOGLE_LOGIN) se abren además los dominios de su ventana de inicio de sesión.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ''}${googleLogin ? ' https://apis.google.com' : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' https://*.googleapis.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io${isDev ? ' ws://localhost:*' : ''}`,
  `frame-src 'self'${googleLogin ? ' https://*.firebaseapp.com https://accounts.google.com' : ''}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

// Cabeceras de seguridad para todas las rutas.
const securityHeaders = [
  // Fuerza HTTPS durante 2 años (incluye subdominios).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: cspHeaderName, value: contentSecurityPolicy },
  // Aísla la pestaña de ventanas de otros sitios; permite las ventanas emergentes que abre la propia página (acceso con Google).
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  // Impide que la app se incruste en iframes de otros sitios (clickjacking).
  { key: 'X-Frame-Options', value: 'DENY' },
  // Evita que el navegador "adivine" tipos MIME.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // No filtra rutas completas a otros sitios.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // La app no usa cámara, micrófono ni geolocalización.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig = {
  poweredByHeader: false, // no revela que se usa Next.js
  reactStrictMode: true,
  // instrumentation.ts (inicializa Sentry en el servidor/edge) es estable desde Next 15: ya no requiere un flag.
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Las respuestas de la API nunca deben guardarse en caché.
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
      // El worker de pdf.js lleva la versión en el nombre: se puede guardar en caché para siempre.
      { source: '/pdf.worker.:version.min.mjs', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    ];
  },
};

// Sin SENTRY_AUTH_TOKEN (no configurado por defecto) el plugin no sube
// source maps ni requiere cuenta de Sentry: el build funciona igual.
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: false,
  disableLogger: true,
  // Sentry se usa solo para capturar errores: se quita del bundle el código de trazas de rendimiento y de
  // mensajes de depuración (pesa decenas de kB en cada página).
  webpack: { treeshake: { removeDebugLogging: true, removeTracing: true } },
});
