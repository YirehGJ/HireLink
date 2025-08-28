
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { getJob, applications, candidates } from "@/lib/data";
import { ArrowLeft, Calendar, FileText, Info } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobForm } from "@/components/dashboard/recruiter/job-form";
import { ApplicantsTable } from "@/components/dashboard/recruiter/applicants-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InterviewsCalendar } from "@/components/dashboard/recruiter/interviews-calendar";

export default function JobDetailsPage({ params }: { params: { id: string } }) {
    const job = getJob(params.id);

    if (!job) {
        notFound();
    }
    
    const jobApplicants = applications
        .filter(app => app.jobRef === job.id)
        .map(app => {
            const candidate = candidates.find(c => c.id === app.candidateRef);
            return { ...app, candidate };
        });

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader 
                greeting={`Vacante #${job.id}`}
                title={job.title}
                description="Gestiona los detalles, mira los aplicantes y agenda entrevistas."
                actions={
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/jobs"><ArrowLeft className="mr-2 h-4 w-4"/>Volver a vacantes</Link>
                    </Button>
                }
            />
            
            <Tabs defaultValue="applicants" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
                    <TabsTrigger value="details">
                        <Info className="mr-2 h-4 w-4" />
                        Detalles
                    </TabsTrigger>
                    <TabsTrigger value="applicants">
                        <FileText className="mr-2 h-4 w-4" />
                        Candidatos ({jobApplicants.length})
                    </TabsTrigger>
                    <TabsTrigger value="interviews">
                        <Calendar className="mr-2 h-4 w-4" />
                        Entrevistas
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="mt-6">
                   <Card>
                        <CardHeader>
                            <CardTitle>Editar Vacante</CardTitle>
                            <CardDescription>Modifica la información de la vacante y guarda los cambios.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="max-w-4xl">
                                <JobForm job={job} />
                            </div>
                        </CardContent>
                   </Card>
                </TabsContent>
                <TabsContent value="applicants" className="mt-6">
                    <ApplicantsTable applicants={jobApplicants} />
                </TabsContent>
                 <TabsContent value="interviews" className="mt-6">
                    <InterviewsCalendar />
                </TabsContent>
            </Tabs>
        </div>
    );
}
