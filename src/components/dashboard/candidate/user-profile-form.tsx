
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, PlusCircle, FileUp, BrainCircuit, Sparkles, Briefcase, GraduationCap } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Candidate } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth, useFirestore } from "@/firebase";
import { candidateService } from "@/firebase/firestore/candidate-service";
import { aiUnavailableMessage, callAuthedApi } from "@/lib/api-client";
import { useApp } from "@/components/providers/app-provider";
import { SENIORITY_OPTIONS } from "@/lib/format";
import { extractPdfText } from "@/lib/pdf-text";

// Años y niveles son números enteros: antes un valor con decimales (la IA devuelve «4.8» o «2.5») hacía que el
// navegador bloqueara el envío sin mostrar ningún aviso y «Guardar Perfil» parecía no funcionar.
const skillSchema = z.object({
  name: z.string().trim().min(1, "El nombre de la habilidad es requerido.").max(60, "Máximo 60 caracteres."),
  level: z.coerce.number().int("Usa un número entero.").min(1, "El nivel debe ser entre 1 y 5.").max(5, "El nivel debe ser entre 1 y 5."),
  years: z.coerce.number().int("Usa años completos.").min(0, "Los años no pueden ser negativos.").max(60, "Los años no pueden exceder 60."),
});

const experienceSchema = z.object({
  title: z.string().trim().min(1, "El puesto es requerido.").max(150, "Máximo 150 caracteres."),
  company: z.string().trim().max(150, "Máximo 150 caracteres.").default(""),
  startDate: z.string().max(40, "Máximo 40 caracteres.").default(""),
  endDate: z.string().max(40, "Máximo 40 caracteres.").default(""),
  description: z.string().max(500, "Máximo 500 caracteres.").default(""),
});

const educationSchema = z.object({
  institution: z.string().trim().min(1, "La institución es requerida.").max(150, "Máximo 150 caracteres."),
  degree: z.string().max(150, "Máximo 150 caracteres.").default(""),
  field: z.string().max(150, "Máximo 150 caracteres.").default(""),
  startDate: z.string().max(40, "Máximo 40 caracteres.").default(""),
  endDate: z.string().max(40, "Máximo 40 caracteres.").default(""),
});

