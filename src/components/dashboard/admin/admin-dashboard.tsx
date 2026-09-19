"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useAllApplications } from "@/firebase";
import { formatDateTime } from "@/lib/firestore-time";
import type { AuditLog, Job, Recommendation } from "@/lib/types";

const ACTION_TEXT: Record<string, string> = {
  job_created: "Creó vacante",
  job_updated: "Editó vacante",
  job_status_changed: "Cambió estado de vacante",
  job_deleted: "Eliminó vacante",
  user_role_changed: "Cambió rol de usuario",
  user_status_changed: "Cambió estado de usuario",
  user_organization_changed: "Asignó organización",
  organization_created: "Creó organización",
  organization_updated: "Editó organización",
  application_created: "Postulación creada",
  application_status_changed: "Cambió estado de postulación",
  interview_scheduled: "Agendó entrevista",
};

const STATUS_STEPS: { key: string; label: string }[] = [
  { key: "applied", label: "Postulado" },
  { key: "screening", label: "En Revisión" },
  { key: "assessment", label: "Evaluación" },
  { key: "interview", label: "Entrevista" },
  { key: "offer", label: "Oferta" },
  { key: "hired", label: "Contratado" },
  { key: "rejected", label: "Rechazado" },
];

function AuditTab() {
  const { data: logs, loading } = useCollection<AuditLog>("auditLogs", {
    orderBy: ["createdAt", "desc"],
    limit: 100,
  });
  const [filter, setFilter] = React.useState("");

  const term = filter.toLowerCase();
  const rows = (logs ?? []).filter(
    (l) =>
      !term ||
      l.actorEmail?.toLowerCase().includes(term) ||
      (ACTION_TEXT[l.action] ?? l.action).toLowerCase().includes(term) ||
      l.details?.toLowerCase().includes(term)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimas Acciones en la Plataforma</CardTitle>
        <CardDescription>Registro en tiempo real de los eventos importantes que ocurren en HireLink (últimos 100).</CardDescription>
        <Input className="max-w-sm mt-4" placeholder="Filtrar por usuario, acción o detalle…" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                <TableHead className="hidden md:table-cell">Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Aún no hay eventos registrados.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">
                    {l.actorEmail || l.actorUid}
                    <Badge variant="outline" className="ml-2 capitalize">{l.actorRole}</Badge>
                  </TableCell>
                  <TableCell>{ACTION_TEXT[l.action] ?? l.action}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDateTime(l.createdAt as any)}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs truncate">{l.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function KpiTab() {
  const { data: apps, loading: appsLoading } = useAllApplications(true);
  const { data: jobs } = useCollection<Job>("jobs");
  const { data: recs } = useCollection<Recommendation>("recommendations");

  const funnel = React.useMemo(() => {
    const counts: Record<string, number> = {};
    (apps ?? []).forEach((a) => { counts[a.status] = (counts[a.status] ?? 0) + 1; });
    return counts;
  }, [apps]);

  const total = apps?.length ?? 0;
  const advanced = (apps ?? []).filter((a) => ["interview", "offer", "hired"].includes(a.status)).length;
  const withFeedback = (apps ?? []).filter((a) => a.status !== "applied").length;

  const perJob = React.useMemo(() => {
    const titles = new Map((jobs ?? []).map((j) => [j.id, j.title]));
    const counts = new Map<string, number>();
    (apps ?? []).forEach((a) => counts.set(a.jobRef, (counts.get(a.jobRef) ?? 0) + 1));
    return [...counts.entries()]
      .map(([id, n]) => ({ id, title: titles.get(id) ?? "Vacante eliminada", n }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 5);
  }, [apps, jobs]);

  const avgScore = recs && recs.length ? recs.reduce((s, r) => s + r.score, 0) / recs.length : null;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  if (appsLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Embudo de selección</CardTitle>
          <CardDescription>Postulaciones por etapa ({total} en total).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {total === 0 && <p className="text-sm text-muted-foreground">Aún no hay postulaciones.</p>}
          {STATUS_STEPS.map((s) => (
            <div key={s.key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{s.label}</span>
                <span className="text-muted-foreground">{funnel[s.key] ?? 0} ({pct(funnel[s.key] ?? 0)}%)</span>
              </div>
              <Progress value={pct(funnel[s.key] ?? 0)} />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Indicadores clave</CardTitle>
            <CardDescription>Metas de calidad del emparejamiento y seguimiento.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{pct(withFeedback)}%</div>
              <p className="text-xs text-muted-foreground">Con retroalimentación</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{pct(advanced)}%</div>
              <p className="text-xs text-muted-foreground">Llegan a entrevista u oferta</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{avgScore === null ? "—" : `${Math.round(avgScore * 100)}%`}</div>
              <p className="text-xs text-muted-foreground">Match IA promedio</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Vacantes con más postulaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {perJob.length === 0 && <p className="text-sm text-muted-foreground">Sin datos todavía.</p>}
            {perJob.map((j) => (
              <div key={j.id} className="flex items-center justify-between text-sm">
                <span className="truncate pr-4">{j.title}</span>
                <Badge variant="secondary">{j.n}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  return (
    <Tabs defaultValue="audit">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="audit">Registro de Auditoría</TabsTrigger>
        <TabsTrigger value="kpis">Embudo y KPIs</TabsTrigger>
      </TabsList>
      <TabsContent value="audit" className="mt-6"><AuditTab /></TabsContent>
      <TabsContent value="kpis" className="mt-6"><KpiTab /></TabsContent>
    </Tabs>
  );
}
