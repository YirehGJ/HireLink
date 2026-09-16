import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { JobForm } from "@/components/dashboard/recruiter/job-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewJobPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader 
                greeting="Reclutador"
                title="Crear Nueva Vacante"
                description="Completa el formulario para publicar una nueva oportunidad de empleo."
                actions={
                    <Button variant="outline" asChild>
                        <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4"/>Volver a vacantes</Link>
                    </Button>
                }
            />
            <div className="max-w-4xl mx-auto">
                <JobForm />
            </div>
        </div>
    );
}
