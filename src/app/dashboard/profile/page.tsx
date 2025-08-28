import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function ProfilePage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader 
                greeting="Tu Espacio"
                title="Mi Perfil Profesional"
                description="Mantén tu información actualizada para recibir las mejores recomendaciones."
            />
            <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold">En construcción</h3>
                <p>Aquí irá el formulario para editar el perfil y subir el CV.</p>
            </div>
        </div>
    );
}
