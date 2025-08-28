
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Application, Job } from "@/lib/types";
import { format } from "date-fns";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface ApplicationWithJob extends Application {
    job: Job | undefined;
}

interface ApplicationsTableProps {
  applications: ApplicationWithJob[];
}

const statusVariantMap: Record<Application['status'], "default" | "secondary" | "destructive" | "outline"> = {
    applied: 'secondary',
    screening: 'default',
    assessment: 'default',
    interview: 'lilac',
    offer: 'default',
    hired: 'secondary',
    rejected: 'destructive',
    withdrawn: 'outline'
};


export function ApplicationsTable({ applications }: ApplicationsTableProps) {
  if (applications.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg">
        <h3 className="text-xl font-semibold">Aún no has aplicado a ninguna vacante</h3>
        <p className="text-muted-foreground mt-2">Explora tus recomendaciones y encuentra tu próxima oportunidad.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Vacante</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Fecha de Postulación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {applications.map(app => (
                    <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.job?.title || 'Vacante no encontrada'}</TableCell>
                        <TableCell className="text-muted-foreground">{app.job?.organizationRef || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground">{format(new Date(app.appliedAt), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                             <Badge variant={statusVariantMap[app.status] || 'outline'} className="capitalize">
                                {app.status}
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
  );
}
