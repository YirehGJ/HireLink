
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
} from "lucide-react";
import { Icons } from "@/components/icons";
import { useApp } from "@/components/providers/app-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, setUser, isMounted } = useApp();

  const isActive = (path: string) => {
    if (path === '/dashboard' || path === '/dashboard/jobs' || path === '/dashboard/admin/overview') {
        return pathname === path;
    }
    return pathname.startsWith(path);
  }

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    setUser(null);
    router.push('/');
  }

  const candidateNav = (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/dashboard")} tooltip="Inicio">
          <Link href="/dashboard"><Home /><span>Inicio</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/dashboard/profile")} tooltip="Perfil">
          <Link href="/dashboard/profile"><User /><span>Mi Perfil</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/dashboard/applications")} tooltip="Postulaciones">
          <Link href="/dashboard/applications"><FileText /><span>Mis Postulaciones</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
       <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/dashboard/settings")} tooltip="Configuración">
          <Link href="/dashboard/settings"><Settings /><span>Configuración</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );

  const recruiterNav = (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/dashboard/jobs")} tooltip="Vacantes">
          <Link href="/dashboard/jobs"><Briefcase /><span>Vacantes</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/dashboard/candidates")} tooltip="Candidatos">
          <Link href="/dashboard/candidates"><Users /><span>Candidatos</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
       <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/dashboard/profile")} tooltip="Perfil">
          <Link href="/dashboard/profile"><User /><span>Perfil</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
       <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/dashboard/settings")} tooltip="Configuración">
          <Link href="/dashboard/settings"><Settings /><span>Configuración</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );

  const adminNav = (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/dashboard/admin/overview")} tooltip="Panel Principal">
          <Link href="/dashboard/admin/overview"><LayoutDashboard /><span>Panel Principal</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/dashboard/admin/users")} tooltip="Usuarios">
          <Link href="/dashboard/admin/users"><Users /><span>Gestión de Usuarios</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
       <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/dashboard/admin/jobs")} tooltip="Vacantes">
          <Link href="/dashboard/admin/jobs"><Briefcase /><span>Gestión de Vacantes</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/dashboard/admin/audit")} tooltip="Auditoría">
          <Link href="/dashboard/admin/audit"><Shield /><span>Auditoría y Equidad</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/dashboard/profile")} tooltip="Perfil">
          <Link href="/dashboard/profile"><User /><span>Mi Perfil</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
       <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/dashboard/settings")} tooltip="Configuración">
          <Link href="/dashboard/settings"><Settings /><span>Configuración</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );

  if (!isMounted || !role || !user) {
    return (
      <Sidebar variant="sidebar" collapsible="none">
        <SidebarHeader>
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-24" />
        </SidebarHeader>
        <SidebarContent className="p-2 space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </SidebarContent>
        <SidebarFooter>
          <div className="px-2 py-4 space-y-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
          <Skeleton className="h-20 w-full" />
        </SidebarFooter>
      </Sidebar>
    )
  }

  const roleHomeMap = {
    candidate: '/dashboard',
    recruiter: '/dashboard/jobs',
    admin: '/dashboard/admin/overview',
  };

  const dashboardHome = roleHomeMap[role] || '/dashboard';

  return (
    <Sidebar variant="sidebar" collapsible="none">
      <SidebarHeader className="items-center justify-center text-center">
        <Link href={dashboardHome} className="flex items-center gap-2">
          <Icons.logo className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold font-headline tracking-tighter">HireLink</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {role === 'candidate' && candidateNav}
          {role === 'recruiter' && recruiterNav}
          {role === 'admin' && adminNav}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="flex-col gap-4">
        <SidebarSeparator />
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={user.fullName}>
                    <div className="flex w-full items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage data-ai-hint="person" src={`https://picsum.photos/seed/${user.id}/100/100`} />
                            <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-left overflow-hidden">
                            <span className="text-sm font-medium truncate">{user.fullName}</span>
                            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                        </div>
                    </div>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Cerrar Sesión" onClick={handleLogout}>
                    <Link href="/"><LogOut /><span>Cerrar Sesión</span></Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
