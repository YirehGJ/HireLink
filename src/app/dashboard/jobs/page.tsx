
"use client"
import Link from 'next/link';
import { JobsList } from "@/components/dashboard/recruiter/jobs-list";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useApp } from '@/components/providers/app-provider';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getGreeting } from '@/lib/utils';

export default function JobsDashboardPage() {
    const { user, isMounted } = useApp();
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        if(isMounted) {
            setGreeting(getGreeting());
        }
    }, [isMounted]);

    const recruiterActions = (
        <Button asChild>
          <Link href="/dashboard/jobs/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Vacante
          </Link>
        </Button>
    );

    if (!isMounted || !user) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 space-y-8">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-48"/>
                        <Skeleton className="h-9 w-64"/>
                        <Skeleton className="h-5 w-80"/>
                    </div>
                    <Skeleton className="h-10 w-36"/>
                </div>
                <Skeleton className="h-80 w-full" />
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader 
                greeting={user ? `${greeting}, ${user.fullName.split(' ')[0]}!` : "Bienvenido"}
                title="Gestión de Vacantes"
                description="Administra tus publicaciones y encuentra al candidato ideal."
                actions={recruiterActions}
            />
            <JobsList />
        </div>
    );
}
