import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function CandidatesPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader 
                greeting="Encuentra Talento"
                title="Explorar Candidatos"
                description="Busca en la base de datos de candidatos y encuentra el ajuste perfecto."
            />
            <div className="space-y-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar por habilidad, titular o palabra clave..." 
                        className="pl-10 max-w-lg"
                    />
                </div>
                <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-semibold">Funcionalidad en desarrollo</h3>
                    <p>Aquí se mostrará la lista de candidatos que coincidan con tu búsqueda.</p>
                </div>
            </div>
        </div>
    );
}