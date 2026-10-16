"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Si una pantalla del dashboard falla al dibujarse (un dato con una forma inesperada, por ejemplo), esta
 * pantalla evita que desaparezca toda la aplicación con el mensaje en inglés de Next.js: conserva la barra
 * lateral, reporta el error a Sentry y deja reintentar o volver al inicio.
 */
export default function DashboardError({
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center" role="alert">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-2xl font-bold">Algo salió mal en esta pantalla</h2>
      <p className="max-w-md text-muted-foreground">
        El problema quedó registrado para que el equipo lo revise. Puedes reintentar o volver a tu inicio.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Reintentar</Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Ir a mi inicio</Link>
        </Button>
      </div>
    </div>
  );
}
