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
  const { user, role, setRole, isMounted } = useApp();

  const isActive = (path: string) => pathname === path;

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem('hirelink-role');
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
    </>
  );

  const recruiterNav = (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/dashboard")} tooltip="Vacantes">
          <Link href="/dashboard"><Briefcase /><span>Vacantes</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );

  const adminNav = (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/dashboard")} tooltip="Auditoría">
          <Link href="/dashboard"><Shield /><span>Auditoría y Equidad</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );

  if (!isMounted || !role || !user) {
    return (
      <Sidebar variant="sidebar" collapsible="icon">
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

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="items-center justify-center text-center">
        <Link href="/dashboard" className="flex items-center gap-2">
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
        <div className="px-2 space-y-2">
            <Label className="text-xs text-muted-foreground px-2">Cambiar Rol (Demo)</Label>
            <Select onValueChange={(value) => setRole(value as any)} defaultValue={role}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="candidate">Candidato</SelectItem>
                <SelectItem value="recruiter">Reclutador</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
        </div>
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
