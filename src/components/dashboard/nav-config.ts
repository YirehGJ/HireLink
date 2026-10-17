import {
  Briefcase,
  Building2,
  FileText,
  Home,
  LayoutDashboard,
  Search,
  Settings,
  Shield,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

/**
 * Opciones del menú por rol (Code Smell #7: un mapa en vez de condicionales).
 * Lo comparten el menú lateral y la barra superior del celular.
 */
export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

export const NAV_CONFIG: Record<UserRole, NavItem[]> = {
  candidate: [
    { label: "Inicio", icon: Home, href: "/dashboard" },
    { label: "Explorar Vacantes", icon: Search, href: "/dashboard/explore" },
    { label: "Mi Perfil", icon: User, href: "/dashboard/profile" },
    { label: "Mis Postulaciones", icon: FileText, href: "/dashboard/applications" },
    { label: "Configuración", icon: Settings, href: "/dashboard/settings" },
  ],
  recruiter: [
    { label: "Vacantes", icon: Briefcase, href: "/dashboard/jobs" },
    { label: "Candidatos", icon: Users, href: "/dashboard/candidates" },
    { label: "Perfil", icon: User, href: "/dashboard/profile" },
    { label: "Configuración", icon: Settings, href: "/dashboard/settings" },
  ],
  admin: [
    { label: "Panel Principal", icon: LayoutDashboard, href: "/dashboard/admin/overview" },
    { label: "Gestión Usuarios", icon: Users, href: "/dashboard/admin/users" },
    { label: "Organizaciones", icon: Building2, href: "/dashboard/admin/organizations" },
    { label: "Gestión Vacantes", icon: Briefcase, href: "/dashboard/admin/jobs" },
    { label: "Auditoría", icon: Shield, href: "/dashboard/admin/audit" },
    { label: "Mi Perfil", icon: User, href: "/dashboard/profile" },
    { label: "Configuración", icon: Settings, href: "/dashboard/settings" },
  ],
};

/** Página de inicio de un rol: la primera opción de su menú. */
export function homeFor(role: UserRole | null | undefined): string {
  return (role && NAV_CONFIG[role]?.[0]?.href) || "/dashboard";
}
