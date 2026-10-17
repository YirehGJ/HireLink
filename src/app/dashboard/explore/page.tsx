
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, MapPin, Briefcase } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection } from "@/firebase";
import { toMillis } from "@/lib/firestore-time";
import { SENIORITY_OPTIONS, matchesText, normalizeText, seniorityLabel } from "@/lib/format";
import { stripMarkdown } from "@/lib/markdown";
import type { Job } from "@/lib/types";

export default function ExploreJobsPage() {
    const { data: jobs, loading } = useCollection<Job>("jobs", { where: ["status", "==", "published"] });
    const [search, setSearch] = useState("");
    const [seniority, setSeniority] = useState("all");
    const [mode, setMode] = useState("all");
    const [postedWithin, setPostedWithin] = useState("all");

    const filtered = useMemo(() => {
        const term = normalizeText(search.trim());
        const maxAgeMs = postedWithin === "all" ? null : Number(postedWithin) * 24 * 60 * 60 * 1000;
        const now = Date.now();
        return (jobs ?? [])
            .filter(j => seniority === "all" || j.seniority === seniority)
            .filter(j => mode === "all" || (mode === "remote" ? j.remoteAllowed : !j.remoteAllowed))
            .filter(j => !maxAgeMs || now - toMillis(j.createdAt as any) <= maxAgeMs)
            .filter(j =>
                !term ||
                matchesText(j.title, term) ||
                matchesText(j.location, term) ||
                (j.searchTags ?? []).some(t => matchesText(t, term))
            )
            .sort((a, b) => toMillis(b.createdAt as any) - toMillis(a.createdAt as any));
    }, [jobs, search, seniority, mode, postedWithin]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader
                greeting="Encuentra tu siguiente paso"
                title="Explorar Vacantes"
                description="Busca por título, ubicación o habilidades y filtra por seniority y modalidad."
            />
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[240px] max-w-lg">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input className="pl-10" placeholder="Título, ubicación o habilidad…" aria-label="Buscar vacantes" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={seniority} onValueChange={setSeniority}>
                    <SelectTrigger className="w-[170px]" aria-label="Filtrar por seniority"><SelectValue placeholder="Seniority" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los niveles</SelectItem>
                        {SENIORITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger className="w-[170px]" aria-label="Filtrar por modalidad"><SelectValue placeholder="Modalidad" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toda modalidad</SelectItem>
                        <SelectItem value="remote">Remoto permitido</SelectItem>
                        <SelectItem value="onsite">Solo presencial</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={postedWithin} onValueChange={setPostedWithin}>
                    <SelectTrigger className="w-[170px]" aria-label="Filtrar por fecha de publicación"><SelectValue placeholder="Fecha" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Cualquier fecha</SelectItem>
                        <SelectItem value="1">Últimas 24 horas</SelectItem>
                        <SelectItem value="7">Últimos 7 días</SelectItem>
                        <SelectItem value="30">Últimos 30 días</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {!loading && (
                <p className="text-sm text-muted-foreground" aria-live="polite">
                    {filtered.length} {filtered.length === 1 ? "vacante" : "vacantes"}
                </p>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-56 w-full" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold">No hay vacantes que coincidan</h2>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map(job => (
                        <Card key={job.id} className="flex flex-col hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="font-headline text-lg text-primary dark:text-primary-foreground/90">{job.title}</CardTitle>
                                <CardDescription className="flex flex-wrap items-center gap-3">
                                    <span className="flex items-center"><MapPin className="h-4 w-4 mr-1.5" />{job.location}</span>
                                    <span className="flex items-center"><Briefcase className="h-4 w-4 mr-1.5" />{seniorityLabel(job.seniority)}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-3">
                                <p className="text-sm text-muted-foreground line-clamp-3">{stripMarkdown(job.descriptionMd)}</p>
                                <div className="flex flex-wrap gap-2">
                                    {(job.searchTags ?? []).filter(Boolean).slice(0, 5).map((t, i) => <Badge key={`${t}-${i}`} variant="secondary">{t}</Badge>)}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href={`/dashboard/jobs/${job.id}`}>Ver y postularme</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
