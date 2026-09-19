"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Ban, ShieldAlert } from "lucide-react";
import type { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers/app-provider";
import { useAuth } from "@/firebase";

/**
 * Bloquea el dashboard a las cuentas suspendidas por un administrador.
 */
export function AccountGuard({ children }: { children: React.ReactNode }) {
  const { user, readOnly, setUser } = useApp();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (user?.status === "suspended" && !readOnly) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <Ban className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Tu cuenta está suspendida</h2>
        <p className="max-w-md text-muted-foreground">
          Un administrador desactivó el acceso a esta cuenta. Si crees que es un error, contacta al equipo de HireLink.
        </p>
        <Button
          onClick={async () => {
            if (auth) await signOut(auth);
            setUser(null);
            router.push("/");
          }}
        >
          Cerrar sesión
        </Button>
      </div>
    );
  }

  // Guards de acceso por rol (además de las reglas de Firestore).
  const allowed = isPathAllowed(pathname, user?.role);
  if (user && !allowed) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">No tienes permiso para ver esta página</h2>
        <p className="max-w-md text-muted-foreground">Tu rol actual no incluye acceso a esta sección.</p>
        <Button onClick={() => router.push("/dashboard")}>Ir a mi inicio</Button>
      </div>
    );
  }

  return <>{children}</>;
}

function isPathAllowed(pathname: string, role?: UserRole) {
  if (!role) return true;
  if (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/dashboard/users")) return role === "admin";
  if (pathname.startsWith("/dashboard/candidates") || pathname.startsWith("/dashboard/jobs/new")) {
    return role === "recruiter" || role === "admin";
  }
  if (pathname.startsWith("/dashboard/explore") || pathname.startsWith("/dashboard/applications")) {
    return role === "candidate";
  }
  return true;
}
