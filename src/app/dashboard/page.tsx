"use client";

import Link from "next/link";
import { useApp } from "@/components/providers/app-provider";
import { RecommendationFeed } from "@/components/dashboard/candidate/recommendation-feed";
import { JobsList } from "@/components/dashboard/recruiter/jobs-list";
import { AdminDashboard } from "@/components/dashboard/admin/admin-dashboard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { role, user, isMounted } = useApp();

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Buenos días";
    if (hours < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  if (!isMounted) {
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <DashboardHeader 
        greeting={`${getGreeting()}, ${user.fullName.split(' ')[0]}!`}
        title={titles[role]}
        description={descriptions[role]}
        actions={actions[role]}
      />
      
      {role === "candidate" && <RecommendationFeed />}
      {role === "recruiter" && <JobsList />}
      {role === "admin" && <AdminDashboard />}
    </div>
  );
}
