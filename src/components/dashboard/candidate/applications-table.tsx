

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Application, Job } from "@/lib/types";
import { format } from "date-fns";
import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ApplicationWithJob extends Application {
    job: Job | undefined;
}

interface ApplicationsTableProps {
  applications: ApplicationWithJob[];
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


export function ApplicationsTable({ applications }: ApplicationsTableProps) {
  if (applications.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg bg-card/50">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="text-xl font-semibold mt-4">Aún no has aplicado a ninguna vacante</h3>
        <p className="text-muted-foreground mt-2">Explora tus recomendaciones y encuentra tu próxima oportunidad.</p>
        <Button asChild className="mt-4">
            <Link href="/dashboard">Ver Recomendaciones</Link>
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
                        <TableHead className="hidden md:table-cell">Empresa</TableHead>
                        <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {applications.map(app => (
                        <TableRow key={app.id}>
                            <TableCell className="font-medium">{app.job?.title || 'Vacante no encontrada'}</TableCell>
                            <TableCell className="text-muted-foreground hidden md:table-cell">{app.job?.organizationRef || 'N/A'}</TableCell>
                            <TableCell className="text-muted-foreground hidden sm:table-cell">{format(new Date(app.appliedAt), 'dd/MM/yyyy')}</TableCell>
                            <TableCell>
                                <Badge variant={statusVariantMap[app.status] || 'outline'} className="capitalize">
                                    {statusTextMap[app.status]}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/dashboard/jobs/${app.jobRef}`}>
                                        Ver Vacante
                                        <ExternalLink className="h-3 w-3 ml-2"/>
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
