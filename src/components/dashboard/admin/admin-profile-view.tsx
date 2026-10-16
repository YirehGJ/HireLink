
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";
import type { User } from "@/lib/types";

interface AdminProfileViewProps {
    user: User;
}

const roleText: Record<User["role"], string> = {
    admin: "Administrador",
    recruiter: "Reclutador",
    candidate: "Candidato",
};

export function AdminProfileView({ user }: AdminProfileViewProps) {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Información del Administrador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                     <UserAvatar name={user.fullName} seed={user.id} className="h-16 w-16 text-xl" />
                    <div>
                        <p className="font-bold text-xl">{user.fullName}</p>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm pt-4">
                    <div>
                        <p className="font-medium">Rol</p>
                        <div>
                            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>{roleText[user.role] ?? user.role}</Badge>
                        </div>
                    </div>
                      <div>
                        <p className="font-medium">Estado</p>
                        <div>
                            <Badge variant={user.status === 'active' ? 'secondary' : 'outline'}>{user.status === 'active' ? 'Activo' : 'Suspendido'}</Badge>
                        </div>
                    </div>
                     <div>
                        <p className="font-medium">ID de Usuario</p>
                        <p className="font-mono text-xs break-all">{user.id}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

