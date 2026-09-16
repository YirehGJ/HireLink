
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { users, jobs, applications } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Shield, User } from "lucide-react";
import Link from "next/link";


const AdminOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Usuarios registrados en la plataforma</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vacantes Totales</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
             <p className="text-xs text-muted-foreground">Publicadas, borradores y cerradas</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Postulaciones Totales</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
             <p className="text-xs text-muted-foreground">Candidatos aplicados a vacantes</p>
          </CardContent>
        </Card>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/dashboard/admin/users" className="bg-card p-6 rounded-lg hover:bg-muted/50 transition-colors flex flex-col items-center text-center">
              <Users className="h-10 w-10 mb-2 text-primary"/>
              <h3 className="text-lg font-semibold">Gestionar Usuarios</h3>
              <p className="text-sm text-muted-foreground">Administrar roles y estados de los usuarios.</p>
          </Link>
          <Link href="/dashboard/admin/jobs" className="bg-card p-6 rounded-lg hover:bg-muted/50 transition-colors flex flex-col items-center text-center">
              <Briefcase className="h-10 w-10 mb-2 text-primary"/>
              <h3 className="text-lg font-semibold">Gestionar Vacantes</h3>
              <p className="text-sm text-muted-foreground">Moderar y supervisar todas las publicaciones.</p>
          </Link>
          <Link href="/dashboard/admin/audit" className="bg-card p-6 rounded-lg hover:bg-muted/50 transition-colors flex flex-col items-center text-center">
              <Shield className="h-10 w-10 mb-2 text-primary"/>
              <h3 className="text-lg font-semibold">Auditoría y Equidad</h3>
              <p className="text-sm text-muted-foreground">Monitorear la actividad de la plataforma.</p>
          </Link>
           <Link href="/dashboard/profile" className="bg-card p-6 rounded-lg hover:bg-muted/50 transition-colors flex flex-col items-center text-center">
              <User className="h-10 w-10 mb-2 text-primary"/>
              <h3 className="text-lg font-semibold">Ver mi Perfil</h3>
              <p className="text-sm text-muted-foreground">Visualiza la información de tu cuenta.</p>
          </Link>
      </div>
    </div>
  );

export default function AdminOverviewPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader 
                greeting="Bienvenido, Admin!"
                title="Panel de Administración"
                description="Supervisa la plataforma y asegura la equidad en los procesos."
            />
            <AdminOverview />
        </div>
    );
}
