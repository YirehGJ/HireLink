

"use client"
import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Application, ApplicationStatus, Candidate } from "@/lib/types";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, useFirestore, useDoc } from "@/firebase";
import { applicationService } from "@/firebase/firestore/application-service";
import { callAuthedApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

// Normaliza cualquier fecha que pueda venir de Firestore (Timestamp, {seconds}, string, number) a Date
type FireTime =
  | Date
  | { toDate?: () => Date; seconds?: number; nanoseconds?: number }
  | string
  | number
  | null
  | undefined;

function toJsDate(v: FireTime): Date {
  if (v instanceof Date) return v;
  if (!v) return new Date(NaN); // muestra "Invalid Date" si viene vacío
  const anyV = v as any;
  if (typeof anyV?.toDate === 'function') return anyV.toDate(); // Timestamp
  if (typeof anyV?.seconds === 'number') return new Date(anyV.seconds * 1000); // objeto serializado
  return new Date(anyV as string | number); // string o number
}

interface ApplicantsTableProps {
  applicants: Application[];
  jobId: string;
  jobTitle: string;
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

const statusTextMap: Record<Application['status'], string> = {
    applied: 'Postulado',
    screening: 'En Revisión',
    assessment: 'Evaluación',
    interview: 'Entrevista',
    offer: 'Oferta',
    hired: 'Contratado',
    rejected: 'Rechazado',
    withdrawn: 'Retirado'
};

function ApplicantRow({ app, jobId, jobTitle }: { app: Application; jobId: string; jobTitle: string }) {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { data: candidate } = useDoc<Candidate>(`candidates/${app.candidateRef}`);
  const [isUpdating, setIsUpdating] = React.useState(false);

  async function handleStatusChange(status: ApplicationStatus) {
    if (!firestore || !auth) return;
    setIsUpdating(true);
    try {
      await applicationService.updateStatus(firestore, jobId, app.id, status);
      await callAuthedApi(auth, "/api/applications/notify-status", {
        jobId,
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

  return (
    <TableRow>
        <TableCell className="font-medium">
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarImage data-ai-hint="person" src={`https://picsum.photos/seed/${app.candidateRef}/100/100`} />
                    <AvatarFallback>{candidate?.headline?.charAt(0) ?? '?'}</AvatarFallback>
                </Avatar>
                <div>
                    <p>{candidate?.headline ?? 'Cargando...'}</p>
                    <p className="text-sm text-muted-foreground">{candidate?.location}</p>
                </div>
            </div>
        </TableCell>
        <TableCell className="text-muted-foreground hidden md:table-cell">{format(toJsDate(app.appliedAt as any), 'dd/MM/yyyy')}</TableCell>
        <TableCell>
            <Badge variant={statusVariantMap[app.status] || 'outline'} className="capitalize">
                {statusTextMap[app.status]}
            </Badge>
        </TableCell>
        <TableCell className="text-right">
            <Select value={app.status} onValueChange={(v) => handleStatusChange(v as ApplicationStatus)} disabled={isUpdating}>
                <SelectTrigger className="w-[160px] ml-auto">
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(statusTextMap).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </TableCell>
    </TableRow>
  );
}

export function ApplicantsTable({ applicants, jobId, jobTitle }: ApplicantsTableProps) {
  if (applicants.length === 0) {
    return (
      <Card className="text-center py-16">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="text-xl font-semibold mt-4">Aún no hay candidatos</h3>
        <p className="text-muted-foreground mt-2">Cuando los candidatos apliquen a esta vacante, los verás aquí.</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidatos Postulados</CardTitle>
        <CardDescription>Gestiona los candidatos que han aplicado a esta vacante.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Candidato</TableHead>
                        <TableHead className="hidden md:table-cell">Postuló</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Cambiar Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {applicants.map(app => (
                        <ApplicantRow key={app.id} app={app} jobId={jobId} jobTitle={jobTitle} />
                    ))}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
