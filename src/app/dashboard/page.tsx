
"use client";

import Link from "next/link";
import { useApp } from "@/components/providers/app-provider";
import { RecommendationFeed } from "@/components/dashboard/candidate/recommendation-feed";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Briefcase, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { redirect, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { users, jobs, applications } from "@/lib/data";

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
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  </div>
);


export default function DashboardPage() {
  const { role, user, isMounted } = useApp();
  const pathname = usePathname();

  useEffect(() => {
    if (isMounted && role === 'recruiter' && pathname === '/dashboard') {
        redirect('/dashboard/jobs');
    }
  }, [role, isMounted, pathname]);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Buenos días";
    if (hours < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  if (!isMounted || !user) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="flex justify-between">
          <div>
            <Skeleton className="h-5 w-48 mb-2"/>
            <Skeleton className="h-9 w-64 mb-2"/>
            <Skeleton className="h-5 w-80"/>
          </div>
          <Skeleton className="h-10 w-36"/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const recruiterActions = (
      <Button asChild>
        <Link href="/dashboard/jobs/new">
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Vacante
        </Link>
      </Button>
  );

  const titles = {
    candidate: "Tus Próximas Oportunidades",
    recruiter: "Gestión de Vacantes",
    admin: "Panel de Administración",
  };

  const descriptions = {
    candidate: "Basado en tu perfil, estas son las vacantes que mejor se ajustan a ti.",
    recruiter: "Administra tus publicaciones y encuentra al candidato ideal.",
    admin: "Supervisa la plataforma y asegura la equidad en los procesos.",
  };

  const actions = {
    recruiter: recruiterActions,
    candidate: null,
    admin: null,
  }
  
  if (role === 'recruiter') {
      // Redirect handled by useEffect
      return null;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <DashboardHeader 
        greeting={`${getGreeting()}, ${user.fullName.split(' ')[0]}!`}
        title={titles[role!]}
        description={descriptions[role!]}
        actions={actions[role!]}
      />
      
      {role === "candidate" && <RecommendationFeed />}
      {role === "admin" && <AdminOverview />}
    </div>
  );
}
