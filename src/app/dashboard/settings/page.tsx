
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Lock, Paintbrush } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <DashboardHeader 
                greeting="Tu Cuenta"
                title="Configuración"
                description="Gestiona tus preferencias de cuenta, notificaciones y apariencia."
            />
            <Tabs defaultValue="appearance" className="max-w-4xl mx-auto">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="appearance">Apariencia</TabsTrigger>
                    <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
                    <TabsTrigger value="security">Seguridad</TabsTrigger>
                </TabsList>
                <TabsContent value="appearance" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Apariencia</CardTitle>
                            <CardDescription>Personaliza cómo se ve HireLink en tu dispositivo.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-64 bg-card/50 rounded-lg border-2 border-dashed">
                             <div className="text-center text-muted-foreground">
                                <Paintbrush className="h-16 w-16 mx-auto" />
                                <p className="mt-4">Controles para cambiar tema (claro/oscuro) irán aquí.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="notifications" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notificaciones</CardTitle>
                            <CardDescription>Elige cómo quieres recibir las actualizaciones.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-64 bg-card/50 rounded-lg border-2 border-dashed">
                            <div className="text-center text-muted-foreground">
                                <Bell className="h-16 w-16 mx-auto" />
                                <p className="mt-4">Opciones para notificaciones (email, push) irán aquí.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="security" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Seguridad</CardTitle>
                            <CardDescription>Gestiona tu contraseña y la seguridad de tu cuenta.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-64 bg-card/50 rounded-lg border-2 border-dashed">
                             <div className="text-center text-muted-foreground">
                                <Lock className="h-16 w-16 mx-auto" />
                                <p className="mt-4">Opciones para cambiar contraseña y 2FA irán aquí.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
