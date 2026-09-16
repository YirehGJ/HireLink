
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AdminDashboard } from "@/components/dashboard/admin/admin-dashboard";

export default function AuditPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <DashboardHeader 
            greeting="Supervisión de la Plataforma"
            title="Auditoría y Equidad"
            description="Monitorea eventos clave y asegúrate de que el proceso sea justo y transparente."
        />
        <AdminDashboard />
    </div>
  );
}
