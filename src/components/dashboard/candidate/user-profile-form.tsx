
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, PlusCircle, FileUp, BrainCircuit, Sparkles, Briefcase, GraduationCap } from "lucide-react";
import React from "react";
import * as pdfjsLib from "pdfjs-dist";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { Candidate } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth, useFirestore } from "@/firebase";
import { candidateService } from "@/firebase/firestore/candidate-service";
import { callAuthedApi } from "@/lib/api-client";
import { useApp } from "@/components/providers/app-provider";


const skillSchema = z.object({
  name: z.string().min(1, "El nombre de la habilidad es requerido."),
  level: z.coerce.number().min(1, "El nivel debe ser entre 1 y 5.").max(5, "El nivel debe ser entre 1 y 5."),
  years: z.coerce.number().min(0, "Los años no pueden ser negativos.").max(60, "Los años no pueden exceder 60."),
});

const experienceSchema = z.object({
  title: z.string().min(1, "El puesto es requerido."),
  company: z.string().min(1, "La empresa es requerida."),
  startDate: z.string().max(40).default(""),
  endDate: z.string().max(40).default(""),
  description: z.string().max(500).default(""),
});

const educationSchema = z.object({
  institution: z.string().min(1, "La institución es requerida."),
  degree: z.string().max(150).default(""),
  field: z.string().max(150).default(""),
  startDate: z.string().max(40).default(""),
  endDate: z.string().max(40).default(""),
});

