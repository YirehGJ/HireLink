
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, PlusCircle, FileUp, BrainCircuit } from "lucide-react";
import React from "react";
import * as pdfjsLib from "pdfjs-dist";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { Candidate, Skill } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { extractCvData } from "@/ai/flows/extract-cv-data-flow";
import { useAuth, useFirestore } from "@/firebase";
import { candidateService } from "@/firebase/firestore/candidate-service";
import { callAuthedApi } from "@/lib/api-client";


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
  const auth = useAuth();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isParsingCv, setIsParsingCv] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }, []);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      headline: profile?.headline || "",
      location: profile?.location || "",
      yearsOfExperience: profile?.yearsOfExperience || 0,
      available: profile?.available || true,
      skills: profile?.skills?.map(s => ({...s, source: undefined})) || [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "skills",
  });

  // react-hook-form only reads `defaultValues` once at mount, so if `profile`
  // arrives (or changes) after that, re-sync the form fields explicitly.
  React.useEffect(() => {
    if (profile) {
      form.reset({
        headline: profile.headline || "",
        location: profile.location || "",
        yearsOfExperience: profile.yearsOfExperience || 0,
        available: profile.available ?? true,
        skills: profile.skills?.map(s => ({ ...s, source: undefined })) || [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!firestore || !auth || !auth.currentUser) return;
    setIsSubmitting(true);

    try {
      await candidateService.saveProfile(firestore, auth.currentUser.uid, {
        ...values,
        skills: values.skills.map((s) => ({ ...s, source: "manual" })),
      });

      toast({
        title: "Perfil Actualizado",
        description: "Tu información ha sido guardada exitosamente.",
      });

      // Dispara el recálculo de recomendaciones en segundo plano (no bloquea la UI).
      callAuthedApi(auth, "/api/recommendations/generate").catch((err) =>
        console.error("No se pudieron recalcular las recomendaciones:", err)
      );

      router.refresh();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar tu perfil. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
        toast({
            title: "Archivo inválido",
            description: "Por favor, selecciona un archivo PDF.",
            variant: "destructive"
        });
        return;
    }
    
    setIsParsingCv(true);
    toast({
        title: "Procesando CV...",
        description: "La IA está extrayendo tu información. Esto puede tardar un momento.",
    });

    try {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = async () => {
            const pdfData = new Uint8Array(reader.result as ArrayBuffer);
            const doc = await pdfjsLib.getDocument({ data: pdfData }).promise;
            let text = '';
            for (let i = 1; i <= doc.numPages; i++) {
                const page = await doc.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map((item: any) => item.str).join(' ');
            }
            
            const cleanedText = text.replace(/\s\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();

            const extractedData = await extractCvData({ cvText: cleanedText });

            if (extractedData) {
                form.setValue('headline', extractedData.headline, { shouldValidate: true });
                form.setValue('location', extractedData.location, { shouldValidate: true });
                form.setValue('yearsOfExperience', extractedData.yearsOfExperience, { shouldValidate: true });
                
                replace(extractedData.skills);

                toast({
                    title: "¡Información extraída!",
                    description: "Tu formulario ha sido actualizado con los datos de tu CV.",
                });
            } else {
                 throw new Error("No data extracted");
            }
        }
    } catch (error) {
        console.error("Error parsing CV:", error);
        toast({
            title: "Error al procesar CV",
            description: "No se pudo extraer la información. Por favor, intenta de nuevo o llena el formulario manualmente.",
            variant: "destructive"
        });
    } finally {
        setIsParsingCv(false);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Información Principal</CardTitle>
                    <CardDescription>Estos son los datos que los reclutadores verán primero. Puedes subier tu CV para autocompletar.</CardDescription>
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
                            <BrainCircuit className="h-4 w-4" />
                            <AlertTitle>¡Potencia tu perfil!</AlertTitle>
                            <AlertDescription>
                                Sube tu CV para que la IA extraiga tus habilidades o añádelas manualmente.
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
                                    <FormControl><Input type="number" min="0" className="w-20" placeholder="3" {...field} /></FormControl>
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
                    <CardDescription>Sube tu CV para que la IA extraiga tus habilidades y rellene el formulario.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Alert>
                        <FileUp className="h-4 w-4" />
                        <AlertTitle>Sube tu CV</AlertTitle>
                        <AlertDescription>
                           Selecciona tu CV en formato PDF para autocompletar tu perfil.
                        </AlertDescription>
                    </Alert>
                    <Input
                        id="cv-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleCvUpload}
                        disabled={isParsingCv}
                        ref={fileInputRef}
                    />
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
                     <Button type="submit" disabled={isSubmitting || isParsingCv}>
                        {(isSubmitting || isParsingCv) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isParsingCv ? 'Analizando CV...' : (isSubmitting ? 'Guardando...' : 'Guardar Perfil')}
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
