
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Briefcase,
  Home,
  Settings,
  User,
  Shield,
  LogOut,
  Users,
  FileText,
  LayoutDashboard,
  Search,
  Building2,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { Icons } from "@/components/icons";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { useApp } from "@/components/providers/app-provider";
import { useAuth } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserRole } from "@/lib/types";

/**
 * @fileOverview Refactorización de Sidebar utilizando un mapa de navegación (Code Smell #7).
 * Mejora la mantenibilidad y elimina condicionales excesivos.
 */

interface NavItem {
  label: string;
  icon: any;
  href: string;
}

const NAV_CONFIG: Record<UserRole, NavItem[]> = {
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

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, role, setUser, isMounted, readOnly } = useApp();

  const isActive = (path: string) => {
    if (["/dashboard", "/dashboard/jobs", "/dashboard/admin/overview"].includes(path)) {
      return pathname === path;
    }
    return pathname.startsWith(path);
  }

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (auth) await signOut(auth);
    setUser(null);
    router.push('/');
  }

  if (!isMounted || !role || !user) {
    return (
      <Sidebar variant="sidebar" collapsible="none" className="border-r">
        <SidebarHeader className="h-20 flex items-center px-4"><Skeleton className="h-8 w-32" /></SidebarHeader>
        <SidebarContent className="p-4 space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </SidebarContent>
        <SidebarFooter className="p-4"><Skeleton className="h-20 w-full" /></SidebarFooter>
      </Sidebar>
    );
  }

  const navItems = NAV_CONFIG[role] || [];
  const dashboardHome = navItems[0]?.href || '/dashboard';

  return (
    <Sidebar variant="sidebar" collapsible="none">
      <SidebarHeader className="h-20 items-center justify-between flex-row px-4">
        <Link href={dashboardHome} className="flex items-center gap-2">
          <Icons.logo className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold font-headline tracking-tighter">HireLink</span>
        </Link>
        {!readOnly && <NotificationBell uid={user.id} />}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 gap-2">
        <SidebarSeparator className="mb-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-12">
              <div className="flex w-full items-center gap-3">
                <Avatar className="h-9 w-9 border">
                  <AvatarImage src={`https://picsum.photos/seed/${user.id}/100/100`} />
                  <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-sm font-semibold truncate">{user.fullName}</span>
                  <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild onClick={handleLogout} className="text-destructive hover:text-destructive">
              <Link href="/"><LogOut /><span>Cerrar Sesión</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
