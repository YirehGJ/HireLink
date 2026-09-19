
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AdminOrganizations } from "@/components/dashboard/admin/admin-organizations";

export default function AdminOrganizationsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <DashboardHeader
        greeting="Multi-empresa"
        title="Organizaciones"
        description="Da de alta y edita empresas; cada reclutador solo ve los datos de la suya."
      />
      <AdminOrganizations />
    </div>
  );
}
