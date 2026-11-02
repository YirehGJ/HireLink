
"use client";

import { useEffect } from "react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { Logo } from "@/components/brand/logo";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { NAV_CONFIG, homeFor } from "@/components/dashboard/nav-config";
import { useApp } from "@/components/providers/app-provider";
import { useAuth } from "@/firebase";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { markIntentionalSignOut } from "@/lib/auth-flags";

/**
 * Menú lateral. En escritorio es un panel fijo; en el celular es un panel que se abre con el botón de la barra
 * superior (MobileTopBar) y se cierra al elegir una opción. Las opciones salen de `nav-config.ts`.
 */
export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, role, setUser, isMounted, readOnly } = useApp();
  const { isMobile, setOpenMobile } = useSidebar();

  // En el celular, al navegar se cierra el panel.
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  const isActive = (path: string) => {
    if (["/dashboard", "/dashboard/jobs", "/dashboard/admin/overview"].includes(path)) {
      return pathname === path;
    }
    return pathname.startsWith(path);
  }

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    markIntentionalSignOut();
    if (auth) await signOut(auth);
    setUser(null);
    router.push('/');
  }

  if (!isMounted || !role || !user) {
    return (
      <Sidebar variant="sidebar" role="complementary" aria-label="Barra lateral">
        <SidebarHeader className="h-20 flex items-center px-4"><Skeleton className="h-8 w-32" /></SidebarHeader>
        <SidebarContent className="p-4 space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </SidebarContent>
        <SidebarFooter className="p-4"><Skeleton className="h-20 w-full" /></SidebarFooter>
      </Sidebar>
    );
  }

  const navItems = NAV_CONFIG[role] || [];

  return (
    <Sidebar variant="sidebar" role="complementary" aria-label="Barra lateral">
      <SidebarHeader className="h-20 items-center justify-between flex-row px-4">
        <Link href={homeFor(role)} className="flex items-center">
          <Logo className="h-14" />
        </Link>
        {/* En el celular la campana vive en la barra superior (MobileTopBar), siempre a la vista. */}
        {!readOnly && !isMobile && <NotificationBell uid={user.id} />}
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Menú principal">
          <SidebarMenu className="px-2">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                  <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </nav>
      </SidebarContent>
      <SidebarFooter className="p-2 gap-2">
        <SidebarSeparator className="mb-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-12">
              <div className="flex w-full items-center gap-3">
                <UserAvatar name={user.fullName} seed={user.id} className="h-9 w-9 border" />
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-sm font-semibold truncate">{user.fullName}</span>
                  <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild onClick={handleLogout} className="text-destructive-text hover:text-destructive-text">
              <Link href="/"><LogOut /><span>Cerrar Sesión</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
