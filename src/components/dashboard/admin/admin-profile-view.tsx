
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/lib/types";

interface AdminProfileViewProps {
    user: User;
}

export function AdminProfileView({ user }: AdminProfileViewProps) {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Información del Administrador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                     <Avatar className="h-16 w-16">
                        <AvatarImage data-ai-hint="person" src={`https://picsum.photos/seed/${user.id}/100/100`} />
                        <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-bold text-xl">{user.fullName}</p>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm pt-4">
                    <div>
                        <p className="font-medium">Rol</p>
                        <p>
                            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">{user.role}</Badge>
                        </p>
                    </div>
                      <div>
                        <p className="font-medium">Estado</p>
                        <p>
                            <Badge variant={user.status === 'active' ? 'secondary' : 'outline'} className="capitalize">{user.status}</Badge>
                        </p>
                    </div>
                     <div>
                        <p className="font-medium">ID de Usuario</p>
                        <p className="font-mono text-xs">{user.id}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
