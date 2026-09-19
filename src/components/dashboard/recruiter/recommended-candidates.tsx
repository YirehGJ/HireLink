"use client";

import * as React from "react";
import { Loader2, RefreshCw, Zap, MapPin, Briefcase, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, useCollection, useDoc } from "@/firebase";
import { callAuthedApi } from "@/lib/api-client";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/hooks/use-toast";
import type { Candidate, Recommendation } from "@/lib/types";

function RecommendedRow({ rec }: { rec: Recommendation }) {
  const { data: candidate } = useDoc<Candidate>(`candidates/${rec.candidateRef}`);
  const name = candidate?.fullName || candidate?.headline || "Candidato";

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <div>
          <p className="font-semibold">{name}</p>
          {candidate?.headline && candidate.fullName && (
            <p className="text-sm text-muted-foreground">{candidate.headline}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {candidate?.location && <span className="flex items-center"><MapPin className="h-4 w-4 mr-1.5" />{candidate.location}</span>}
          <span className="flex items-center"><Briefcase className="h-4 w-4 mr-1.5" />{candidate?.yearsOfExperience ?? 0} años exp.</span>
          {candidate?.email && (
            <a className="flex items-center text-primary hover:underline" href={`mailto:${candidate.email}`}>
              <Mail className="h-4 w-4 mr-1.5" />Contactar
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {rec.reasons.map((r, i) => <Badge key={i} variant="lilac">{r}</Badge>)}
        </div>
      </div>
      <Badge variant="secondary" className="font-bold self-start">
        <Zap className="h-3 w-3 mr-1" />{(rec.score * 100).toFixed(0)}% Match
      </Badge>
    </div>
  );
}

export function RecommendedCandidates({ jobId }: { jobId: string }) {
  const auth = useAuth();
  const { toast } = useToast();
  const { readOnly } = useApp();
  const [running, setRunning] = React.useState(false);
  const { data, loading } = useCollection<Recommendation>("recommendations", {
    where: ["jobRef", "==", jobId],
  });

  const sorted = React.useMemo(
    () => [...(data ?? [])].sort((a, b) => b.score - a.score),
    [data]
  );

  async function recompute() {
    if (!auth) return;
    setRunning(true);
    try {
      const res = await callAuthedApi(auth, "/api/recommendations/generate-for-job", { jobId });
      toast({ title: "Recomendaciones actualizadas", description: `${res.processed} candidatos evaluados por la IA.` });
    } catch (e) {
      console.error(e);
      toast({ title: "No se pudo recalcular", variant: "destructive" });
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Candidatos Recomendados</CardTitle>
            <CardDescription>La IA compara el perfil de cada candidato con esta vacante y explica por qué encajan.</CardDescription>
          </div>
          <Button variant="outline" onClick={recompute} disabled={running || readOnly}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {running ? "Analizando…" : "Recalcular"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : sorted.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            Aún no hay recomendaciones. Pulsa "Recalcular" para que la IA evalúe a los candidatos registrados.
          </p>
        ) : (
          sorted.map((rec) => <RecommendedRow key={rec.id} rec={rec} />)
        )}
      </CardContent>
    </Card>
  );
}
