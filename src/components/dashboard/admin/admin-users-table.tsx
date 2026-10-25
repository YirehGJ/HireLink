
"use client"
import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth, useCollection } from "@/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import { Eye, Loader2, MoreHorizontal, Search, ShieldCheck, ShieldOff, Trash2, UserX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { matchesText, normalizeText } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/components/providers/app-provider";
import { callAuthedApi } from "@/lib/api-client";
import type { Organization, User, UserRole } from "@/lib/types";
import Link from "next/link";

const roleText: Record<UserRole, string> = {
    admin: 'Admin',
    recruiter: 'Reclutador',
    candidate: 'Candidato'
};

const NO_ORG = "__none__";

export function AdminUsersTable() {
  const [filter, setFilter] = React.useState("");
  const [onlyPending, setOnlyPending] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [toDelete, setToDelete] = React.useState<User | null>(null);
  const { data: users, loading } = useCollection<User>("users");
  const { data: orgs } = useCollection<Organization>("organizations");
  const auth = useAuth();
  const router = useRouter();
  const { user: me, startViewAs } = useApp();
  const { toast } = useToast();

  /**
   * Las operaciones sobre cuentas pasan por `/api/admin/users`: el servidor las hace con el SDK de administración
   * (suspender deshabilita de verdad la cuenta, nunca queda el sistema sin una administradora) y deja la auditoría.
   */
  const runAction = async (target: User, body: Record<string, unknown>, ok: { title: string; description?: string }) => {
    if (!auth) return;
    setBusyId(target.id);
    try {
      await callAuthedApi(auth, "/api/admin/users", { uid: target.id, ...body });
      toast(ok);
    } catch (error: any) {
      console.error("Error en la acción de administración:", error);
      toast({ title: "No se pudo completar la acción", description: error?.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const handleSuspend = (target: User) => {
    const suspend = target.status === 'active';
    return runAction(target, { action: suspend ? "suspend" : "reactivate" }, {
      title: suspend ? "Cuenta suspendida" : "Cuenta reactivada",
      description: suspend ? `${target.fullName} ya no puede iniciar sesión.` : `${target.fullName} puede volver a entrar.`,
    });
  };

  const handleApproval = (target: User, approve: boolean) =>
    runAction(target, { action: approve ? "approve_recruiter" : "revoke_recruiter" }, {
      title: approve ? "Reclutadora aprobada" : "Aprobación revocada",
      description: approve
        ? `${target.fullName} ya puede publicar vacantes y ver candidatas.`
        : `${target.fullName} deja de ver candidatas y de publicar.`,
    });

  const handleRoleChange = (target: User, role: UserRole) => {
    if (role === target.role) return;
    return runAction(target, { action: "set_role", role }, {
      title: "Rol actualizado",
      description: `${target.fullName} ahora es ${roleText[role]}.`,
    });
  };

  const handleOrgChange = (target: User, orgId: string) =>
    runAction(target, { action: "set_organization", organizationRef: orgId === NO_ORG ? null : orgId }, { title: "Organización asignada" });

  const handleViewAs = (target: User) => {
    startViewAs(target.id);
    router.push("/dashboard/jobs");
  };

  const pendingCount = (users ?? []).filter(u => u.role === 'recruiter' && u.recruiterApproved !== true).length;
  const term = normalizeText(filter.trim());
  // Orden estable y predecible: primero administradores, luego reclutadores y candidatos; por nombre dentro de cada rol.
  const ROLE_ORDER: Record<UserRole, number> = { admin: 0, recruiter: 1, candidate: 2 };
  const filteredUsers = (users ?? [])
    .filter(user => !onlyPending || (user.role === 'recruiter' && user.recruiterApproved !== true))
    .filter(user =>
      !term ||
      matchesText(user.fullName, term) ||
      matchesText(user.email, term) ||
      matchesText(roleText[user.role] ?? user.role, term) ||
      matchesText(user.role, term)
    )
    .sort((a, b) =>
      (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) ||
      (a.fullName ?? "").localeCompare(b.fullName ?? "", "es", { sensitivity: "base" })
    );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Todos los Usuarios</CardTitle>
          <CardDescription>Cargando usuarios...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos los Usuarios</CardTitle>
        <CardDescription>Aprueba reclutadoras, cambia roles, asigna organizaciones, suspende y elimina cuentas.</CardDescription>
        {pendingCount > 0 && (
          <p role="status" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100">
            {pendingCount === 1 ? "1 reclutadora espera" : `${pendingCount} reclutadoras esperan`} aprobación. Hasta que la apruebes no ve candidatas ni publica vacantes.
          </p>
        )}
         <div className="flex flex-wrap items-center gap-4 pt-4">
            <div className="relative min-w-[240px] flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre, email o rol..."
                    aria-label="Buscar usuarios"
                    className="pl-10"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="only-pending" checked={onlyPending} onCheckedChange={setOnlyPending} />
              <Label htmlFor="only-pending">Solo pendientes de aprobación</Label>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="hidden lg:table-cell">Organización</TableHead>
                <TableHead className="hidden md:table-cell">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    {onlyPending ? "No hay reclutadoras pendientes de aprobación." : "Ningún usuario coincide con la búsqueda."}
                  </TableCell>
                </TableRow>
              )}
              {filteredUsers.map(user => {
                const isMe = user.id === me?.id;
                const busy = busyId === user.id;
                const pending = user.role === 'recruiter' && user.recruiterApproved !== true;
                return (
                <TableRow key={user.id} className={user.status === 'suspended' ? 'bg-muted/30' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        <UserAvatar name={user.fullName} seed={user.id} />
                        <div>
                            <p>{user.fullName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {pending && <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Pendiente de aprobación</p>}
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={user.role} onValueChange={(v) => handleRoleChange(user, v as UserRole)} disabled={isMe || busy}>
                      <SelectTrigger className="w-[130px]" aria-label={`Rol de ${user.fullName}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(roleText) as UserRole[]).map(r => (
                          <SelectItem key={r} value={r}>{roleText[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {user.role === 'recruiter' ? (
                      <Select value={user.organizationRef ?? NO_ORG} onValueChange={(v) => handleOrgChange(user, v)} disabled={busy}>
                        <SelectTrigger className="w-[220px]" aria-label={`Organización de ${user.fullName}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_ORG}>Sin organización</SelectItem>
                          {(orgs ?? []).map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={user.status === 'active' ? 'secondary' : 'outline'}>{user.status === 'active' ? 'Activo' : 'Suspendido'}</Badge>
                      {user.role === 'recruiter' && (
                        <Badge variant={pending ? 'outline' : 'secondary'}>{pending ? 'Sin aprobar' : 'Aprobada'}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={busy}>
                          <span className="sr-only">Abrir menú</span>
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                         <DropdownMenuItem asChild>
                            <Link href={`/dashboard/users/${user.id}`}>Ver Perfil</Link>
                        </DropdownMenuItem>
                        {user.role === 'recruiter' && (
                          <DropdownMenuItem onClick={() => handleViewAs(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver como (solo lectura)
                          </DropdownMenuItem>
                        )}
                        {user.role === 'recruiter' && (
                          <DropdownMenuItem onClick={() => handleApproval(user, pending)}>
                            {pending ? <ShieldCheck className="mr-2 h-4 w-4" /> : <ShieldOff className="mr-2 h-4 w-4" />}
                            {pending ? 'Aprobar reclutadora' : 'Revocar aprobación'}
                          </DropdownMenuItem>
                        )}
                        {!isMe && (
                          <DropdownMenuItem onClick={() => handleSuspend(user)}>
                              <UserX className="mr-2 h-4 w-4" />
                              {user.status === 'active' ? 'Suspender' : 'Reactivar'}
                          </DropdownMenuItem>
                        )}
                        {!isMe && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(user)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar cuenta
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => { if (!open) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar la cuenta de {toDelete?.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borran su perfil, postulaciones, notas, recomendaciones, entrevistas y avisos
              {toDelete?.role === 'recruiter' ? "; si es la última reclutadora de su empresa, también la empresa y sus vacantes" : ""}.
              Es definitivo y no se puede deshacer. Quedará constancia en la auditoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const target = toDelete;
                setToDelete(null);
                if (target) runAction(target, { action: "delete" }, { title: "Cuenta eliminada", description: `${target.email} y sus datos se borraron.` });
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
