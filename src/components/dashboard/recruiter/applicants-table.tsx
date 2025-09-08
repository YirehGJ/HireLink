
"use client"
import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Application, Candidate } from "@/lib/types";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ApplicantWithCandidate extends Application {
    candidate: Candidate | undefined;
}

interface ApplicantsTableProps {
  applicants: ApplicantWithCandidate[];
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

export function ApplicantsTable({ applicants }: ApplicantsTableProps) {
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
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {applicants.map(app => (
                        <TableRow key={app.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage data-ai-hint="person" src={`https://picsum.photos/seed/${app.candidate?.id}/100/100`} />
                                        <AvatarFallback>{app.candidate?.headline.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p>{app.candidate?.headline}</p>
                                        <p className="text-sm text-muted-foreground">{app.candidate?.location}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden md:table-cell">{format(new Date(app.appliedAt), 'dd/MM/yyyy')}</TableCell>
                            <TableCell>
                                <Badge variant={statusVariantMap[app.status] || 'outline'} className="capitalize">
                                    {statusTextMap[app.status]}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Abrir menú</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                        <DropdownMenuItem>Ver Perfil de Candidato</DropdownMenuItem>
                                        <DropdownMenuItem>Ver CV</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>Agendar Entrevista</DropdownMenuItem>
                                        <DropdownMenuItem>Rechazar</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
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
