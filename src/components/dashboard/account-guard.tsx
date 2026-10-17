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

// Título de cada pantalla (el mismo que muestra su encabezado). Mientras se confirma la sesión y se carga el rol, el
// esqueleto ya muestra el título: aparece con el HTML inicial, antes de que cargue el JavaScript y Firestore, y la
// persona sabe dónde está en vez de ver cajas grises. Es lo que más baja el tiempo hasta el contenido principal (LCP).
const TITULOS: Record<string, string> = {
  "/dashboard/explore": "Explorar Vacantes",
  "/dashboard/profile": "Mi Perfil Profesional",
  "/dashboard/applications": "Mis Postulaciones",
  "/dashboard/settings": "Configuración",
  "/dashboard/jobs": "Gestión de Vacantes",
  "/dashboard/jobs/new": "Crear Nueva Vacante",
  "/dashboard/candidates": "Explorar Candidatos",
  "/dashboard/admin/overview": "Panel de Administración",
  "/dashboard/admin/users": "Gestión de Usuarios",
  "/dashboard/admin/organizations": "Organizaciones",
  "/dashboard/admin/jobs": "Gestión de Vacantes",
  "/dashboard/admin/audit": "Auditoría y Equidad",
};
const TITULO_INICIO_CANDIDATO = "Tus Próximas Oportunidades";
// Último rol conocido en este navegador: solo sirve para elegir el título provisional de /dashboard (el inicio
// del candidato; reclutadores y administradores son redirigidos a su propia pantalla).
const ULTIMO_ROL_KEY = "hirelink:ultimo-rol";

function GuardSkeleton({ pathname }: { pathname: string }) {
  const [ultimoRol, setUltimoRol] = React.useState<string | null>(null);
  React.useEffect(() => {
    try {
      setUltimoRol(localStorage.getItem(ULTIMO_ROL_KEY));
    } catch {
      /* sin almacenamiento: se muestra el esqueleto sin título */
    }
  }, []);
  const path = pathname.replace(/\/+$/, "") || "/";
  const titulo = path === "/dashboard" ? (ultimoRol === "candidate" ? TITULO_INICIO_CANDIDATO : undefined) : TITULOS[path];
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8" aria-busy="true" aria-label="Cargando">
      <div>
        <Skeleton className="h-5 w-48" />
        {titulo ? (
          <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">{titulo}</h1>
        ) : (
          <Skeleton className="my-1 h-9 w-64" />
        )}
        <Skeleton className="mt-1 h-6 w-80" />
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

  React.useEffect(() => {
    if (!user?.role) return;
    try {
      localStorage.setItem(ULTIMO_ROL_KEY, user.role);
    } catch {
      /* sin almacenamiento */
    }
  }, [user?.role]);

  if (authLoading || !authUser || !isMounted || !user) return <GuardSkeleton pathname={pathname} />;

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
