
"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ApplicationsTable } from "@/components/dashboard/candidate/applications-table";
import { applications, jobs, candidates } from "@/lib/data";
import type { Application, Job } from "@/lib/types";
import { useApp } from "@/components/providers/app-provider";
import { Skeleton } from "@/components/ui/skeleton";

interface ApplicationWithJob extends Application {
    job: Job | undefined;
}

export default function ApplicationsPage() {
    const { user, isMounted } = useApp();

    if (!isMounted || !user) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 space-y-8">
                <Skeleton className="h-16 w-1/2" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }
    
    const candidateProfile = candidates.find(c => c.userRef === user.id);
    const userApplications: ApplicationWithJob[] = candidateProfile 
        ? applications
            .filter(app => app.candidateRef === candidateProfile.id)
            .map(app => ({
                ...app,
                job: jobs.find(job => job.id === app.jobRef)
            }))
        : [];

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader 
                greeting="Tu Historial"
                title="Mis Postulaciones"
                description="Sigue el estado de las vacantes a las que has aplicado."
            />
            <ApplicationsTable applications={userApplications} />
        </div>
    );
}