// Los máximos coinciden con las reglas de seguridad (validCandidate): el error se explica en el formulario.
const profileSchema = z.object({
  headline: z.string().trim().min(5, "El titular debe tener al menos 5 caracteres.").max(200, "El titular no puede pasar de 200 caracteres."),
  location: z.string().trim().min(2, "La ubicación es requerida.").max(200, "La ubicación no puede pasar de 200 caracteres."),
  yearsOfExperience: z.coerce.number().int("Usa años completos.").min(0, "Los años no pueden ser negativos.").max(60, "Los años no pueden exceder 60."),
  targetSeniority: z.enum(["none", "intern", "junior", "mid", "senior", "lead"]).default("none"),
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


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      headline: profile?.headline || "",
      location: profile?.location || "",
      yearsOfExperience: profile?.yearsOfExperience || 0,
      targetSeniority: profile?.targetSeniority || "none",
      available: profile?.available ?? true,
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
        targetSeniority: profile.targetSeniority || "none",
        available: profile.available ?? true,
        skills: profile.skills?.map(s => ({ ...s, source: undefined })) || [],
        experience: profile.experience || [],
        education: profile.education || [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // El formulario tiene campos con errores: se avisa y React Hook Form lleva el foco al primero.
  function onInvalid() {
    toast({
      title: "Revisa el formulario",
      description: "Hay campos con errores (marcados en rojo). Corrígelos y vuelve a guardar.",
      variant: "destructive",
    });
  }
  async function onSubmit(values: ProfileFormValues) {
    if (!firestore || !auth || !auth.currentUser) return;
    setIsSubmitting(true);

    try {
      await candidateService.saveProfile(firestore, auth.currentUser.uid, {
        ...values,
        targetSeniority: values.targetSeniority === "none" ? undefined : values.targetSeniority,
        fullName: appUser?.fullName,
        email: appUser?.email,
        ...(cvAnalysis ? { cvSummary: cvAnalysis.summary, cvText: cvAnalysis.text } : {}),
        skills: values.skills.map((s) => ({ ...s, source: "manual" })),
      });

      toast({
        title: "Perfil Actualizado",
        description: "Tu información ha sido guardada exitosamente.",
      });

      // Dispara el recálculo de recomendaciones en segundo plano (no bloquea la UI) y, si la IA no pudo, lo explica
      // (antes la pantalla solo decía «No hay recomendaciones por ahora» y la persona creía que su perfil estaba mal).
      callAuthedApi(auth, "/api/recommendations/generate")
        .then((res) => {
          if (res?.aiLimit) {
            toast({ title: "Recomendaciones incompletas", description: "La IA alcanzó su límite de uso por hoy. Las que faltan se calcularán la próxima vez que guardes tu perfil." });
          } else if (res?.failed) {
            toast({ title: "Algunas recomendaciones no se calcularon", description: "La IA devolvió respuestas incompletas. Guarda de nuevo tu perfil en unos minutos para completarlas." });
          }
        })
        .catch((err) => {
          console.error("No se pudieron recalcular las recomendaciones:", err);
          toast({
            title: "Tu perfil se guardó, pero no se calcularon tus recomendaciones",
            description: aiUnavailableMessage(err) ?? "Inténtalo de nuevo en unos minutos.",
            variant: "destructive",
          });
        });

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
        // pdf.js se carga aquí, solo cuando se sube un CV (ver src/lib/pdf-text.ts).
        const cleanedText = await extractPdfText(file);
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
    // Solo se aplica lo que la IA sí encontró: un campo vacío no debe borrar lo que la persona ya tenía escrito.
    if (suggestions.headline) form.setValue('headline', suggestions.headline, { shouldValidate: true });
    if (suggestions.location) form.setValue('location', suggestions.location, { shouldValidate: true });
    if (suggestions.yearsOfExperience > 0) form.setValue('yearsOfExperience', suggestions.yearsOfExperience, { shouldValidate: true });
    if (suggestions.skills?.length) replace(suggestions.skills);
    if (suggestions.experience?.length) expArray.replace(suggestions.experience);
    if (suggestions.education?.length) eduArray.replace(suggestions.education);

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
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} noValidate>
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
                                <FormControl><Input type="number" min="0" max="60" step="1" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="targetSeniority" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Seniority al que aspiras</FormLabel>
                            <FormDescription>Los reclutadores pueden filtrar candidatos por este nivel al buscar talento.</FormDescription>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Sin preferencia" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">Sin preferencia</SelectItem>
                                    {SENIORITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
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
                                    <FormControl><Input type="number" min="0" max="60" step="1" className="w-20" placeholder="3" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name={`skills.${index}.level`} render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={index !== 0 ? "sr-only" : ""}>Nivel (1-5)</FormLabel>
                                    <FormControl><Input type="number" min="1" max="5" step="1" className="w-20" placeholder="4" {...field} /></FormControl>
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
                                    <FormItem><FormLabel>Inicio</FormLabel><FormControl><Input placeholder="Ene 2021" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name={`experience.${index}.endDate`} render={({ field }) => (
                                    <FormItem><FormLabel>Fin</FormLabel><FormControl><Input placeholder="Presente" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <FormField control={form.control} name={`experience.${index}.description`} render={({ field }) => (
                                <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea rows={2} placeholder="Responsabilidades o logros principales" {...field} /></FormControl><FormMessage /></FormItem>
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
                                    <FormItem><FormLabel>Título</FormLabel><FormControl><Input placeholder="Ej. Ingeniería en Sistemas" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name={`education.${index}.field`} render={({ field }) => (
                                    <FormItem><FormLabel>Área</FormLabel><FormControl><Input placeholder="Ej. Computación" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField control={form.control} name={`education.${index}.startDate`} render={({ field }) => (
                                    <FormItem><FormLabel>Inicio</FormLabel><FormControl><Input placeholder="2018" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name={`education.${index}.endDate`} render={({ field }) => (
                                    <FormItem><FormLabel>Fin</FormLabel><FormControl><Input placeholder="2022" {...field} /></FormControl><FormMessage /></FormItem>
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
                        aria-label="Elegir el CV en PDF (máximo 5 MB)"
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
