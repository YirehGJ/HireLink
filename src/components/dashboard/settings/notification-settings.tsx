
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import React from "react";
import { useAuth, useFirestore, useDoc } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useApp } from "@/components/providers/app-provider";

const notificationsFormSchema = z.object({
  communication_emails: z.boolean().default(false).optional(),
  marketing_emails: z.boolean().default(true).optional(),
  social_emails: z.boolean().default(true).optional(),
  security_emails: z.boolean(),
});

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

const defaultValues: Partial<NotificationsFormValues> = {
  communication_emails: false,
  marketing_emails: true,
  social_emails: true,
  security_emails: true,
};

export function NotificationSettings() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useApp();
  const { data: savedPrefs, loading } = useDoc<NotificationsFormValues>(
    user ? `users/${user.id}/settings/notifications` : null
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (savedPrefs) form.reset(savedPrefs);
  }, [savedPrefs]);

  async function onSubmit(data: NotificationsFormValues) {
    if (!firestore || !auth || !auth.currentUser) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(firestore, "users", auth.currentUser.uid, "settings", "notifications"), data);
      toast({
          title: "Preferencias actualizadas",
          description: "Tus ajustes de notificación han sido guardados.",
      });
    } catch (error) {
      console.error("Error saving notification prefs:", error);
      toast({
          title: "Error al guardar",
          description: "No se pudieron guardar tus preferencias.",
          variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h3 className="mb-4 text-lg font-medium">Notificaciones por Email</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="communication_emails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Coincidencias de la IA</FormLabel>
                    <FormDescription>
                      Candidatos: nuevas recomendaciones de empleo. Reclutadores: nuevos candidatos compatibles con tus vacantes.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="marketing_emails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Actualizaciones de Postulaciones</FormLabel>
                    <FormDescription>
                      Candidatos: cambios de estado y entrevistas agendadas. Reclutadores: nuevas postulaciones y respuestas a un match.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="social_emails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Noticias y Marketing</FormLabel>
                    <FormDescription>
                        Recibir correos sobre nuevos productos, funciones y ofertas especiales de HireLink. (Próximamente)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="security_emails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Alertas de Seguridad</FormLabel>
                    <FormDescription>
                        Recibir correos sobre actividad inusual y cambios en tu cuenta. No se puede desactivar. (Próximamente)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled
                      aria-readonly
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
        </Button>
      </form>
    </Form>
  );
}

