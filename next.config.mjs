/** @type {import('next').NextConfig} */

// Cabeceras de seguridad para todas las rutas.
const securityHeaders = [
  // Fuerza HTTPS durante 2 años (incluye subdominios).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
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
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Las respuestas de la API nunca deben guardarse en caché.
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};

export default nextConfig;
