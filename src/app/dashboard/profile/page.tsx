
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { UserProfileForm } from "@/components/dashboard/candidate/user-profile-form";
import { getCandidate } from "@/lib/data";


export default function ProfilePage() {
    // In a real app, you'd fetch this based on the logged-in user's ID
    const candidateProfile = getCandidate('candidate-1');

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader 
                greeting="Tu Espacio"
                title="Mi Perfil Profesional"
                description="Mantén tu información actualizada para recibir las mejores recomendaciones."
            />
            <div className="max-w-4xl mx-auto">
                <UserProfileForm profile={candidateProfile} />
            </div>
        </div>
    );
}
