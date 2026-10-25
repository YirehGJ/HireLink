"use client";

import { Clock } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";

/** ¿Es una reclutadora que todavía no aprueba un administrador? (no ve candidatas ni publica vacantes) */
export function usePendingRecruiter(): boolean {
  const { user } = useApp();
  return !!user && user.role === "recruiter" && user.recruiterApproved !== true;
}

/**
 * Aviso para una reclutadora que espera aprobación. Mientras tanto puede completar el perfil de su empresa; cuando un
 * administrador la apruebe podrá publicar vacantes y ver candidatas (así se evita que cualquier cuenta nueva vea
 * el correo y el CV de las personas que participan).
 */
export function PendingApprovalBanner() {
  const pending = usePendingRecruiter();
  if (!pending) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-3 border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-semibold">Tu cuenta espera aprobación.</span> Mientras un administrador la aprueba puedes
        completar el perfil de tu empresa. Después podrás publicar vacantes y ver candidatas.
      </p>
    </div>
  );
}
