
"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";
import { useApp } from "@/components/providers/app-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { RecommendationFeed } from "@/components/dashboard/candidate/recommendation-feed";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function DashboardPage() {
  const { role, user, isMounted } = useApp();

  useEffect(() => {
    if (isMounted) {
      if (role === 'recruiter') {
        redirect('/dashboard/jobs');
      } else if (role === 'admin') {
        redirect('/dashboard/admin/overview');
      }
    }
  }, [role, isMounted]);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Buenos días";
    if (hours < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  if (!isMounted || !user || role !== 'candidate') {
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
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <DashboardHeader 
        greeting={`${getGreeting()}, ${user.fullName.split(' ')[0]}!`}
        title="Tus Próximas Oportunidades"
        description="Basado en tu perfil, estas son las vacantes que mejor se ajustan a ti."
      />
      <RecommendationFeed />
    </div>
  );
}
