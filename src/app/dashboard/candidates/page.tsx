
"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { CandidateCard } from "@/components/dashboard/recruiter/candidate-card";
import { useCollection } from "@/firebase";
import type { Candidate } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { SENIORITY_OPTIONS, matchesText, normalizeText } from "@/lib/format";
import { usePendingRecruiter } from "@/components/dashboard/recruiter/pending-approval-banner";

export default function CandidatesPage() {
    const pending = usePendingRecruiter();
    // Una reclutadora sin aprobar no lee candidatas: no se consulta y se explica por qué.
    const { data: candidates, loading, error } = useCollection<Candidate>(pending ? null : "candidates");
    const [search, setSearch] = useState("");
    const [minLevel, setMinLevel] = useState("0");
    const [onlyAvailable, setOnlyAvailable] = useState(false);
    const [targetSeniority, setTargetSeniority] = useState("all");

    const filtered = useMemo(() => {
        if (!candidates) return [];
        const term = normalizeText(search.trim());
        const level = Number(minLevel);
        return candidates.filter(c => {
            if (onlyAvailable && !c.available) return false;
            if (targetSeniority !== "all" && c.targetSeniority !== targetSeniority) return false;
            const skills = c.skills ?? [];
            if (level > 0 && !skills.some(s => s.level >= level)) return false;
            if (!term) return true;
            return (
                matchesText(c.headline, term) ||
                matchesText(c.fullName, term) ||
                matchesText(c.location, term) ||
                skills.some(s => matchesText(s.name, term))
            );
        });
    }, [candidates, search, minLevel, onlyAvailable, targetSeniority]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader
                greeting="Encuentra Talento"
                title="Explorar Candidatos"
                description="Busca en la base de datos de candidatos y encuentra el ajuste perfecto."
            />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[240px] max-w-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Habilidad, titular, nombre o ubicación..."
                            aria-label="Buscar candidatos"
                            className="pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={minLevel} onValueChange={setMinLevel}>
                        <SelectTrigger className="w-[190px]" aria-label="Nivel mínimo de habilidad"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">Cualquier nivel</SelectItem>
                            <SelectItem value="3">Alguna skill nivel 3+</SelectItem>
                            <SelectItem value="4">Alguna skill nivel 4+</SelectItem>
                            <SelectItem value="5">Alguna skill nivel 5</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={targetSeniority} onValueChange={setTargetSeniority}>
                        <SelectTrigger className="w-[190px]" aria-label="Seniority objetivo"><SelectValue placeholder="Seniority objetivo" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Cualquier seniority</SelectItem>
                            {SENIORITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                        <Switch id="available" checked={onlyAvailable} onCheckedChange={setOnlyAvailable} />
                        <Label htmlFor="available">Solo disponibles</Label>
                    </div>
                </div>
                {!loading && !pending && !error && (
                    <p className="text-sm text-muted-foreground" aria-live="polite">
                        {filtered.length} {filtered.length === 1 ? "candidato" : "candidatos"}
                    </p>
                )}
                {pending ? (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg" role="status">
                        <h2 className="text-xl font-semibold">Verás a las candidatas cuando tu cuenta sea aprobada</h2>
                        <p className="mt-2 text-muted-foreground">Un administrador revisa las cuentas de reclutadoras antes de darles acceso a los perfiles.</p>
                    </div>
                ) : loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-72 w-full" />)}
                    </div>
                ) : error ? (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg" role="alert">
                        <h2 className="text-xl font-semibold">No se pudieron cargar los candidatos</h2>
                        <p className="mt-2 text-muted-foreground">Revisa tu conexión y recarga la página. Si sigue igual, avisa al equipo.</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <h2 className="text-xl font-semibold">No se encontraron candidatos</h2>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {filtered.map(candidate => (
                            <CandidateCard key={candidate.id} candidate={candidate} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
