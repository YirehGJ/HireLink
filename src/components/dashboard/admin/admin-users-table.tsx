
"use client"
import * as React from "react";
import { users as initialUsers } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Trash2, UserX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { User } from "@/lib/types";

const roleVariantMap: Record<User['role'], 'destructive' | 'secondary' | 'outline'> = {
    admin: 'destructive',
    recruiter: 'secondary',
    candidate: 'outline'
};

const roleTextMap: Record<User['role'], string> = {
    admin: 'Admin',
    recruiter: 'Reclutador',
    candidate: 'Candidato'
};

export function AdminUsersTable() {
  const [filter, setFilter] = React.useState("");
  const [users, setUsers] = React.useState(initialUsers);
  const { toast } = useToast();

  const handleSuspend = (userId: string) => {
    setUsers(currentUsers => currentUsers.map(user => 
      user.id === userId ? { ...user, status: user.status === 'active' ? 'suspended' : 'active' } : user
    ));
    toast({ title: "Estado de usuario actualizado" });
  };

  const handleDelete = (userId: string) => {
    setUsers(currentUsers => currentUsers.filter(user => user.id !== userId));
    toast({ title: "Usuario eliminado", variant: "destructive" });
  };
  
  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(filter.toLowerCase()) ||
    user.email.toLowerCase().includes(filter.toLowerCase()) ||
    user.role.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos los Usuarios</CardTitle>
        <CardDescription>Una lista completa de todos los usuarios en la plataforma.</CardDescription>
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
                <TableHead className="hidden sm:table-cell">Rol</TableHead>
                <TableHead className="hidden md:table-cell">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id} className={user.status === 'suspended' ? 'bg-muted/30' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage data-ai-hint="person" src={`https://picsum.photos/seed/${user.id}/100/100`} />
                            <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p>{user.fullName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={roleVariantMap[user.role] || 'default'} className="capitalize">
                      {roleTextMap[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                     <Badge variant={user.status === 'active' ? 'secondary' : 'outline'} className="capitalize">{user.status}</Badge>
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
                            <DropdownMenuItem onClick={() => alert('Navegar al perfil del usuario...')}>Ver Perfil</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSuspend(user.id)}>
                                <UserX className="mr-2 h-4 w-4" />
                                {user.status === 'active' ? 'Suspender' : 'Reactivar'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Eliminar Usuario</span>
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario
                                    <span className="font-medium"> {user.fullName} </span>
                                    de la plataforma.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                    Sí, eliminar usuario
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
