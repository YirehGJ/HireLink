
"use client";

import { useApp } from "@/components/providers/app-provider";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { UserProfileForm } from "@/components/dashboard/candidate/user-profile-form";
import { getCandidateByUserId, getOrganization } from "@/lib/data";
import { OrganizationProfileForm } from "@/components/dashboard/recruiter/organization-profile-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";


const AdminProfileView = ({ user }: { user: NonNullable<ReturnType<typeof useApp>['user']> }) => (
    <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>Información de Administrador</CardTitle>
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
                    <p><Badge variant="destructive" className="capitalize">{user.role}</Badge></p>
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
)

export default function ProfilePage() {
    const { role, user, isMounted } = useApp();

    if (!isMounted || !user) {
        return (
             <div className="p-4 sm:p-6 lg:p-8 space-y-8">
                <Skeleton className="h-16 w-1/2" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    const candidateProfile = role === 'candidate' ? (getCandidateByUserId(user.id) || null) : null;
    const organizationProfile = role === 'recruiter' && user.organizationRef ? getOrganization(user.organizationRef) : null;
    
    const titles = {
        candidate: "Mi Perfil Profesional",
        recruiter: "Perfil de la Organización",
        admin: "Mi Perfil de Administrador"
    }

    const descriptions = {
        candidate: "Mantén tu información actualizada para recibir las mejores recomendaciones.",
        recruiter: "Gestiona la información pública de tu empresa.",
        admin: "Visualiza la información de tu cuenta de administrador."
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader 
                greeting="Tu Espacio"
                title={titles[role!]}
                description={descriptions[role!]}
            />
            <div className="max-w-4xl mx-auto">
                {role === 'candidate' && <UserProfileForm profile={candidateProfile} />}
                {role === 'recruiter' && <OrganizationProfileForm organization={organizationProfile} />}
                {role === 'admin' && <AdminProfileView user={user} />}
            </div>
        </div>
    );
}
