
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ApplicationsTable } from "@/components/dashboard/candidate/applications-table";
import { applications, jobs } from "@/lib/data";
import type { Application, Job } from "@/lib/types";

interface ApplicationWithJob extends Application {
    job: Job | undefined;
}

export default function ApplicationsPage() {
    // In a real app, this would be a filtered query based on the logged-in user
    const userApplications: ApplicationWithJob[] = applications
        .filter(app => app.candidateRef === 'candidate-1')
        .map(app => ({
            ...app,
            job: jobs.find(job => job.id === app.jobRef)
        }));

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
