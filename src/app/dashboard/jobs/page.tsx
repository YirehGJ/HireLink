
"use client"
import Link from 'next/link';
import { JobsList } from "@/components/dashboard/recruiter/jobs-list";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useApp } from '@/components/providers/app-provider';

export default function JobsDashboardPage() {
    const { user } = useApp();

    const getGreeting = () => {
        const hours = new Date().getHours();
        if (hours < 12) return "Buenos días";
        if (hours < 18) return "Buenas tardes";
        return "Buenas noches";
    };

    const recruiterActions = (
        <Button asChild>
          <Link href="/dashboard/jobs/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Vacante
          </Link>
        </Button>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader 
                greeting={`${getGreeting()}, ${user?.fullName.split(' ')[0]}!`}
                title="Gestión de Vacantes"
                description="Administra tus publicaciones y encuentra al candidato ideal."
                actions={recruiterActions}
            />
            <JobsList />
        </div>
    );
}
