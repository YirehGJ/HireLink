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

export const dynamic = 'force-dynamic';

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
    const organizationProfile = role === 'recruiter' && user.organizationRef ? (getOrganization(user.organizationRef) || null) : null;
    
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
            </div>
        </div>
    );
}
