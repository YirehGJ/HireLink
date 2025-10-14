
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import React from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { Job } from "@/lib/types";
import { generateJobDescription } from "@/ai/flows/generate-job-description-flow";

const jobSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  location: z.string().min(2, "La ubicación es requerida."),
  seniority: z.enum(["intern", "junior", "mid", "senior", "lead"]),
  remoteAllowed: z.boolean().default(false),
  descriptionMd: z.string().min(50, "La descripción debe tener al menos 50 caracteres."),
  searchTags: z.string().min(3, "Ingresa al menos una habilidad o palabra clave."),
});

export function JobForm({ job }: { job?: Job }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  
  const form = useForm<z.infer<typeof jobSchema>>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: job?.title || "",
      location: job?.location || "",
      seniority: job?.seniority || "junior",
      remoteAllowed: job?.remoteAllowed || false,
      descriptionMd: job?.descriptionMd || "",
      searchTags: job?.searchTags?.join(', ') || "",
    },
  });

  const handleGenerateDescription = async () => {
    const { title, seniority, searchTags } = form.getValues();
    if (!title || !seniority || !searchTags) {
        toast({
            title: "Faltan datos",
            description: "Por favor, completa el título, seniority y habilidades para generar la descripción.",
            variant: "destructive"
        });
        return;
    }

    setIsGenerating(true);
    try {
        const result = await generateJobDescription({
            title,
            seniority,
            searchTags: searchTags.split(',').map(tag => tag.trim()),
        });
        if (result.descriptionMd) {
            form.setValue("descriptionMd", result.descriptionMd, { shouldValidate: true });
            toast({
                title: "¡Descripción generada!",
                description: "La descripción del puesto ha sido creada por la IA.",
            });
        }
    } catch (error) {
        console.error("Error generating description:", error);
        toast({
            title: "Error de la IA",
            description: "No se pudo generar la descripción en este momento.",
            variant: "destructive"
        });
    } finally {
        setIsGenerating(false);
    }
  }

  function onSubmit(values: z.infer<typeof jobSchema>) {
    setIsSubmitting(true);
    console.log({
        ...values,
        searchTags: values.searchTags.split(',').map(tag => tag.trim()),
    });
    setTimeout(() => {
        toast({
          title: job ? "Vacante Actualizada" : "Vacante Creada",
          description: "La vacante ha sido guardada exitosamente.",
        });
        setIsSubmitting(false);
        if (!job) {
            router.push("/dashboard/jobs");
        }
    }, 1500)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Título de la Vacante</FormLabel>
                        <FormControl><Input placeholder="Ej. Ingeniero de Software" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ubicación</FormLabel>
                        <FormControl><Input placeholder="Ej. Ciudad de México, Remoto" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="seniority" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Seniority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="intern">Intern</SelectItem>
                                <SelectItem value="junior">Junior</SelectItem>
                                <SelectItem value="mid">Mid-level</SelectItem>
                                <SelectItem value="senior">Senior</SelectItem>
                                <SelectItem value="lead">Lead</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="remoteAllowed" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 h-full">
                        <div className="space-y-0.5">
                            <FormLabel>Remoto Permitido</FormLabel>
                            <FormDescription className="text-xs">¿Se puede trabajar en esta posición de forma remota?</FormDescription>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )} />
            </div>
            
            <FormField control={form.control} name="searchTags" render={({ field }) => (
                <FormItem>
                    <FormLabel>Habilidades y Palabras Clave</FormLabel>
                    <FormControl><Input placeholder="Ej. React, Node.js, Liderazgo" {...field} /></FormControl>
                    <FormDescription>Separa las habilidades con comas. Serán usadas por la IA.</FormDescription>
                    <FormMessage />
                </FormItem>
            )} />

            <FormField control={form.control} name="descriptionMd" render={({ field }) => (
                <FormItem>
                    <div className="flex justify-between items-center">
                        <FormLabel>Descripción de la Vacante</FormLabel>
                        <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            {isGenerating ? "Generando..." : "Generar con IA"}
                        </Button>
                    </div>
                    <FormControl><Textarea placeholder="Describe las responsabilidades, requerimientos, etc. Soporta Markdown." rows={10} {...field} /></FormControl>
                     <FormDescription>
                        Puedes usar Markdown para dar formato al texto.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" type="button" onClick={() => router.back()}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting || isGenerating}>
                    {(isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {job ? "Guardar Cambios" : "Crear Vacante"}
                </Button>
            </div>

      </form>
    </Form>
  );
}
