
"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { useApp } from "@/components/providers/app-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { RecommendationFeed } from "@/components/dashboard/candidate/recommendation-feed";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { getGreeting } from "@/lib/utils";

export default function DashboardPage() {
  const { role, user, isMounted } = useApp();
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    if (isMounted) {
      setGreeting(getGreeting());
      
      const roleRedirects: Record<string, string> = {
        recruiter: '/dashboard/jobs',
        admin: '/dashboard/admin/overview'
      };

      if (role && roleRedirects[role]) {
        redirect(roleRedirects[role]);
      }
    }
  }, [role, isMounted]);

  if (!isMounted || !user || role !== 'candidate') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48"/>
            <Skeleton className="h-9 w-64"/>
            <Skeleton className="h-5 w-80"/>
          </div>
          <Skeleton className="h-10 w-36"/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        greeting={`${greeting}, ${user.fullName.split(' ')[0]}!`}
        title="Tus Próximas Oportunidades"
        description="Basado en tu perfil, estas son las vacantes que mejor se ajustan a ti."
      />
      <RecommendationFeed />
    </div>
  );
}
