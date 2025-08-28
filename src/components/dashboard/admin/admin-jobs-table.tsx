
"use client"
import * as React from "react";
import { jobs as initialJobs } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, EyeOff, Trash2 } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";
import type { Job } from "@/lib/types";
import Link from "next/link";


const statusVariantMap: Record<Job['status'], 'secondary' | 'outline' | 'destructive'> = {
    published: 'secondary',
    draft: 'outline',
    closed: 'destructive'
};

export function AdminJobsTable() {
  const [filter, setFilter] = React.useState("");
  const [jobs, setJobs] = React.useState(initialJobs);
  const { toast } = useToast();

  const handleDeactivate = (jobId: string) => {
    setJobs(currentJobs => currentJobs.map(job => 
      job.id === jobId ? { ...job, status: 'closed' } : job
    ));
    toast({ title: "Vacante desactivada" });
  };

  const handleDelete = (jobId: string) => {
    setJobs(currentJobs => currentJobs.filter(job => job.id !== jobId));
    toast({ title: "Vacante eliminada", variant: "destructive" });
  };
  
  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(filter.toLowerCase()) ||
    job.id.toLowerCase().includes(filter.toLowerCase()) ||
    job.organizationRef.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todas las Vacantes</CardTitle>
        <CardDescription>Una lista completa de todas las vacantes en la plataforma.</CardDescription>
         <div className="relative pt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Buscar por título, ID de vacante o empresa..." 
                className="pl-10 max-w-lg"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            />
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">Empresa (ID)</TableHead>
                <TableHead className="hidden sm:table-cell">Seniority</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map(job => (
                <TableRow key={job.id} className={job.status === 'closed' ? 'bg-muted/30' : ''}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">{job.organizationRef}</TableCell>
                  <TableCell className="hidden sm:table-cell capitalize">{job.seniority}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariantMap[job.status] || 'default'} className="capitalize">
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                     <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/jobs/${job.id}`}>Ver Vacante</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeactivate(job.id)}>
                                <EyeOff className="mr-2 h-4 w-4" />
                                <span>Desactivar Vacante</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Eliminar Vacante</span>
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente la vacante
                                    <span className="font-medium"> {job.title} </span>
                                    y todos sus datos asociados.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(job.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                    Sí, eliminar vacante
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
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
