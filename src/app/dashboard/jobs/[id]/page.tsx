
"use client";

import { useApp } from "@/components/providers/app-provider";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { useDoc, useCollection } from "@/firebase";
import type { Job, Application, Organization } from "@/lib/types";
import { ArrowLeft, Calendar, FileText, Info, MapPin, Briefcase, Globe, Building2, Zap } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobForm } from "@/components/dashboard/recruiter/job-form";
import { ApplicantsTable } from "@/components/dashboard/recruiter/applicants-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InterviewsCalendar } from "@/components/dashboard/recruiter/interviews-calendar";
import { RecommendedCandidates } from "@/components/dashboard/recruiter/recommended-candidates";
import { JobStatusActions } from "@/components/dashboard/recruiter/job-status-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ApplyButton } from "@/components/dashboard/candidate/apply-button";

const JobViewForCandidate = ({ job }: { job: Job }) => {
    const { data: org } = useDoc<Organization>(`organizations/${job.organizationRef}`);
    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                        <CardTitle>{job.title}</CardTitle>
                        <CardDescription>{org?.name ? `${org.name} · ` : ''}{job.location} · {job.seniority}</CardDescription>
                    </div>
                    <ApplyButton job={job} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6 flex-wrap">
                    {org?.name && (
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>{org.name}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span className="capitalize">{job.seniority}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>{job.remoteAllowed ? "Remoto permitido" : "Solo presencial"}</span>
                    </div>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-line">{job.descriptionMd}</p>
                </div>
                <div className="mt-6">
                    <h4 className="font-semibold mb-2">Habilidades Requeridas</h4>
                    <div className="flex flex-wrap gap-2">
                        {job.searchTags.map(tag => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                    </div>
                </div>
                {org?.description && (
                    <div className="mt-6">
                        <h4 className="font-semibold mb-2">Sobre la empresa</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{org.description}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default function JobDetailsPage({ params }: { params: { id: string } }) {
    const { role, user, isMounted } = useApp();
    const { data: job, loading: jobLoading } = useDoc<Job>(`jobs/${params.id}`);

    // Guard de acceso: un reclutador solo gestiona vacantes de su organización;
    // el admin ve todo; el candidato ve la ficha pública.
    const canManage =
        !!job && (role === 'admin' || (role === 'recruiter' && user?.organizationRef === job.organizationRef));

    const { data: applications, loading: appsLoading } = useCollection<Application>(
        canManage ? `jobs/${params.id}/applications` : null
    );

    if (!isMounted || !role || jobLoading) {
        return (
             <div className="p-4 sm:p-6 lg:p-8 space-y-8">
                <Skeleton className="h-16 w-1/2" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!job) {
        notFound();
    }

    const jobWithId = { ...job, id: params.id };
    const jobApplicants = applications ?? [];

    const backLink = role === 'candidate' ? '/dashboard/applications' : role === 'admin' ? '/dashboard/admin/jobs' : '/dashboard/jobs';

    if (role !== 'candidate' && !canManage) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 space-y-8">
                <DashboardHeader
                    greeting="Acceso restringido"
                    title="No puedes gestionar esta vacante"
                    description="Solo los reclutadores de la organización dueña de la vacante (y los administradores) pueden gestionarla."
                    actions={
                        <Button variant="outline" asChild>
                            <Link href={backLink}><ArrowLeft className="mr-2 h-4 w-4"/>Volver</Link>
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader
                greeting={role === 'candidate' ? 'Detalles de la Vacante' : `Vacante · ${job.status === 'published' ? 'Publicada' : job.status === 'closed' ? 'Cerrada' : 'Borrador'}`}
                title={job.title}
                description={role === 'candidate' ? 'Revisa la información de la vacante y postúlate.' : "Gestiona los detalles, mira los aplicantes y agenda entrevistas."}
                actions={
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" asChild>
                            <Link href={backLink}><ArrowLeft className="mr-2 h-4 w-4"/>Volver</Link>
                        </Button>
                        {canManage && <JobStatusActions job={jobWithId} />}
                    </div>
                }
            />

            {role === 'candidate' ? (
                <JobViewForCandidate job={jobWithId} />
            ) : (
                <Tabs defaultValue="applicants" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-3xl mx-auto h-auto">
                        <TabsTrigger value="details">
                            <Info className="mr-2 h-4 w-4" />
                            Detalles
                        </TabsTrigger>
                        <TabsTrigger value="applicants">
                            <FileText className="mr-2 h-4 w-4" />
                            Candidatos ({appsLoading ? '…' : jobApplicants.length})
                        </TabsTrigger>
                        <TabsTrigger value="recommended">
                            <Zap className="mr-2 h-4 w-4" />
                            Recomendados
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
                                    <JobForm job={jobWithId} />
                                </div>
                            </CardContent>
                    </Card>
                    </TabsContent>
                    <TabsContent value="applicants" className="mt-6">
                        <ApplicantsTable applicants={jobApplicants} jobId={params.id} jobTitle={job.title} organizationRef={job.organizationRef} />
                    </TabsContent>
                    <TabsContent value="recommended" className="mt-6">
                        <RecommendedCandidates jobId={params.id} />
                    </TabsContent>
                    <TabsContent value="interviews" className="mt-6">
                        <InterviewsCalendar jobId={params.id} />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
