
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function AdminJobsPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader 
                greeting="Supervisión de Contenido"
                title="Gestión de Vacantes"
                description="Busca, visualiza y modera todas las vacantes publicadas en la plataforma."
            />
            <div className="space-y-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar por título, empresa o palabra clave..." 
                        className="pl-10 max-w-lg"
                    />
                </div>
                <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-semibold">Funcionalidad en desarrollo</h3>
                    <p>Aquí se mostrará una tabla con todas las vacantes de la plataforma.</p>
                </div>
            </div>
        </div>
    );
}
