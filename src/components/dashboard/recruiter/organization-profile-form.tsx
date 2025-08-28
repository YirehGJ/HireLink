
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

const orgSchema = z.object({
  name: z.string().min(2, "El nombre de la organización es requerido."),
  website: z.string().url("Debe ser una URL válida."),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres."),
});

export function OrganizationProfileForm({ organization }: { organization: Organization | null | undefined }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<z.infer<typeof orgSchema>>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: organization?.name || "",
      website: organization?.website || "",
      description: organization?.description || "",
    },
  });

  function onSubmit(values: z.infer<typeof orgSchema>) {
    setIsSubmitting(true);
    console.log(values);
    
    setTimeout(() => {
        toast({
          title: "Perfil de la Organización Actualizado",
          description: "La información de la empresa ha sido guardada exitosamente.",
        });
        setIsSubmitting(false);
    }, 1500)
  }

  if (!organization) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>No se encontró el perfil de la organización.</CardDescription>
            </CardHeader>
        </Card>
    )
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
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                </Button>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
