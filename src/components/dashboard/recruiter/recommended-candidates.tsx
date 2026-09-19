"use client";

import * as React from "react";
import { Loader2, RefreshCw, Zap, MapPin, Briefcase, Mail, Check, X, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, useCollection, useDoc } from "@/firebase";
import { callAuthedApi } from "@/lib/api-client";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/hooks/use-toast";
import type { Candidate, MatchStatus, Recommendation } from "@/lib/types";

/** Puntaje mínimo para que la IA considere que hay un match (igual que en el servidor). */
const MATCH_THRESHOLD = 0.6;

const statusOf = (r: Recommendation): MatchStatus => r.status ?? "pending";

function RecommendedRow({ rec }: { rec: Recommendation }) {
  const auth = useAuth();
  const { toast } = useToast();
  const { readOnly } = useApp();
  const { data: candidate } = useDoc<Candidate>(`candidates/${rec.candidateRef}`);
  const [busy, setBusy] = React.useState<"accept" | "reject" | null>(null);
  const name = candidate?.fullName || candidate?.headline || "Candidato";
  const status = statusOf(rec);

  async function respond(action: "accept" | "reject") {
    if (!auth) return;
    setBusy(action);
    try {
      await callAuthedApi(auth, "/api/matches/respond", { recId: rec.id, action });
      toast({
        title: action === "accept" ? "Match aceptado" : "Match rechazado",
        description: action === "accept"
          ? "El candidato fue notificado y pasó a tu lista de postulantes en revisión."
          : "El candidato fue notificado.",
      });
    } catch (e) {
      console.error(e);
      toast({ title: "No se pudo registrar tu decisión", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
        </div>
        <Badge variant="secondary" className="font-bold self-start">
          <Zap className="h-3 w-3 mr-1" />{(rec.score * 100).toFixed(0)}% Match
        </Badge>
      </div>

      {candidate?.cvSummary && (
        <div className="rounded-md bg-muted/50 p-3 text-sm">
          <p className="flex items-center gap-2 font-medium mb-1"><FileText className="h-4 w-4" />Resumen del CV (IA)</p>
          <p className="text-muted-foreground">{candidate.cvSummary}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {rec.reasons.map((r, i) => <Badge key={i} variant="lilac">{r}</Badge>)}
      </div>

      {(candidate?.skills ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {candidate!.skills.slice(0, 8).map((s, i) => <Badge key={i} variant="outline">{s.name}</Badge>)}
        </div>
      )}

      {status === "pending" && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => respond("accept")} disabled={!!busy || readOnly}>
            {busy === "accept" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Aceptar candidato
          </Button>
          <Button size="sm" variant="outline" onClick={() => respond("reject")} disabled={!!busy || readOnly}>
            {busy === "reject" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
            Rechazar
          </Button>
        </div>
      )}
      {status === "accepted" && <Badge className="self-start">Aceptado · ya está en tus candidatos postulados</Badge>}
      {status === "rejected_by_recruiter" && (
        <div className="flex items-center gap-3">
          <Badge variant="destructive">Rechazado por ti</Badge>
          <Button size="sm" variant="ghost" onClick={() => respond("accept")} disabled={!!busy || readOnly}>Aceptar de todos modos</Button>
        </div>
      )}
      {status === "rejected_by_candidate" && <Badge variant="outline" className="self-start">El candidato rechazó este match</Badge>}
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
    () => [...(data ?? [])].filter((r) => r.score >= MATCH_THRESHOLD).sort((a, b) => b.score - a.score),
    [data]
  );
  const pending = sorted.filter((r) => statusOf(r) === "pending");
  const accepted = sorted.filter((r) => statusOf(r) === "accepted");
  const rejected = sorted.filter((r) => statusOf(r) === "rejected_by_recruiter" || statusOf(r) === "rejected_by_candidate");

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

  const list = (items: Recommendation[], empty: string) =>
    loading ? (
      [1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)
    ) : items.length === 0 ? (
      <p className="text-center text-muted-foreground py-10">{empty}</p>
    ) : (
      items.map((rec) => <RecommendedRow key={rec.id} rec={rec} />)
    );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Matches de la IA</CardTitle>
            <CardDescription>
              La IA compara el perfil y el CV de cada candidato con esta vacante. Los matches quedan en espera hasta que los aceptes o rechaces.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={recompute} disabled={running || readOnly}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {running ? "Analizando…" : "Buscar candidatos"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">En espera ({pending.length})</TabsTrigger>
            <TabsTrigger value="accepted">Aceptados ({accepted.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rechazados ({rejected.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-4 space-y-3">
            {list(pending, 'No hay matches en espera. Pulsa "Buscar candidatos" para que la IA evalúe a los registrados.')}
          </TabsContent>
          <TabsContent value="accepted" className="mt-4 space-y-3">{list(accepted, "Aún no has aceptado ningún match.")}</TabsContent>
          <TabsContent value="rejected" className="mt-4 space-y-3">{list(rejected, "Ningún match rechazado.")}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
