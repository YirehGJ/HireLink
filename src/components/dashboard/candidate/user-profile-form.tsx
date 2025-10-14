
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, PlusCircle, FileUp } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { Candidate, Skill } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const skillSchema = z.object({
  name: z.string().min(1, "El nombre de la habilidad es requerido."),
  level: z.coerce.number().min(1, "El nivel debe ser entre 1 y 5.").max(5, "El nivel debe ser entre 1 y 5."),
  years: z.coerce.number().min(0, "Los años no pueden ser negativos.").max(60, "Los años no pueden exceder 60."),
});

const profileSchema = z.object({
  headline: z.string().min(5, "El titular debe tener al menos 5 caracteres."),
  location: z.string().min(2, "La ubicación es requerida."),
  yearsOfExperience: z.coerce.number().min(0, "Los años no pueden ser negativos.").max(60, "Los años no pueden exceder 60."),
  available: z.boolean().default(true),
  skills: z.array(skillSchema),
});

export function UserProfileForm({ profile }: { profile: Candidate | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      headline: profile?.headline || "",
      location: profile?.location || "",
      yearsOfExperience: profile?.yearsOfExperience || 0,
      available: profile?.available || true,
      skills: profile?.skills.map(s => ({...s, source: undefined})) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "skills",
  });

  function onSubmit(values: z.infer<typeof profileSchema>) {
    setIsSubmitting(true);
    console.log(values);
    
    setTimeout(() => {
        toast({
          title: "Perfil Actualizado",
          description: "Tu información ha sido guardada exitosamente.",
        });
        setIsSubmitting(false);
    }, 1500)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Información Principal</CardTitle>
                    <CardDescription>Estos son los datos que los reclutadores verán primero.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={form.control} name="headline" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Titular Profesional</FormLabel>
                            <FormControl><Input placeholder="Ej. Ingeniero de Software Senior" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="location" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ubicación</FormLabel>
                                <FormControl><Input placeholder="Ej. Ciudad de México" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="yearsOfExperience" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Años de Experiencia</FormLabel>
                                <FormControl><Input type="number" min="0" max="60" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                     <FormField control={form.control} name="available" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel>Disponible para ofertas</FormLabel>
                                <FormDescription>Activa esta opción si estás en búsqueda activa de empleo.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Habilidades</CardTitle>
                    <CardDescription>Detalla tus competencias técnicas y blandas. Serán usadas por la IA para las recomendaciones.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.length === 0 && (
                        <Alert>
                            <AlertTitle>¡Potencia tu perfil!</AlertTitle>
                            <AlertDescription>
                                Añade tus habilidades manualmente para mejorar las recomendaciones.
                            </AlertDescription>
                        </Alert>
                    )}
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-[1fr_auto_auto_auto] items-end gap-2 p-3 border rounded-lg">
                            <FormField control={form.control} name={`skills.${index}.name`} render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={index !== 0 ? "sr-only" : ""}>Habilidad</FormLabel>
                                    <FormControl><Input placeholder="Ej. React" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                             )} />
                            <FormField control={form.control} name={`skills.${index}.years`} render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={index !== 0 ? "sr-only" : ""}>Años</FormLabel>
                                    <FormControl><Input type="number" min="0" max="60" className="w-20" placeholder="3" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name={`skills.${index}.level`} render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={index !== 0 ? "sr-only" : ""}>Nivel (1-5)</FormLabel>
                                    <FormControl><Input type="number" min="1" max="5" className="w-20" placeholder="4" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Eliminar habilidad</span>
                            </Button>
                        </div>
                    ))}
                     <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => append({ name: "", years: 0, level: 3 })}
                        >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Habilidad
                    </Button>
                </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Currículum Vitae (CV)</CardTitle>
                    <CardDescription>Sube tu CV para que la IA extraiga tus habilidades y los reclutadores puedan verlo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Alert>
                        <FileUp className="h-4 w-4" />
                        <AlertTitle>No hay un CV subido</AlertTitle>
                        <AlertDescription>
                           Sube tu CV en formato PDF para completar tu perfil.
                        </AlertDescription>
                    </Alert>
                    <Input id="cv-upload" type="file" accept=".pdf" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Guardar Cambios</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Asegúrate de que toda tu información sea correcta antes de guardar.
                    </p>
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-2">
                     <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Perfil
                    </Button>
                    <Button variant="ghost" type="button" onClick={() => router.back()}>Cancelar</Button>
                </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
