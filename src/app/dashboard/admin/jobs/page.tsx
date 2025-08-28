
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AdminJobsTable } from "@/components/dashboard/admin/admin-jobs-table";

export default function AdminJobsPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader 
                greeting="Supervisión de Contenido"
                title="Gestión de Vacantes"
                description="Busca, visualiza y modera todas las vacantes publicadas en la plataforma."
            />
            <AdminJobsTable />
        </div>
    );
}
