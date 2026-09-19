
"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDoc } from "@/firebase";
import { useApp } from "@/components/providers/app-provider";
import type { Candidate, Organization, User } from "@/lib/types";

export default function UserProfilePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { startViewAs } = useApp();
    const { data: userDoc, loading } = useDoc<User>(`users/${params.id}`);
    const { data: candidate } = useDoc<Candidate>(userDoc?.role === 'candidate' ? `candidates/${params.id}` : null);
    const { data: org } = useDoc<Organization>(userDoc?.organizationRef ? `organizations/${userDoc.organizationRef}` : null);

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 space-y-8">
                <Skeleton className="h-16 w-1/2" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!userDoc) {
        notFound();
    }

    const user = { ...userDoc, id: params.id };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader
                greeting={`Perfil de Usuario #${user.id}`}
                title={user.fullName}
                description={`Viendo detalles para ${user.email}`}
                actions={
                    <div className="flex gap-2 flex-wrap">
                        {user.role === 'recruiter' && (
                            <Button variant="outline" onClick={() => { startViewAs(user.id); router.push('/dashboard/jobs'); }}>
                                <Eye className="mr-2 h-4 w-4" />Ver como (solo lectura)
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/admin/users"><ArrowLeft className="mr-2 h-4 w-4"/>Volver a Usuarios</Link>
                        </Button>
                    </div>
                }
            />

            <Card className="max-w-2xl mx-auto w-full">
                <CardHeader>
                    <CardTitle>Información del Usuario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage data-ai-hint="person" src={`https://picsum.photos/seed/${user.id}/100/100`} />
                            <AvatarFallback>{user.fullName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold text-xl">{user.fullName}</p>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-medium">Rol</p>
                            <p className="capitalize">{user.role}</p>
                        </div>
                        <div>
                            <p className="font-medium">Estado</p>
                            <Badge variant={user.status === 'active' ? 'secondary' : 'outline'}>{user.status === 'active' ? 'Activo' : 'Suspendido'}</Badge>
                        </div>
                        <div>
                            <p className="font-medium">ID de Usuario</p>
                            <p className="font-mono text-xs break-all">{user.id}</p>
                        </div>
                        {user.organizationRef && (
                            <div>
                                <p className="font-medium">Organización</p>
                                <p>{org?.name ?? user.organizationRef}</p>
                            </div>
                        )}
                    </div>

                    {user.role === 'candidate' && (
                        <div className="space-y-3 border-t pt-4">
                            <h4 className="font-semibold">Perfil profesional</h4>
                            {!candidate ? (
                                <p className="text-sm text-muted-foreground">Este candidato aún no completa su perfil.</p>
                            ) : (
                                <>
                                    <p className="text-sm">{candidate.headline} · {candidate.location} · {candidate.yearsOfExperience} años exp.</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(candidate.skills ?? []).map((s, i) => (
                                            <Badge key={i} variant="secondary">{s.name} · {s.level}/5</Badge>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
