
"use client"
import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth, useCollection, useFirestore } from "@/firebase";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, MoreHorizontal, Search, UserX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { matchesText, normalizeText } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/components/providers/app-provider";
import { logAudit } from "@/lib/audit-client";
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
  const { data: users, loading } = useCollection<User>("users");
  const { data: orgs } = useCollection<Organization>("organizations");
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { user: me, startViewAs } = useApp();
  const { toast } = useToast();

  const handleSuspend = async (target: User) => {
    if (!firestore) return;
    const next = target.status === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(firestore, "users", target.id), { status: next });
      logAudit(auth, { action: "user_status_changed", targetType: "user", targetId: target.id, details: `${target.email} → ${next}` });
      toast({ title: "Estado de usuario actualizado" });
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({ title: "Error al actualizar", variant: "destructive" });
    }
  };

  const handleRoleChange = async (target: User, role: UserRole) => {
    if (!firestore || role === target.role) return;
    try {
      await updateDoc(doc(firestore, "users", target.id), { role });
      logAudit(auth, { action: "user_role_changed", targetType: "user", targetId: target.id, details: `${target.email}: ${roleText[target.role]} → ${roleText[role]}` });
      toast({ title: "Rol actualizado", description: `${target.fullName} ahora es ${roleText[role]}.` });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({ title: "No se pudo cambiar el rol", variant: "destructive" });
    }
  };

  const handleOrgChange = async (target: User, orgId: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, "users", target.id), {
        organizationRef: orgId === NO_ORG ? deleteField() : orgId,
      });
      const orgName = (orgs ?? []).find(o => o.id === orgId)?.name ?? "sin organización";
      logAudit(auth, { action: "user_organization_changed", targetType: "user", targetId: target.id, details: `${target.email} → ${orgName}` });
      toast({ title: "Organización asignada" });
    } catch (error) {
      console.error("Error updating organization:", error);
      toast({ title: "No se pudo asignar la organización", variant: "destructive" });
    }
  };

  const handleViewAs = (target: User) => {
    startViewAs(target.id);
    router.push("/dashboard/jobs");
  };

  const term = normalizeText(filter.trim());
  // Orden estable y predecible: primero administradores, luego reclutadores y candidatos; por nombre dentro de cada rol.
  const ROLE_ORDER: Record<UserRole, number> = { admin: 0, recruiter: 1, candidate: 2 };
  const filteredUsers = (users ?? [])
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
        <CardDescription>Cambia roles, asigna organizaciones a reclutadores y suspende cuentas.</CardDescription>
         <div className="relative pt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                placeholder="Buscar por nombre, email o rol..."
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
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="hidden lg:table-cell">Organización</TableHead>
                <TableHead className="hidden md:table-cell">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => {
                const isMe = user.id === me?.id;
                return (
                <TableRow key={user.id} className={user.status === 'suspended' ? 'bg-muted/30' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        <UserAvatar name={user.fullName} seed={user.id} />
                        <div>
                            <p>{user.fullName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={user.role} onValueChange={(v) => handleRoleChange(user, v as UserRole)} disabled={isMe}>
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
                      <Select value={user.organizationRef ?? NO_ORG} onValueChange={(v) => handleOrgChange(user, v)}>
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
                     <Badge variant={user.status === 'active' ? 'secondary' : 'outline'}>{user.status === 'active' ? 'Activo' : 'Suspendido'}</Badge>
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
                            <Link href={`/dashboard/users/${user.id}`}>Ver Perfil</Link>
                        </DropdownMenuItem>
                        {user.role === 'recruiter' && (
                          <DropdownMenuItem onClick={() => handleViewAs(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver como (solo lectura)
                          </DropdownMenuItem>
                        )}
                        {!isMe && (
                          <DropdownMenuItem onClick={() => handleSuspend(user)}>
                              <UserX className="mr-2 h-4 w-4" />
                              {user.status === 'active' ? 'Suspender' : 'Reactivar'}
                          </DropdownMenuItem>
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
    </Card>
  );
}
