"use client";

import * as React from "react";
import { Loader2, Pencil, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth, useCollection, useFirestore } from "@/firebase";
import { organizationService } from "@/firebase/firestore/organization-service";
import { logAudit } from "@/lib/audit-client";
import { useToast } from "@/hooks/use-toast";
import type { Job, Organization, User } from "@/lib/types";

export function AdminOrganizations() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const { data: orgs, loading } = useCollection<Organization>("organizations");
  const { data: users } = useCollection<User>("users");
  const { data: jobs } = useCollection<Job>("jobs");

  const [editing, setEditing] = React.useState<Organization | "new" | null>(null);
  const [name, setName] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  function open(org: Organization | "new") {
    setEditing(org);
    setName(org === "new" ? "" : org.name ?? "");
    setWebsite(org === "new" ? "" : org.website ?? "");
    setDescription(org === "new" ? "" : org.description ?? "");
  }

  async function save() {
    if (!firestore || !editing) return;
    if (name.trim().length < 2) {
      toast({ title: "El nombre es requerido", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const data = { name: name.trim(), website: website.trim(), description: description.trim() };
      if (editing === "new") {
        const id = await organizationService.createOrganization(firestore, data);
        logAudit(auth, { action: "organization_created", targetType: "organization", targetId: id, details: data.name });
      } else {
        await organizationService.updateOrganization(firestore, editing.id, data);
        logAudit(auth, { action: "organization_updated", targetType: "organization", targetId: editing.id, details: data.name });
      }
      toast({ title: "Organización guardada" });
      setEditing(null);
    } catch (e) {
      console.error(e);
      toast({ title: "No se pudo guardar la organización", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Organizaciones</CardTitle>
            <CardDescription>Empresas registradas. Asigna sus reclutadores desde Gestión de Usuarios.</CardDescription>
          </div>
          <Button onClick={() => open("new")}><PlusCircle className="mr-2 h-4 w-4" />Nueva organización</Button>
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
                  <TableHead>Empresa</TableHead>
                  <TableHead className="hidden md:table-cell">Sitio web</TableHead>
                  <TableHead>Reclutadores</TableHead>
                  <TableHead>Vacantes</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(orgs ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No hay organizaciones.</TableCell></TableRow>
                )}
                {(orgs ?? []).map(org => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{org.website || "—"}</TableCell>
                    <TableCell>{(users ?? []).filter(u => u.role === "recruiter" && u.organizationRef === org.id).length}</TableCell>
                    <TableCell>{(jobs ?? []).filter(j => j.organizationRef === org.id).length}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => open(org)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Nueva organización" : "Editar organización"}</DialogTitle>
            <DialogDescription>Estos datos los ven los candidatos en las vacantes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1"><Label htmlFor="org-name">Nombre</Label><Input id="org-name" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="org-web">Sitio web</Label><Input id="org-web" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" /></div>
            <div className="space-y-1"><Label htmlFor="org-desc">Descripción</Label><Textarea id="org-desc" rows={4} value={description} onChange={e => setDescription(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
