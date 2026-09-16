
"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { CandidateCard } from "@/components/dashboard/recruiter/candidate-card";
import { useCollection } from "@/firebase";
import type { Candidate } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";

export default function CandidatesPage() {
    const { data: candidates, loading } = useCollection<Candidate>("candidates");
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!candidates) return [];
        const term = search.trim().toLowerCase();
        if (!term) return candidates;
        return candidates.filter(c =>
            c.headline?.toLowerCase().includes(term) ||
            c.skills?.some(s => s.name.toLowerCase().includes(term))
        );
    }, [candidates, search]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader
                greeting="Encuentra Talento"
                title="Explorar Candidatos"
                description="Busca en la base de datos de candidatos y encuentra el ajuste perfecto."
            />
            <div className="space-y-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por habilidad, titular o palabra clave..."
                        className="pl-10 max-w-lg"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
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
