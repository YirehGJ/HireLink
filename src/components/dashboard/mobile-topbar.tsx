"use client";

import Link from "next/link";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Logo } from "@/components/brand/logo";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { homeFor } from "@/components/dashboard/nav-config";
import { useApp } from "@/components/providers/app-provider";

/**
 * Barra superior que solo existe en pantallas chicas (< 768 px): el botón que abre el menú, el logo y la campana de
 * avisos. En escritorio el menú es un panel fijo y esta barra se oculta.
 */
export function MobileTopBar() {
  const { isMobile } = useSidebar();
  const { user, role, readOnly } = useApp();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-1 border-b bg-background/95 px-2 backdrop-blur md:hidden">
      <SidebarTrigger className="h-11 w-11" />
      <Link href={homeFor(role)} className="flex items-center rounded-md px-1 py-1">
        <Logo className="h-11" />
      </Link>
      {/* El hueco mide lo mismo con o sin campana para que la barra no se mueva al cargar. */}
      <div className="ml-auto flex h-11 w-11 items-center justify-center">
        {isMobile && user && !readOnly && <NotificationBell uid={user.id} />}
      </div>
    </header>
  );
}