const profileSchema = z.object({
  headline: z.string().min(5, "El titular debe tener al menos 5 caracteres."),
  location: z.string().min(2, "La ubicación es requerida."),
  yearsOfExperience: z.coerce.number().min(0, "Los años no pueden ser negativos.").max(60, "Los años no pueden exceder 60."),
  available: z.boolean().default(true),
  skills: z.array(skillSchema).max(60),
  experience: z.array(experienceSchema).max(20),
  education: z.array(educationSchema).max(15),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Forma que devuelve /api/ai/extract-cv (ver extract-cv-data-flow.ts).
interface CvSuggestions {
  headline: string;
  location: string;
  yearsOfExperience: number;
  skills: ProfileFormValues["skills"];
  experience: ProfileFormValues["experience"];
  education: ProfileFormValues["education"];
  summary: string;
}

export function UserProfileForm({ profile }: { profile: Candidate | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user: appUser } = useApp();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isParsingCv, setIsParsingCv] = React.useState(false);
  // Sugerencias sin aplicar aún: el candidato las revisa antes de que toquen el formulario.
  const [suggestions, setSuggestions] = React.useState<CvSuggestions | null>(null);
  const [pendingCvText, setPendingCvText] = React.useState("");
  const [cvAnalysis, setCvAnalysis] = React.useState<{ summary: string; text: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }, []);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      headline: profile?.headline || "",
      location: profile?.location || "",
      yearsOfExperience: profile?.yearsOfExperience || 0,
      available: profile?.available || true,
      skills: profile?.skills?.map(s => ({...s, source: undefined})) || [],
      experience: profile?.experience || [],
      education: profile?.education || [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: "skills" });
  const expArray = useFieldArray({ control: form.control, name: "experience" });
  const eduArray = useFieldArray({ control: form.control, name: "education" });

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
        experience: profile.experience || [],
        education: profile.education || [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  async function onSubmit(values: ProfileFormValues) {
    if (!firestore || !auth || !auth.currentUser) return;
    setIsSubmitting(true);

    try {
      await candidateService.saveProfile(firestore, auth.currentUser.uid, {
        ...values,
        fullName: appUser?.fullName,
        email: appUser?.email,
        ...(cvAnalysis ? { cvSummary: cvAnalysis.summary, cvText: cvAnalysis.text } : {}),
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
    setSuggestions(null);
    toast({
        title: "Procesando CV...",
        description: "La IA está extrayendo tu información. Esto puede tardar un momento.",
    });

    try {
        const pdfData = new Uint8Array(await file.arrayBuffer());
        // isEvalSupported:false neutraliza la vulnerabilidad de ejecución de código de
        // pdf.js (CVE-2024-4367) al abrir PDFs maliciosos; también se limita el tamaño.
        if (file.size > 5 * 1024 * 1024) throw new Error("El PDF supera los 5 MB.");
        const doc = await pdfjsLib.getDocument({ data: pdfData, isEvalSupported: false } as any).promise;
        let text = '';
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item: any) => item.str).join(' ') + '\n';
        }

        const cleanedText = text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
        if (cleanedText.length < 30) {
            throw new Error("El PDF no contiene texto legible (¿es una imagen escaneada?).");
        }

        if (!auth) throw new Error("No hay sesión activa.");
        // 8000 caracteres alcanza para cualquier CV real y evita agotar el
        // presupuesto de tokens por minuto de la cuenta compartida de Groq.
        const trimmedText = cleanedText.slice(0, 8000);
        const extractedData: CvSuggestions = await callAuthedApi(auth, "/api/ai/extract-cv", { cvText: trimmedText });

        if (extractedData) {
            // No se toca el formulario todavía: el candidato revisa la vista previa
            // (skills, experiencia, educación) y decide si aplicar las sugerencias.
            setSuggestions(extractedData);
            setPendingCvText(trimmedText);

            toast({
                title: "¡CV analizado por la IA!",
                description: "Revisa la vista previa y pulsa \"Aplicar sugerencias\" para llenar tu perfil.",
            });
        } else {
             throw new Error("No data extracted");
        }
    } catch (error) {
        console.error("Error parsing CV:", error);
        toast({
            title: "Error al procesar CV",
            description: error instanceof Error ? error.message : "No se pudo extraer la información. Intenta de nuevo o llena el formulario manualmente.",
            variant: "destructive"
        });
    } finally {
        setIsParsingCv(false);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  }

  function applySuggestions() {
    if (!suggestions) return;
    form.setValue('headline', suggestions.headline, { shouldValidate: true });
    form.setValue('location', suggestions.location, { shouldValidate: true });
    form.setValue('yearsOfExperience', suggestions.yearsOfExperience, { shouldValidate: true });
    replace(suggestions.skills ?? []);
    expArray.replace(suggestions.experience ?? []);
    eduArray.replace(suggestions.education ?? []);

    // El texto y el resumen del CV se guardan con el perfil para que la IA
    // los use al calcular la compatibilidad con cada vacante.
    setCvAnalysis({ summary: suggestions.summary, text: pendingCvText });
    setSuggestions(null);

    toast({
        title: "Sugerencias aplicadas",
        description: "Revisa los campos del formulario y pulsa \"Guardar Perfil\" para confirmarlos.",
    });
  }

  function discardSuggestions() {
    setSuggestions(null);
    setPendingCvText("");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {suggestions && (
                <Card className="border-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Vista previa: sugerencias de la IA</CardTitle>
                        <CardDescription>
                            Esto es lo que la IA leyó en tu CV. No se ha guardado nada todavía: revisa y decide si aplicarlo a tu perfil.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                            <div><p className="font-medium">Titular</p><p className="text-muted-foreground">{suggestions.headline || "—"}</p></div>
                            <div><p className="font-medium">Ubicación</p><p className="text-muted-foreground">{suggestions.location || "—"}</p></div>
                            <div><p className="font-medium">Años de experiencia</p><p className="text-muted-foreground">{suggestions.yearsOfExperience}</p></div>
                        </div>
                        <div>
                            <p className="font-medium text-sm mb-1.5">Habilidades ({suggestions.skills?.length ?? 0})</p>
                            <div className="flex flex-wrap gap-2">
                                {(suggestions.skills ?? []).length === 0 && <p className="text-sm text-muted-foreground">Ninguna detectada.</p>}
                                {(suggestions.skills ?? []).map((s, i) => <Badge key={i} variant="secondary">{s.name} · {s.level}/5</Badge>)}
                            </div>
                        </div>
                        <div>
                            <p className="font-medium text-sm mb-1.5 flex items-center gap-1.5"><Briefcase className="h-4 w-4" />Experiencia ({suggestions.experience?.length ?? 0})</p>
                            {(suggestions.experience ?? []).length === 0 && <p className="text-sm text-muted-foreground">Ninguna detectada.</p>}
                            <ul className="space-y-1">
                                {(suggestions.experience ?? []).map((e, i) => (
                                    <li key={i} className="text-sm text-muted-foreground">
                                        <span className="text-foreground font-medium">{e.title}</span> en {e.company} ({e.startDate} – {e.endDate || "Presente"})
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <p className="font-medium text-sm mb-1.5 flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />Educación ({suggestions.education?.length ?? 0})</p>
                            {(suggestions.education ?? []).length === 0 && <p className="text-sm text-muted-foreground">Ninguna detectada.</p>}
                            <ul className="space-y-1">
                                {(suggestions.education ?? []).map((e, i) => (
                                    <li key={i} className="text-sm text-muted-foreground">
                                        <span className="text-foreground font-medium">{e.degree || e.field}</span> en {e.institution} ({e.startDate} – {e.endDate || "En curso"})
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <Alert>
                            <BrainCircuit className="h-4 w-4" />
                            <AlertDescription>{suggestions.summary}</AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="gap-2">
                        <Button type="button" onClick={applySuggestions}>Aplicar sugerencias</Button>
                        <Button type="button" variant="ghost" onClick={discardSuggestions}>Descartar</Button>
                    </CardFooter>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Información Principal</CardTitle>
                    <CardDescription>Estos son los datos que los reclutadores verán primero. Puedes subir tu CV para autocompletar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {(cvAnalysis?.summary || profile?.cvSummary) && (
                        <Alert>
                            <BrainCircuit className="h-4 w-4" />
                            <AlertTitle>Resumen de tu CV (analizado por la IA)</AlertTitle>
                            <AlertDescription>
                                {cvAnalysis?.summary || profile?.cvSummary}
                                {cvAnalysis && <span className="block mt-2 font-medium">Revisa que sea correcto y pulsa "Guardar Perfil" para que la IA lo use al buscar vacantes.</span>}
                            </AlertDescription>
                        </Alert>
                    )}
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

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" />Experiencia Laboral</CardTitle>
                    <CardDescription>Tus puestos anteriores. La IA los sugiere al analizar tu CV; también puedes editarlos a mano.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {expArray.fields.length === 0 && (
                        <p className="text-sm text-muted-foreground">Aún no has agregado experiencia laboral.</p>
                    )}
                    {expArray.fields.map((field, index) => (
                        <div key={field.id} className="space-y-3 p-3 border rounded-lg">
                            <div className="flex justify-end">
                                <Button type="button" variant="ghost" size="icon" onClick={() => expArray.remove(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    <span className="sr-only">Eliminar experiencia</span>
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <FormField control={form.control} name={`experience.${index}.title`} render={({ field }) => (
                                    <FormItem><FormLabel>Puesto</FormLabel><FormControl><Input placeholder="Ej. Desarrollador Backend" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name={`experience.${index}.company`} render={({ field }) => (
                                    <FormItem><FormLabel>Empresa</FormLabel><FormControl><Input placeholder="Ej. Acme Inc." {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField control={form.control} name={`experience.${index}.startDate`} render={({ field }) => (
                                    <FormItem><FormLabel>Inicio</FormLabel><FormControl><Input placeholder="Ene 2021" {...field} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name={`experience.${index}.endDate`} render={({ field }) => (
                                    <FormItem><FormLabel>Fin</FormLabel><FormControl><Input placeholder="Presente" {...field} /></FormControl></FormItem>
                                )} />
                            </div>
                            <FormField control={form.control} name={`experience.${index}.description`} render={({ field }) => (
                                <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea rows={2} placeholder="Responsabilidades o logros principales" {...field} /></FormControl></FormItem>
                            )} />
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => expArray.append({ title: "", company: "", startDate: "", endDate: "", description: "" })}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Experiencia
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" />Educación</CardTitle>
                    <CardDescription>Tus estudios. La IA los sugiere al analizar tu CV; también puedes editarlos a mano.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {eduArray.fields.length === 0 && (
                        <p className="text-sm text-muted-foreground">Aún no has agregado educación.</p>
                    )}
                    {eduArray.fields.map((field, index) => (
                        <div key={field.id} className="space-y-3 p-3 border rounded-lg">
                            <div className="flex justify-end">
                                <Button type="button" variant="ghost" size="icon" onClick={() => eduArray.remove(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    <span className="sr-only">Eliminar educación</span>
                                </Button>
                            </div>
                            <FormField control={form.control} name={`education.${index}.institution`} render={({ field }) => (
                                <FormItem><FormLabel>Institución</FormLabel><FormControl><Input placeholder="Ej. Universidad UNE" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <FormField control={form.control} name={`education.${index}.degree`} render={({ field }) => (
                                    <FormItem><FormLabel>Título</FormLabel><FormControl><Input placeholder="Ej. Ingeniería en Sistemas" {...field} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name={`education.${index}.field`} render={({ field }) => (
                                    <FormItem><FormLabel>Área</FormLabel><FormControl><Input placeholder="Ej. Computación" {...field} /></FormControl></FormItem>
                                )} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField control={form.control} name={`education.${index}.startDate`} render={({ field }) => (
                                    <FormItem><FormLabel>Inicio</FormLabel><FormControl><Input placeholder="2018" {...field} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name={`education.${index}.endDate`} render={({ field }) => (
                                    <FormItem><FormLabel>Fin</FormLabel><FormControl><Input placeholder="2022" {...field} /></FormControl></FormItem>
                                )} />
                            </div>
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => eduArray.append({ institution: "", degree: "", field: "", startDate: "", endDate: "" })}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Educación
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
                           Selecciona tu CV en formato PDF. La IA solo lee su contenido para sugerir tu perfil: el archivo no se almacena.
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
                    {isParsingCv && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />Analizando con IA…
                        </p>
                    )}
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
