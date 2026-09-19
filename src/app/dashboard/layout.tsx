import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
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
      <main className="flex-1 bg-muted/50 dark:bg-background/90">
        <ReadOnlyBanner />
        <AccountGuard>{children}</AccountGuard>
      </main>
    </SidebarProvider>
  );
}
