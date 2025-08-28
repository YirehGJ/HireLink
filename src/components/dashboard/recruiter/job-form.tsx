"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { Job } from "@/lib/types";

const jobSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  location: z.string().min(2, "La ubicación es requerida."),
  seniority: z.enum(["intern", "junior", "mid", "senior", "lead"]),
  remoteAllowed: z.boolean().default(false),
  descriptionMd: z.string().min(50, "La descripción debe tener al menos 50 caracteres."),
});

export function JobForm({ job }: { job?: Job }) {
  const router = useRouter();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof jobSchema>>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: job?.title || "",
      location: job?.location || "",
      seniority: job?.seniority || "junior",
      remoteAllowed: job?.remoteAllowed || false,
      descriptionMd: job?.descriptionMd || "",
    },
  });

  function onSubmit(values: z.infer<typeof jobSchema>) {
    console.log(values);
    toast({
      title: "Vacante Guardada",
      description: "La vacante ha sido guardada exitosamente.",
    });
    router.push("/dashboard");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="p-6 space-y-6">
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
                            <FormDescription>¿Se puede trabajar en esta posición de forma remota?</FormDescription>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )} />
            </div>

            <FormField control={form.control} name="descriptionMd" render={({ field }) => (
                <FormItem>
                    <FormLabel>Descripción de la Vacante</FormLabel>
                    <FormControl><Textarea placeholder="Describe las responsabilidades, requerimientos, etc. Soporta Markdown." rows={10} {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancelar</Button>
                <Button type="submit">Guardar Vacante</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
