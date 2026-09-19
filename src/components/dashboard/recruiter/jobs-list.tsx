"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, ExternalLink, Search, Building2 } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { useCollection } from "@/firebase";
import type { Job } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusText: Record<Job['status'], string> = {
  published: 'Publicada',
  draft: 'Borrador',
  closed: 'Cerrada',
};

function ApplicantsCount({ jobId }: { jobId: string }) {
  const { data } = useCollection(`jobs/${jobId}/applications`);
  return (
    <div className="flex items-center text-muted-foreground">
      <Users className="h-4 w-4 mr-2" />
      <span>{data?.length ?? 0} aplicantes</span>
    </div>
  );
}

export function JobsList() {
  const { user } = useApp();
  const { data: recruiterJobs, loading } = useCollection<Job>(
    user?.organizationRef ? "jobs" : null,
    { where: user?.organizationRef ? ["organizationRef", "==", user.organizationRef] : undefined }
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [seniority, setSeniority] = useState("all");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (recruiterJobs ?? [])
      .filter(j => status === "all" || j.status === status)
      .filter(j => seniority === "all" || j.seniority === seniority)
      .filter(j => !term || j.title.toLowerCase().includes(term) || j.location.toLowerCase().includes(term) ||
        (j.searchTags ?? []).some(t => t.toLowerCase().includes(term)));
  }, [recruiterJobs, search, status, seniority]);

  // Onboarding (S28): un reclutador sin empresa debe crearla primero.
  if (user && !user.organizationRef) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg space-y-3">
        <Building2 className="h-10 w-10 mx-auto text-muted-foreground" />
        <h3 className="text-xl font-semibold">Primero crea el perfil de tu empresa</h3>
        <p className="text-muted-foreground">Necesitas una organización para publicar vacantes y recibir candidatos.</p>
        <Button asChild><Link href="/dashboard/profile">Crear perfil de la empresa</Link></Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-56 w-full" />)}
      </div>
    );
  }

  if (!recruiterJobs || recruiterJobs.length === 0) {
      return (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h3 className="text-xl font-semibold">No tienes vacantes creadas</h3>
              <p className="text-muted-foreground mt-2">¡Crea tu primera vacante para empezar a reclutar!</p>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input className="pl-10" placeholder="Buscar por título, ubicación o habilidad…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="published">Publicadas</SelectItem>
            <SelectItem value="draft">Borradores</SelectItem>
            <SelectItem value="closed">Cerradas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={seniority} onValueChange={setSeniority}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los niveles</SelectItem>
            <SelectItem value="intern">Intern</SelectItem>
            <SelectItem value="junior">Junior</SelectItem>
            <SelectItem value="mid">Mid-level</SelectItem>
            <SelectItem value="senior">Senior</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">Ninguna vacante coincide con los filtros.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(job => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow duration-200 flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                        <CardTitle className="font-headline text-lg text-primary dark:text-primary-foreground/90">{job.title}</CardTitle>
                        <Badge variant={job.status === 'published' ? 'secondary' : job.status === 'closed' ? 'destructive' : 'outline'}>
                            {statusText[job.status]}
                        </Badge>
                    </div>
                    <CardDescription className="capitalize">{job.location} | {job.seniority}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <ApplicantsCount jobId={job.id} />
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href={`/dashboard/jobs/${job.id}`}>
                            Gestionar Vacante
                            <ExternalLink className="h-4 w-4 ml-2" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        ))}
        </div>
      )}
    </div>
  );
}
