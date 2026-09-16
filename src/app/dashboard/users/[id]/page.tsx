
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { UserProfileForm } from "@/components/dashboard/candidate/user-profile-form";
import { getCandidate, getUser, users, candidates } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";


export default function UserProfilePage({ params }: { params: { id: string } }) {
    const user = getUser(params.id);

    if (!user) {
        notFound();
    }

    const candidateProfile = candidates.find(c => c.userRef === user.id);

    // This is a simplified view for admins. 
    // It shows the candidate form for candidates, and a generic card for others.
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader 
                greeting={`Perfil de Usuario #${user.id}`}
                title={user.fullName}
                description={`Viendo detalles para ${user.email}`}
                actions={
                     <Button variant="outline" asChild>
                        <Link href="/dashboard/admin/users"><ArrowLeft className="mr-2 h-4 w-4"/>Volver a Usuarios</Link>
                    </Button>
                }
            />
            
            {user.role === 'candidate' && candidateProfile ? (
                 <div className="max-w-4xl mx-auto">
                    <UserProfileForm profile={candidateProfile} />
                </div>
            ) : (
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Información del Usuario</CardTitle>
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
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-medium">Rol</p>
                                <p className="capitalize">{user.role}</p>
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
                             {user.organizationRef && (
                                <div>
                                    <p className="font-medium">Organización</p>
                                    <p className="font-mono text-xs">{user.organizationRef}</p>
                                </div>
                             )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

