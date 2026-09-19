
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

export default function CandidatesPage() {
    const { data: candidates, loading } = useCollection<Candidate>("candidates");
    const [search, setSearch] = useState("");
    const [minLevel, setMinLevel] = useState("0");
    const [onlyAvailable, setOnlyAvailable] = useState(false);

    const filtered = useMemo(() => {
        if (!candidates) return [];
        const term = search.trim().toLowerCase();
        const level = Number(minLevel);
        return candidates.filter(c => {
            if (onlyAvailable && !c.available) return false;
            const skills = c.skills ?? [];
            if (level > 0 && !skills.some(s => s.level >= level)) return false;
            if (!term) return true;
            return (
                c.headline?.toLowerCase().includes(term) ||
                c.fullName?.toLowerCase().includes(term) ||
                c.location?.toLowerCase().includes(term) ||
                skills.some(s => s.name.toLowerCase().includes(term))
            );
        });
    }, [candidates, search, minLevel, onlyAvailable]);

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
                            className="pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={minLevel} onValueChange={setMinLevel}>
                        <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">Cualquier nivel</SelectItem>
                            <SelectItem value="3">Alguna skill nivel 3+</SelectItem>
                            <SelectItem value="4">Alguna skill nivel 4+</SelectItem>
                            <SelectItem value="5">Alguna skill nivel 5</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                        <Switch id="available" checked={onlyAvailable} onCheckedChange={setOnlyAvailable} />
                        <Label htmlFor="available">Solo disponibles</Label>
                    </div>
                </div>
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-72 w-full" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <h3 className="text-xl font-semibold">No se encontraron candidatos</h3>
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
