
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Lock, Paintbrush, User } from 'lucide-react';
import { ThemeSwitcher } from "@/components/dashboard/settings/theme-switcher";
import { AccountSettings } from "@/components/dashboard/settings/account-settings";
import { NotificationSettings } from "@/components/dashboard/settings/notification-settings";

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
                    <TabsTrigger value="security">Cuenta y Seguridad</TabsTrigger>
                </TabsList>
                <TabsContent value="appearance" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Apariencia</CardTitle>
                            <CardDescription>Personaliza cómo se ve HireLink en tu dispositivo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ThemeSwitcher />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="notifications" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notificaciones</CardTitle>
                            <CardDescription>Elige cómo quieres recibir las actualizaciones.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <NotificationSettings />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="security" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cuenta y Seguridad</CardTitle>
                            <CardDescription>Gestiona tu información personal, contraseña y seguridad de tu cuenta.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AccountSettings />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
