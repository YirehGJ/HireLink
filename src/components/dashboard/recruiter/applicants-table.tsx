
"use client"
import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { ApplicantNote, Application, ApplicationStatus, Candidate, Recommendation } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2, Star, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserAvatar } from "@/components/user-avatar";
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

/** Estados que la reclutadora puede elegir: «Retirado» solo lo decide la candidata (las reglas no lo permiten). */
const RECRUITER_STATUSES = (Object.keys(applicationStatusText) as ApplicationStatus[]).filter((s) => s !== "withdrawn");

function ApplicantRow({
  app,
  job,
  recommendation,
  note,
}: {
  app: Application;
  job: { id: string; title: string; organizationRef: string };
  recommendation?: Recommendation;
  note?: ApplicantNote;
}) {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { readOnly } = useApp();
  const { data: candidate, loading: candidateLoading } = useDoc<Candidate>(`candidates/${app.candidateRef}`);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [confirmReject, setConfirmReject] = React.useState(false);
  // Una postulación que la candidata retiró no se puede reactivar desde aquí.
  const locked = app.status === "withdrawn";
  const shortlisted = note?.shortlisted ?? app.shortlisted ?? false;

  /** Rechazar avisa a la candidata y es difícil de deshacer: se pide confirmación. */
  function requestStatusChange(status: ApplicationStatus) {
    if (status === "rejected" && app.status !== "rejected") setConfirmReject(true);
    else handleStatusChange(status);
  }

  async function handleStatusChange(status: ApplicationStatus) {
    if (!firestore || !auth) return;
    setIsUpdating(true);
    try {
      await applicationService.updateStatus(firestore, job.id, app.id, status);
    } catch (error) {
      console.error("Error updating application status:", error);
      toast({
        title: "Error al actualizar",
        description: "No se pudo cambiar el estado de la postulación.",
        variant: "destructive",
      });
      setIsUpdating(false);
      return;
    }
    // El estado ya quedó guardado: si falla el aviso al candidato se dice con claridad, en lugar de
    // mostrar un error que sugiere que el cambio no se hizo.
    try {
      await callAuthedApi(auth, "/api/applications/notify-status", {
        jobId: job.id,
        candidateUid: app.candidateRef,
        newStatus: status,
      });
    } catch (error) {
      console.error("Error notifying status change:", error);
      toast({
        title: "Estado actualizado",
        description: "El cambio se guardó, pero no se pudo avisar al candidato.",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  async function toggleShortlist() {
    if (!firestore) return;
    try {
      await applicationService.updateRecruiterFields(firestore, job.id, app.id, {
        shortlisted: !shortlisted,
      });
    } catch (e) {
      console.error(e);
      toast({ title: "No se pudo actualizar la shortlist", variant: "destructive" });
    }
  }

  const name = candidate?.fullName || candidate?.headline || (candidateLoading ? 'Cargando...' : 'Candidato sin perfil');

  return (
    <>
    <TableRow className="block px-1 py-2 md:table-row md:p-0">
        <TableCell className="block px-3 py-1.5 font-medium md:table-cell md:p-4">
            <div className="flex items-center gap-3">
                <UserAvatar name={name} seed={app.candidateRef} />
                <div>
                    <button type="button" className="py-1 text-left hover:underline" onClick={() => setDetailsOpen(true)}>{name}</button>
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
        <TableCell className="block px-3 py-1.5 md:table-cell md:p-4">
            <Badge variant={statusVariantMap[app.status] || 'outline'} className="capitalize whitespace-nowrap">
                {applicationStatusText[app.status]}
            </Badge>
        </TableCell>
        <TableCell className="block px-3 py-1.5 md:table-cell md:p-4 md:text-right">
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <Button variant="ghost" size="icon" onClick={toggleShortlist} disabled={readOnly} aria-label={shortlisted ? "Quitar de shortlist" : "Agregar a shortlist"} title="Shortlist">
                    <Star className={`h-4 w-4 ${shortlisted ? 'fill-yellow-400 text-yellow-500' : ''}`} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDetailsOpen(true)}>Detalles</Button>
                <Select value={app.status} onValueChange={(v) => requestStatusChange(v as ApplicationStatus)} disabled={isUpdating || readOnly || locked}>
                    <SelectTrigger className="w-[150px]" aria-label={`Cambiar estado de ${name}`}>
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
                    </SelectTrigger>
                    <SelectContent>
                        {(locked ? [...RECRUITER_STATUSES, "withdrawn" as ApplicationStatus] : RECRUITER_STATUSES).map((value) => (
                            <SelectItem key={value} value={value}>{applicationStatusText[value]}</SelectItem>
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
      note={note}
      job={job}
    />
    <AlertDialog open={confirmReject} onOpenChange={setConfirmReject}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Rechazar a {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            La postulación pasará a «Rechazado» y la persona recibirá un aviso. Puedes volver a cambiar el estado después, pero el aviso ya no se retira.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleStatusChange("rejected")}>Rechazar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

export function ApplicantsTable({ applicants, jobId, jobTitle, organizationRef }: ApplicantsTableProps) {
  const [onlyShortlist, setOnlyShortlist] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const { data: recs } = useCollection<Recommendation>("recommendations", {
    where: ["jobRef", "==", jobId],
  });

  // Notas privadas y shortlist: viven aparte de la postulación (esa la lee la candidata).
  const { data: notes } = useCollection<ApplicantNote>(`jobs/${jobId}/applicantNotes`);

  const scoreByCandidate = React.useMemo(() => {
    const map = new Map<string, Recommendation>();
    (recs ?? []).forEach((r) => map.set(r.candidateRef, r));
    return map;
  }, [recs]);

  const noteById = React.useMemo(() => {
    const map = new Map<string, ApplicantNote>();
    (notes ?? []).forEach((n) => map.set(n.id, n));
    return map;
  }, [notes]);

  const visible = React.useMemo(() => {
    return applicants
      .filter((a) => (onlyShortlist ? (noteById.get(a.id)?.shortlisted ?? a.shortlisted) : true))
      .filter((a) => (statusFilter === "all" ? true : a.status === statusFilter))
      .sort(
        (a, b) =>
          (scoreByCandidate.get(b.candidateRef)?.score ?? -1) -
          (scoreByCandidate.get(a.candidateRef)?.score ?? -1)
      );
  }, [applicants, onlyShortlist, statusFilter, scoreByCandidate, noteById]);

  if (applicants.length === 0) {
    return (
      <Card className="text-center py-16">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-semibold mt-4">Aún no hay candidatos</h2>
        <p className="text-muted-foreground mt-2">Cuando los candidatos apliquen a esta vacante, los verás aquí.</p>
      </Card>
    );
  }

  const job = { id: jobId, title: jobTitle, organizationRef };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidatos Postulados</CardTitle>
        <CardDescription>Ordenados por compatibilidad estimada con la IA (no es una probabilidad de contratación). Marca tu shortlist, deja notas y agenda entrevistas.</CardDescription>
        <div className="flex flex-wrap items-center gap-4 pt-4">
          <div className="flex items-center gap-2">
            <Switch id="only-shortlist" checked={onlyShortlist} onCheckedChange={setOnlyShortlist} />
            <Label htmlFor="only-shortlist">Solo shortlist</Label>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]" aria-label="Filtrar por estado"><SelectValue placeholder="Estado" /></SelectTrigger>
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
                <TableHeader className="hidden md:table-header-group">
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
                        <ApplicantRow key={app.id} app={app} job={job} recommendation={scoreByCandidate.get(app.candidateRef)} note={noteById.get(app.id)} />
                      ))
                    )}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
