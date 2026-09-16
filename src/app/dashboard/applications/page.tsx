
"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ApplicationsTable } from "@/components/dashboard/candidate/applications-table";
import { useApp } from "@/components/providers/app-provider";
import { useCandidateApplications } from "@/firebase/firestore/use-candidate-applications";
import { Skeleton } from "@/components/ui/skeleton";

export default function ApplicationsPage() {
    const { user, isMounted } = useApp();
    const { data: applications, loading } = useCandidateApplications(user?.id ?? null);

    if (!isMounted || !user || loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 space-y-8">
                <Skeleton className="h-16 w-1/2" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader
                greeting="Tu Historial"
                title="Mis Postulaciones"
                description="Sigue el estado de las vacantes a las que has aplicado."
            />
            <ApplicationsTable applications={applications ?? []} />
        </div>
    );
}
