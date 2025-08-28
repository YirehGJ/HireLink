
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function AdminUsersPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader 
                greeting="Supervisión de Cuentas"
                title="Gestión de Usuarios"
                description="Busca, visualiza y administra los roles y estados de los usuarios."
            />
            <div className="space-y-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar por nombre, email o rol..." 
                        className="pl-10 max-w-lg"
                    />
                </div>
                <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-semibold">Funcionalidad en desarrollo</h3>
                    <p>Aquí se mostrará una tabla con todos los usuarios de la plataforma.</p>
                </div>
            </div>
        </div>
    );
}
