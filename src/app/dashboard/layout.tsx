import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { AppProvider } from "@/components/providers/app-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <SidebarProvider>
        <DashboardSidebar />
        <main className="flex-1 bg-card/50 dark:bg-background">
          {children}
        </main>
      </SidebarProvider>
    </AppProvider>
  );
}
