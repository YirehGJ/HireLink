
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Organization } from "@/lib/types";
import { useAuth, useFirestore } from "@/firebase";
import { useApp } from "@/components/providers/app-provider";
import { organizationService } from "@/firebase/firestore/organization-service";
import { userService } from "@/firebase/firestore/user-service";
import { logAudit } from "@/lib/audit-client";

const orgSchema = z.object({
  name: z.string().min(2, "El nombre de la organización es requerido."),
  website: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres.").optional().or(z.literal('')),
});

export function OrganizationProfileForm({ organization }: { organization: Organization | null | undefined }) {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, readOnly } = useApp();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof orgSchema>>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: organization?.name || "",
      website: organization?.website || "",
      description: organization?.description || "",
    },
  });

  async function onSubmit(values: z.infer<typeof orgSchema>) {
    if (!firestore || !auth || !auth.currentUser || !user || readOnly) return;
    setIsSubmitting(true);

    try {
      if (user.organizationRef) {
        await organizationService.updateOrganization(firestore, user.organizationRef, values);
        logAudit(auth, { action: "organization_updated", targetType: "organization", targetId: user.organizationRef, details: values.name });
      } else {
        const orgId = await organizationService.createOrganization(firestore, values);
        await userService.setOrganizationRef(firestore, auth.currentUser.uid, orgId);
        logAudit(auth, { action: "organization_created", targetType: "organization", targetId: orgId, details: values.name });
      }

      toast({
        title: "Perfil de la Organización Actualizado",
        description: "La información de la empresa ha sido guardada exitosamente.",
      });
      router.refresh();
    } catch (error) {
      console.error("Error saving organization:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la información de la empresa.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
            <CardHeader>
                <CardTitle>Información de la Empresa</CardTitle>
                <CardDescription>Estos datos son visibles para los candidatos que vean tus vacantes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nombre de la Empresa</FormLabel>
                        <FormControl><Input placeholder="Ej. Tech Innovators Inc." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="website" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Sitio Web</FormLabel>
                        <FormControl><Input placeholder="https://tu-empresa.com" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Descripción de la Empresa</FormLabel>
                        <FormControl><Textarea placeholder="Describe tu empresa, su cultura y su misión." rows={5} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </CardContent>
             <CardFooter className="flex justify-end gap-2">
                <Button variant="ghost" type="button" onClick={() => router.back()}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting || readOnly}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                </Button>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
