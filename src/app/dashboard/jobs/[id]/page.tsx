import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { getJob } from "@/lib/data";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function JobDetailsPage({ params }: { params: { id: string } }) {
    const job = getJob(params.id);

    if (!job) {
        notFound();
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader 
                greeting={`Vacante #${job.id}`}
                title={job.title}
                description="Gestiona los detalles, mira los aplicantes y agenda entrevistas."
                actions={
                    <Button variant="outline" asChild>
                        <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4"/>Volver a vacantes</Link>
                    </Button>
                }
            />
            <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold">En construcción</h3>
                <p>Aquí irán las pestañas de Detalles, Candidatos y Entrevistas.</p>
            </div>
        </div>
    );
}
