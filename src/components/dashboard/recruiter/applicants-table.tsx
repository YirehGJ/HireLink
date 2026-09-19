
"use client"
import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Application, ApplicationStatus, Candidate, Recommendation } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2, Star, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, useFirestore, useDoc, useCollection } from "@/firebase";
import { applicationService } from "@/firebase/firestore/application-service";
import { callAuthedApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/components/providers/app-provider";
import { formatDate } from "@/lib/firestore-time";
import { ApplicantDetailsDialog } from "./applicant-details-dialog";

interface ApplicantsTableProps {
  applicants: Application[];
  jobId: string;
  jobTitle: string;
  organizationRef: string;
}

const statusVariantMap: Record<Application['status'], "default" | "secondary" | "destructive" | "outline" | "lilac"> = {
    applied: 'secondary',
    screening: 'default',
    assessment: 'default',
    interview: 'lilac',
    offer: 'default',
    hired: 'secondary',
    rejected: 'destructive',
    withdrawn: 'outline'
};

export const applicationStatusText: Record<Application['status'], string> = {
    applied: 'Postulado',
    screening: 'En Revisión',
    assessment: 'Evaluación',
    interview: 'Entrevista',
    offer: 'Oferta',
    hired: 'Contratado',
    rejected: 'Rechazado',
    withdrawn: 'Retirado'
};

function ApplicantRow({
  app,
  job,
  recommendation,
}: {
  app: Application;
  job: { id: string; title: string; organizationRef: string };
  recommendation?: Recommendation;
}) {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { readOnly } = useApp();
  const { data: candidate } = useDoc<Candidate>(`candidates/${app.candidateRef}`);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  async function handleStatusChange(status: ApplicationStatus) {
    if (!firestore || !auth) return;
    setIsUpdating(true);
    try {
      await applicationService.updateStatus(firestore, job.id, app.id, status);
      await callAuthedApi(auth, "/api/applications/notify-status", {
        jobId: job.id,
        candidateUid: app.candidateRef,
        newStatus: status,
      });
    } catch (error) {
      console.error("Error updating application status:", error);
      toast({
        title: "Error al actualizar",
        description: "No se pudo cambiar el estado de la postulación.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  async function toggleShortlist() {
    if (!firestore) return;
    try {
      await applicationService.updateRecruiterFields(firestore, job.id, app.id, {
        shortlisted: !app.shortlisted,
      });
    } catch (e) {
      console.error(e);
      toast({ title: "No se pudo actualizar la shortlist", variant: "destructive" });
    }
  }

  const name = candidate?.fullName || candidate?.headline || 'Cargando...';

  return (
    <>
    <TableRow>
        <TableCell className="font-medium">
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarImage data-ai-hint="person" src={`https://picsum.photos/seed/${app.candidateRef}/100/100`} />
                    <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <button type="button" className="text-left hover:underline" onClick={() => setDetailsOpen(true)}>{name}</button>
                    <p className="text-sm text-muted-foreground">{candidate?.headline}{candidate?.location ? ` · ${candidate.location}` : ''}</p>
                </div>
            </div>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
            {recommendation ? (
              <Badge variant="secondary" className="font-bold"><Zap className="h-3 w-3 mr-1" />{(recommendation.score * 100).toFixed(0)}%</Badge>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
        </TableCell>
        <TableCell className="text-muted-foreground hidden md:table-cell">{formatDate(app.appliedAt)}</TableCell>
        <TableCell>
            <Badge variant={statusVariantMap[app.status] || 'outline'} className="capitalize">
                {applicationStatusText[app.status]}
            </Badge>
        </TableCell>
        <TableCell className="text-right">
            <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="icon" onClick={toggleShortlist} disabled={readOnly} aria-label={app.shortlisted ? "Quitar de shortlist" : "Agregar a shortlist"} title="Shortlist">
                    <Star className={`h-4 w-4 ${app.shortlisted ? 'fill-yellow-400 text-yellow-500' : ''}`} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDetailsOpen(true)}>Detalles</Button>
                <Select value={app.status} onValueChange={(v) => handleStatusChange(v as ApplicationStatus)} disabled={isUpdating || readOnly}>
                    <SelectTrigger className="w-[150px]">
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(applicationStatusText).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </TableCell>
    </TableRow>
    <ApplicantDetailsDialog
      open={detailsOpen}
      onOpenChange={setDetailsOpen}
      app={app}
      candidate={candidate}
      recommendation={recommendation}
      job={job}
    />
    </>
  );
}

export function ApplicantsTable({ applicants, jobId, jobTitle, organizationRef }: ApplicantsTableProps) {
  const [onlyShortlist, setOnlyShortlist] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const { data: recs } = useCollection<Recommendation>("recommendations", {
    where: ["jobRef", "==", jobId],
  });

  const scoreByCandidate = React.useMemo(() => {
    const map = new Map<string, Recommendation>();
    (recs ?? []).forEach((r) => map.set(r.candidateRef, r));
    return map;
  }, [recs]);

  const visible = React.useMemo(() => {
    return applicants
      .filter((a) => (onlyShortlist ? a.shortlisted : true))
      .filter((a) => (statusFilter === "all" ? true : a.status === statusFilter))
      .sort(
        (a, b) =>
          (scoreByCandidate.get(b.candidateRef)?.score ?? -1) -
          (scoreByCandidate.get(a.candidateRef)?.score ?? -1)
      );
  }, [applicants, onlyShortlist, statusFilter, scoreByCandidate]);

  if (applicants.length === 0) {
    return (
      <Card className="text-center py-16">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="text-xl font-semibold mt-4">Aún no hay candidatos</h3>
        <p className="text-muted-foreground mt-2">Cuando los candidatos apliquen a esta vacante, los verás aquí.</p>
      </Card>
    );
  }

  const job = { id: jobId, title: jobTitle, organizationRef };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidatos Postulados</CardTitle>
        <CardDescription>Ordenados por compatibilidad con la IA. Marca tu shortlist, deja notas y agenda entrevistas.</CardDescription>
        <div className="flex flex-wrap items-center gap-4 pt-4">
          <div className="flex items-center gap-2">
            <Switch id="only-shortlist" checked={onlyShortlist} onCheckedChange={setOnlyShortlist} />
            <Label htmlFor="only-shortlist">Solo shortlist</Label>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(applicationStatusText).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Candidato</TableHead>
                        <TableHead className="hidden lg:table-cell">Match IA</TableHead>
                        <TableHead className="hidden md:table-cell">Postuló</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {visible.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Ningún candidato coincide con los filtros.
                        </TableCell>
                      </TableRow>
                    ) : (
                      visible.map(app => (
                        <ApplicantRow key={app.id} app={app} job={job} recommendation={scoreByCandidate.get(app.candidateRef)} />
                      ))
                    )}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
