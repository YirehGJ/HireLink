
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, Shield, User, FileText, UserPlus, Building2 } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { useCollection, useAllApplications } from "@/firebase";
import { toMillis } from "@/lib/firestore-time";
import type { User as AppUser, Job, Organization } from "@/lib/types";

function Metric({ title, value, hint, icon: Icon, loading }: { title: string; value: number | string; hint: string; icon: any; loading: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{value}</div>}
                <p className="text-xs text-muted-foreground">{hint}</p>
            </CardContent>
        </Card>
    );
}

export default function AdminOverviewPage() {
    const { role, user } = useApp();
    const isAdmin = role === 'admin';
    const { data: users, loading: usersLoading } = useCollection<AppUser>(isAdmin ? "users" : null);
    const { data: jobs, loading: jobsLoading } = useCollection<Job>(isAdmin ? "jobs" : null);
    const { data: orgs, loading: orgsLoading } = useCollection<Organization>(isAdmin ? "organizations" : null);
    const { data: applications, loading: appsLoading } = useAllApplications(isAdmin);

    const stats = useMemo(() => {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const u = users ?? [];
        const j = jobs ?? [];
        const a = applications ?? [];
        return {
            candidates: u.filter(x => x.role === 'candidate').length,
            recruiters: u.filter(x => x.role === 'recruiter').length,
            open: j.filter(x => x.status === 'published').length,
            closed: j.filter(x => x.status === 'closed').length,
            recentApps: a.filter(x => toMillis(x.appliedAt as any) >= weekAgo).length,
        };
    }, [users, jobs, applications]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader
                greeting={`Bienvenido, ${user?.fullName?.split(' ')[0] ?? 'Admin'}!`}
                title="Panel de Administración"
                description="Supervisa la plataforma y asegura la equidad en los procesos."
            />
            <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Metric title="Usuarios Totales" value={users?.length ?? 0} hint={`${stats.candidates} candidatos · ${stats.recruiters} reclutadores`} icon={Users} loading={usersLoading} />
                    <Metric title="Nuevos candidatos" value={stats.candidates} hint="Candidatos registrados en la plataforma" icon={UserPlus} loading={usersLoading} />
                    <Metric title="Organizaciones" value={orgs?.length ?? 0} hint="Empresas con perfil activo" icon={Building2} loading={orgsLoading} />
                    <Metric title="Vacantes abiertas" value={stats.open} hint="Publicadas y recibiendo postulaciones" icon={Briefcase} loading={jobsLoading} />
                    <Metric title="Vacantes cerradas" value={stats.closed} hint={`${jobs?.length ?? 0} vacantes en total`} icon={Briefcase} loading={jobsLoading} />
                    <Metric title="Postulaciones" value={applications?.length ?? 0} hint={`${stats.recentApps} en los últimos 7 días`} icon={FileText} loading={appsLoading} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <Link href="/dashboard/admin/users" className="bg-card p-6 rounded-lg hover:bg-muted/50 transition-colors flex flex-col items-center text-center">
                        <Users className="h-10 w-10 mb-2 text-primary"/>
                        <h3 className="text-lg font-semibold">Gestionar Usuarios</h3>
                        <p className="text-sm text-muted-foreground">Roles, estados y modo &quot;ver como&quot;.</p>
                    </Link>
                    <Link href="/dashboard/admin/organizations" className="bg-card p-6 rounded-lg hover:bg-muted/50 transition-colors flex flex-col items-center text-center">
                        <Building2 className="h-10 w-10 mb-2 text-primary"/>
                        <h3 className="text-lg font-semibold">Organizaciones</h3>
                        <p className="text-sm text-muted-foreground">Empresas y sus reclutadores.</p>
                    </Link>
                    <Link href="/dashboard/admin/jobs" className="bg-card p-6 rounded-lg hover:bg-muted/50 transition-colors flex flex-col items-center text-center">
                        <Briefcase className="h-10 w-10 mb-2 text-primary"/>
                        <h3 className="text-lg font-semibold">Gestionar Vacantes</h3>
                        <p className="text-sm text-muted-foreground">Moderar y supervisar publicaciones.</p>
                    </Link>
                    <Link href="/dashboard/admin/audit" className="bg-card p-6 rounded-lg hover:bg-muted/50 transition-colors flex flex-col items-center text-center">
                        <Shield className="h-10 w-10 mb-2 text-primary"/>
                        <h3 className="text-lg font-semibold">Auditoría y KPIs</h3>
                        <p className="text-sm text-muted-foreground">Actividad y embudo de selección.</p>
                    </Link>
                    <Link href="/dashboard/profile" className="bg-card p-6 rounded-lg hover:bg-muted/50 transition-colors flex flex-col items-center text-center">
                        <User className="h-10 w-10 mb-2 text-primary"/>
                        <h3 className="text-lg font-semibold">Ver mi Perfil</h3>
                        <p className="text-sm text-muted-foreground">Información de tu cuenta.</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
