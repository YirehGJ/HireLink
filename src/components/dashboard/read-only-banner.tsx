"use client";

import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers/app-provider";

/**
 * Aviso visible mientras un admin está en modo "ver como" (solo lectura).
 */
export function ReadOnlyBanner() {
  const { readOnly, user, stopViewAs } = useApp();
  const router = useRouter();

  if (!readOnly || !user) return null;

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-black">
      <span className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        Modo solo lectura: viendo HireLink como {user.fullName} ({user.email})
      </span>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          stopViewAs();
          router.push("/dashboard/admin/users");
        }}
      >
        Salir
      </Button>
    </div>
  );
}
