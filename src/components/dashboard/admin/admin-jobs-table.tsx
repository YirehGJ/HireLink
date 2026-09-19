
"use client"
import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, EyeOff, Eye, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";
import { useAuth, useCollection, useFirestore } from "@/firebase";
import { jobService } from "@/firebase/firestore/job-service";
import { logAudit } from "@/lib/audit-client";
import type { Job, Organization } from "@/lib/types";
import Link from "next/link";

const statusVariantMap: Record<Job['status'], 'secondary' | 'outline' | 'destructive'> = {
    published: 'secondary',
    draft: 'outline',
    closed: 'destructive'
};

const statusText: Record<Job['status'], string> = {
    published: 'Publicada',
    draft: 'Borrador',
    closed: 'Cerrada',
};

export function AdminJobsTable() {
  const [filter, setFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [toDelete, setToDelete] = React.useState<Job | null>(null);
  const { data: jobs, loading } = useCollection<Job>("jobs");
  const { data: orgs } = useCollection<Organization>("organizations");
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const orgName = React.useMemo(() => {
    const m = new Map<string, string>();
    (orgs ?? []).forEach(o => m.set(o.id, o.name));
    return m;
  }, [orgs]);

  const toggleStatus = async (job: Job) => {
    if (!firestore) return;
    const next = job.status === 'closed' ? 'published' : 'closed';
    try {
      await jobService.setStatus(firestore, job.id, next);
      logAudit(auth, { action: "job_status_changed", targetType: "job", targetId: job.id, details: `${job.title} → ${next}` });
      toast({ title: next === 'closed' ? "Vacante desactivada" : "Vacante reactivada" });
    } catch (e) {
      console.error(e);
      toast({ title: "No se pudo actualizar la vacante", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!firestore || !toDelete) return;
    try {
      await jobService.deleteJob(firestore, toDelete.id);
      logAudit(auth, { action: "job_deleted", targetType: "job", targetId: toDelete.id, details: toDelete.title });
      toast({ title: "Vacante eliminada" });
    } catch (e) {
      console.error(e);
      toast({ title: "No se pudo eliminar la vacante", variant: "destructive" });
    } finally {
      setToDelete(null);
    }
  };

  const term = filter.toLowerCase();
  const filteredJobs = (jobs ?? [])
    .filter(job => statusFilter === "all" || job.status === statusFilter)
    .filter(job =>
      job.title.toLowerCase().includes(term) ||
      job.id.toLowerCase().includes(term) ||
      (orgName.get(job.organizationRef) ?? job.organizationRef).toLowerCase().includes(term)
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todas las Vacantes</CardTitle>
        <CardDescription>Una lista completa de todas las vacantes en la plataforma.</CardDescription>
        <div className="flex flex-wrap gap-3 pt-4">
          <div className="relative flex-1 min-w-[240px] max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                placeholder="Buscar por título, ID de vacante o empresa..."
                className="pl-10"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="published">Publicadas</SelectItem>
              <SelectItem value="draft">Borradores</SelectItem>
              <SelectItem value="closed">Cerradas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">Empresa</TableHead>
                <TableHead className="hidden sm:table-cell">Seniority</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No hay vacantes.</TableCell>
                </TableRow>
              )}
              {filteredJobs.map(job => (
                <TableRow key={job.id} className={job.status === 'closed' ? 'bg-muted/30' : ''}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">{orgName.get(job.organizationRef) ?? job.organizationRef}</TableCell>
                  <TableCell className="hidden sm:table-cell capitalize">{job.seniority}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariantMap[job.status] || 'default'}>
                      {statusText[job.status] ?? job.status}
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
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/jobs/${job.id}`}>Ver / Editar Vacante</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(job)}>
                            {job.status === 'closed' ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                            <span>{job.status === 'closed' ? 'Reactivar Vacante' : 'Desactivar Vacante'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onSelect={() => setToDelete(job)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Eliminar Vacante</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )}
      </CardContent>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la vacante
              <span className="font-medium"> {toDelete?.title}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Sí, eliminar vacante
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
