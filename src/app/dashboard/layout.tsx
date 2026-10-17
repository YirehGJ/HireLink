import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MobileTopBar } from "@/components/dashboard/mobile-topbar";
import { ReadOnlyBanner } from "@/components/dashboard/read-only-banner";
import { AccountGuard } from "@/components/dashboard/account-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main id="contenido" tabIndex={-1} className="flex-1 bg-muted/50 dark:bg-background/90 focus:outline-none">
          <ReadOnlyBanner />
          <AccountGuard>{children}</AccountGuard>
        </main>
      </div>
    </SidebarProvider>
  );
}
