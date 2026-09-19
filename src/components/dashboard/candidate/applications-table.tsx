

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Application, Job } from "@/lib/types";
import { format } from "date-fns";
import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDoc } from "@/firebase";

interface ApplicationsTableProps {
  applications: Application[];
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

function ApplicationRow({ app }: { app: Application }) {
  const { data: job, loading } = useDoc<Job>(`jobs/${app.jobRef}`);

  return (
    <TableRow>
        <TableCell className="font-medium">{job?.title ?? (loading ? 'Cargando...' : 'Vacante eliminada')}</TableCell>
        <TableCell className="text-muted-foreground hidden md:table-cell">{job?.location ?? 'N/A'}</TableCell>
        <TableCell className="text-muted-foreground hidden sm:table-cell">{format(toJsDate(app.appliedAt), 'dd/MM/yyyy')}</TableCell>
        <TableCell>
            <Badge variant={statusVariantMap[app.status] || 'outline'} className="capitalize">
                {statusTextMap[app.status]}
            </Badge>
        </TableCell>
        <TableCell className="text-right">
            {job ? (
              <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/jobs/${app.jobRef}`}>
                      Ver Vacante
                      <ExternalLink className="h-3 w-3 ml-2"/>
                  </Link>
              </Button>
            ) : null}
        </TableCell>
    </TableRow>
  );
}

export function ApplicationsTable({ applications }: ApplicationsTableProps) {
  if (applications.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg bg-card/50">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="text-xl font-semibold mt-4">Aún no has aplicado a ninguna vacante</h3>
        <p className="text-muted-foreground mt-2">Explora tus recomendaciones y encuentra tu próxima oportunidad.</p>
        <Button asChild className="mt-4">
            <Link href="/dashboard/explore">Explorar Vacantes</Link>
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Postulaciones</CardTitle>
        <CardDescription>Aquí puedes ver todas las vacantes a las que has aplicado y su estado actual.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Vacante</TableHead>
                        <TableHead className="hidden md:table-cell">Ubicación</TableHead>
                        <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {applications.map(app => (
                        <ApplicationRow key={app.id} app={app} />
                    ))}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
