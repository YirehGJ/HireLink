
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AdminUsersTable } from "@/components/dashboard/admin/admin-users-table";

export default function AdminUsersPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader 
                greeting="Supervisión de Cuentas"
                title="Gestión de Usuarios"
                description="Busca, visualiza y administra los roles y estados de los usuarios."
            />
            <AdminUsersTable />
        </div>
    );
}
