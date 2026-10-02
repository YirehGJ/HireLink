"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Se activa solo cuando falla el layout raíz (error irrecuperable). Next.js
 * exige que reemplace <html>/<body> por completo en ese caso.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "1.5rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Algo salió mal</h1>
          <p style={{ color: "#6b7280" }}>El error quedó registrado. Intenta recargar la página.</p>
          <button
            onClick={() => reset()}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "#7c3aed", color: "white", border: "none", cursor: "pointer" }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
