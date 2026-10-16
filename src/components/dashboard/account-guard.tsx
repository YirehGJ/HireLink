"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Ban, ShieldAlert } from "lucide-react";
import type { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/components/providers/app-provider";
import { useAuth, useUser } from "@/firebase";
import { markIntentionalSignOut, wasIntentionalSignOut } from "@/lib/auth-flags";

function GuardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8" aria-busy="true" aria-label="Cargando">
      <div className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-80" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/**
 * Protege el dashboard:
 *  - sin sesión lleva a /login (y regresa a la página pedida al iniciar sesión);
 *  - no pinta la página hasta conocer el rol, para que una pantalla de otro rol no llegue a
 *    montarse ni a consultar datos que no le corresponden;
 *  - bloquea las cuentas suspendidas y las rutas que el rol no puede usar.
 */
export function AccountGuard({ children }: { children: React.ReactNode }) {
  const { user, readOnly, setUser, isMounted } = useApp();
  const { user: authUser, loading: authLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (authLoading || authUser || wasIntentionalSignOut()) return;
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [authLoading, authUser, pathname, router]);

  if (authLoading || !authUser || !isMounted || !user) return <GuardSkeleton />;

  if (user.status === "suspended" && !readOnly) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <Ban className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Tu cuenta está suspendida</h2>
        <p className="max-w-md text-muted-foreground">
          Un administrador desactivó el acceso a esta cuenta. Si crees que es un error, contacta al equipo de HireLink.
        </p>
        <Button
          onClick={async () => {
            markIntentionalSignOut();
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
  if (!isPathAllowed(pathname, user.role)) {
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
  if (!role) return false;
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path.startsWith("/dashboard/admin") || path.startsWith("/dashboard/users")) return role === "admin";
  // La lista de vacantes de la empresa es de reclutadores (el admin usa /dashboard/admin/jobs) y el
  // alta también de admins; el detalle /dashboard/jobs/[id] lo ven todos los roles.
  if (path === "/dashboard/jobs") return role === "recruiter";
  if (path === "/dashboard/jobs/new") return role === "recruiter" || role === "admin";
  if (path.startsWith("/dashboard/candidates")) return role === "recruiter" || role === "admin";
  if (path.startsWith("/dashboard/explore") || path.startsWith("/dashboard/applications")) return role === "candidate";
  return true;
}
